/**
 * Contract test: verifies our field mapping matches the live Propertybase
 * schema. Unit tests pass even when the mapping points at fields/picklist
 * values that don't exist in the org — exactly the failure that silently drops
 * leads (a 201 create that never persists). This test catches that drift by
 * describing the real objects and asserting every mapped field + picklist value
 * exists.
 *
 * It is SKIPPED in normal `npm test` (no network, no creds). Run it against the
 * sandbox before a deploy:
 *
 *   set -a && . ./.env.local && set +a && \
 *   PB_CONTRACT_TEST=1 npx vitest run lib/propertybase-contract.test.ts
 *
 * Requires PROPERTYBASE_INSTANCE_URL / _CLIENT_ID / _CLIENT_SECRET in env.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { getClientId, getClientSecret, getInstanceUrl } from "./propertybase-config";
import {
  buildContactPayload,
  buildInquiryPayload,
} from "./propertybase-mapping";

const RUN = process.env.PB_CONTRACT_TEST === "1";
const SF_API_VERSION = "v60.0";

type SfField = {
  name: string;
  type: string;
  createable: boolean;
  picklistValues?: Array<{ value: string; active: boolean }>;
};
type SfDescribe = {
  fields: SfField[];
  recordTypeInfos?: Array<{ recordTypeId: string; available: boolean }>;
};

const lead = {
  firstName: "Contract",
  lastName: "Test",
  email: "contract-test@example.com",
  phone: "7135550000",
};
const context = { signupUrl: "https://thewhiteoakhouston.com/" };

describe.runIf(RUN)("Propertybase schema contract (sandbox)", () => {
  let instanceUrl: string;
  let token: string;
  const describeCache = new Map<string, SfDescribe>();

  const describeObject = async (sobject: string): Promise<SfDescribe> => {
    const cached = describeCache.get(sobject);
    if (cached) return cached;
    const res = await fetch(
      `${instanceUrl}/services/data/${SF_API_VERSION}/sobjects/${sobject}/describe`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`describe ${sobject} failed: ${res.status}`);
    const json = (await res.json()) as SfDescribe;
    describeCache.set(sobject, json);
    return json;
  };

  const fieldMap = (d: SfDescribe) => new Map(d.fields.map((f) => [f.name, f]));

  beforeAll(async () => {
    instanceUrl = getInstanceUrl();
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: getClientId(),
      client_secret: getClientSecret(),
    });
    const res = await fetch(`${instanceUrl}/services/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as { access_token?: string; instance_url?: string };
    if (!json.access_token) throw new Error("token fetch failed for contract test");
    token = json.access_token;
    instanceUrl = json.instance_url ?? instanceUrl;
  });

  it("every Contact field we write exists and is createable", async () => {
    const fields = fieldMap(await describeObject("Contact"));
    for (const name of Object.keys(buildContactPayload(lead))) {
      const f = fields.get(name);
      expect(f, `Contact.${name} missing`).toBeTruthy();
      expect(f?.createable, `Contact.${name} not createable`).toBe(true);
    }
  });

  it("every Inquiry field we write exists on pba__Request__c", async () => {
    const fields = fieldMap(await describeObject("pba__Request__c"));
    const payload = buildInquiryPayload(lead, context, "003000000000001");
    for (const name of Object.keys(payload)) {
      if (name === "RecordTypeId") continue; // checked separately below
      expect(fields.get(name), `pba__Request__c.${name} missing`).toBeTruthy();
    }
  });

  it("every picklist value we send is a valid active member", async () => {
    const fields = fieldMap(await describeObject("pba__Request__c"));
    const payload = buildInquiryPayload(lead, context, "003000000000001");
    for (const [name, value] of Object.entries(payload)) {
      const f = fields.get(name);
      if (!f || typeof value !== "string") continue;
      if (f.type !== "picklist" && f.type !== "multipicklist") continue;
      const active = (f.picklistValues ?? [])
        .filter((v) => v.active)
        .map((v) => v.value);
      // Multipicklist values are ';'-delimited; today all our values are single.
      for (const member of value.split(";")) {
        expect(active, `${name}="${member}" not a valid picklist value`).toContain(member);
      }
    }
  });

  it("the hardcoded RecordTypeId is a valid record type for the object", async () => {
    const d = await describeObject("pba__Request__c");
    const payload = buildInquiryPayload(lead, context, "003000000000001");
    const ids = (d.recordTypeInfos ?? []).map((r) => r.recordTypeId);
    expect(ids, "RecordTypeId not found on pba__Request__c").toContain(
      payload.RecordTypeId,
    );
  });
});
