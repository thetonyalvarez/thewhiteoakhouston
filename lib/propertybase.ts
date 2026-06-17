/**
 * Propertybase / Salesforce HTTP client.
 *
 * Responsibilities:
 *   1. Obtain an access token via the OAuth 2.0 Client Credentials Flow
 *      (server-to-server). Tokens are cached in-module so a warm serverless
 *      instance doesn't re-auth on every lead, and refreshed once on any 401.
 *   2. Resolve the Contact for a submission — look up by email, create one if
 *      none exists (Propertybase's Contact is the durable "business card").
 *   3. Create the Inquiry (`pba__Request__c`) linked to that Contact.
 *
 * `submitInquiry(lead, context)` is the public entry point and runs all three
 * steps. The lower-level pieces are exported for unit testing.
 *
 * Wire shapes (proven against Nan's sandbox org):
 *   POST {instance}/services/oauth2/token            (grant_type=client_credentials)
 *   GET  {instance}/services/data/v60.0/query/?q=... (Contact lookup by email)
 *   POST {instance}/services/data/v60.0/sobjects/Contact
 *   POST {instance}/services/data/v60.0/sobjects/pba__Request__c
 *
 * All failures surface as `PropertybaseError` so the route can fall back to an
 * email and never silently drop a lead.
 */

import { getInstanceUrl, getClientId, getClientSecret } from "./propertybase-config";
import {
  buildContactPayload,
  buildInquiryPayload,
  type SfPayload,
} from "./propertybase-mapping";
import { FetchError, fetchWithTimeout } from "./http";
import type { Lead } from "./validate-lead";
import type { InquiryContext } from "./validate-inquiry-context";

const SF_API_VERSION = "v60.0";
const TOKEN_PATH = "/services/oauth2/token";
// Kept well below the route's maxDuration so even the worst-case path
// (token + lookup + contact create + inquiry create) leaves budget for the
// email fallback to fire before the platform kills the function.
const REQUEST_TIMEOUT_MS = 5_000;

// Client Credentials Flow tokens are session-scoped and the token response
// does not include `expires_in`, so we refresh on a conservative interval
// AND defensively re-auth once on any 401. Either path keeps leads flowing.
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

type TokenResponse = {
  access_token?: string;
  instance_url?: string;
};

type CreateResponse = {
  id?: string;
};

type QueryResponse = {
  records?: Array<{ Id?: string }>;
};

type CachedToken = {
  accessToken: string;
  instanceUrl: string;
  fetchedAt: number;
};

export type SubmitResult = {
  contactId: string;
  inquiryId: string;
  contactCreated: boolean;
};

/**
 * Raised for any non-success outcome (token failure, non-2xx response,
 * timeout, malformed body). Carries the HTTP status and raw detail so the
 * fallback email and server logs record exactly what Propertybase said.
 */
export class PropertybaseError extends Error {
  readonly status?: number;
  readonly detail?: string;

  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = "PropertybaseError";
    this.status = status;
    this.detail = detail;
  }
}

// Module-scoped token cache. Survives only within a single warm serverless
// instance; cold starts simply re-auth.
let cachedToken: CachedToken | null = null;

// Shared transport + PB error shaping: a timeout or network failure surfaces
// as a PropertybaseError so the route's catch always sees one error type.
const pbFetch = async (url: string, init: RequestInit): Promise<Response> => {
  try {
    return await fetchWithTimeout(url, init, REQUEST_TIMEOUT_MS);
  } catch (err) {
    if (err instanceof FetchError) {
      throw new PropertybaseError(
        err.timedOut ? "Propertybase request timed out" : "Propertybase request failed",
        undefined,
        err.cause instanceof Error ? err.cause.message : err.message,
      );
    }
    throw err;
  }
};

const safeText = async (res: Response): Promise<string> => {
  try {
    return await res.text();
  } catch {
    return "";
  }
};

// Escape a value for safe interpolation into a SOQL string literal.
const escapeSoql = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const fetchToken = async (): Promise<CachedToken> => {
  const instanceUrl = getInstanceUrl();
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: getClientId(),
    client_secret: getClientSecret(),
  });

  const res = await pbFetch(`${instanceUrl}${TOKEN_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new PropertybaseError(
      `Token request failed (${res.status})`,
      res.status,
      await safeText(res),
    );
  }

  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!json.access_token) {
    throw new PropertybaseError(
      "Token response missing access_token",
      res.status,
      JSON.stringify(json),
    );
  }

  return {
    accessToken: json.access_token,
    // Salesforce returns the instance to call against; prefer it over the
    // login host (they can differ).
    instanceUrl: json.instance_url ?? instanceUrl,
    fetchedAt: Date.now(),
  };
};

const getAccessToken = async (): Promise<CachedToken> => {
  if (cachedToken && Date.now() - cachedToken.fetchedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }
  cachedToken = await fetchToken();
  return cachedToken;
};

/**
 * Authenticated request against a Salesforce REST path (relative to the
 * instance URL). Attaches the bearer token; on a 401 it clears the cache,
 * re-auths once, and retries a single time.
 */
const authedFetch = async (
  path: string,
  init: RequestInit,
): Promise<Response> => {
  const send = async (): Promise<Response> => {
    const token = await getAccessToken();
    return pbFetch(`${token.instanceUrl}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token.accessToken}` },
    });
  };

  let res = await send();
  if (res.status === 401) {
    cachedToken = null;
    res = await send();
  }
  return res;
};

const createRecord = async (
  sobject: string,
  payload: SfPayload,
  label: string,
): Promise<{ id: string }> => {
  const res = await authedFetch(
    `/services/data/${SF_API_VERSION}/sobjects/${sobject}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new PropertybaseError(
      `${label} create failed (${res.status})`,
      res.status,
      await safeText(res),
    );
  }

  const json = (await res.json().catch(() => ({}))) as CreateResponse;
  if (!json.id) {
    throw new PropertybaseError(
      `${label} create returned no id`,
      res.status,
      JSON.stringify(json),
    );
  }
  return { id: json.id };
};

/**
 * Find an existing Contact id by email. Returns the most recently modified
 * match, or null if none exists. Throws `PropertybaseError` on query failure.
 */
export const findContactIdByEmail = async (
  email: string,
): Promise<string | null> => {
  const soql =
    `SELECT Id FROM Contact WHERE Email = '${escapeSoql(email)}' ` +
    `ORDER BY LastModifiedDate DESC LIMIT 1`;
  const res = await authedFetch(
    `/services/data/${SF_API_VERSION}/query/?q=${encodeURIComponent(soql)}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new PropertybaseError(
      `Contact lookup failed (${res.status})`,
      res.status,
      await safeText(res),
    );
  }

  const json = (await res.json().catch(() => ({}))) as QueryResponse;
  return json.records?.[0]?.Id ?? null;
};

/** Create a Contact. Returns the new Salesforce record id. */
export const createContact = (payload: SfPayload): Promise<{ id: string }> =>
  createRecord("Contact", payload, "Contact");

/** Create an Inquiry (`pba__Request__c`). Returns the new record id. */
export const createInquiry = (payload: SfPayload): Promise<{ id: string }> =>
  createRecord("pba__Request__c", payload, "Inquiry");

/**
 * Full submission flow: resolve the Contact (lookup by email, create if
 * absent), then create the Inquiry linked to it. Throws `PropertybaseError`
 * on any failure so the caller can trigger the email fallback.
 */
export const submitInquiry = async (
  lead: Lead,
  context: InquiryContext,
): Promise<SubmitResult> => {
  let contactId = await findContactIdByEmail(lead.email);
  let contactCreated = false;

  if (!contactId) {
    contactId = (await createContact(buildContactPayload(lead))).id;
    contactCreated = true;
  }

  const { id: inquiryId } = await createInquiry(
    buildInquiryPayload(lead, context, contactId),
  );

  return { contactId, inquiryId, contactCreated };
};
