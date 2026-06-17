/**
 * Lead emails (Resend HTTP API — no SDK dependency).
 *
 * Two situations, both delivering the captured details to a human inbox:
 *   - emailNewLead   — fires on every successful submission so the team is
 *                      notified of each new lead in real time.
 *   - emailLostLead  — fires only when Propertybase is unreachable, so a CRM
 *                      outage never loses a lead.
 *
 * Config is env-scoped (see `.env.example`):
 *   RESEND_API_KEY    — Resend API key
 *   LEAD_FALLBACK_TO  — comma-separated inbox(es) that receive lead emails.
 *                       Add a teammate by appending ",name@domain.com".
 *   LEAD_FALLBACK_FROM— sender; MUST be on a Resend-verified domain.
 *
 * Both return a result rather than throwing: the route already returns 200 to
 * the visitor regardless, and the boolean lets the route log delivery failures.
 */

import { fetchWithTimeout } from "./http";
import type { Lead } from "./validate-lead";
import type { InquiryContext } from "./validate-inquiry-context";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 5_000;

export type EmailResult = { sent: boolean; error?: string };

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Split "a@x.com, b@y.com" into ["a@x.com", "b@y.com"]; drops blanks so a
// trailing comma or empty value can't produce an invalid recipient.
const parseRecipients = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

const detailsTable = (rows: Array<[string, string]>): string => {
  const cells = rows
    .map(
      ([label, val]) =>
        `<tr><td style="padding:4px 12px 4px 0;font-weight:600">${label}</td>` +
        `<td style="padding:4px 0">${escapeHtml(val)}</td></tr>`,
    )
    .join("");
  return `<table style="border-collapse:collapse;font-family:sans-serif">${cells}</table>`;
};

const leadRows = (lead: Lead, context: InquiryContext): Array<[string, string]> => [
  ["First name", lead.firstName],
  ["Last name", lead.lastName],
  ["Email", lead.email],
  ["Phone", lead.phone ?? "—"],
  ["Signup URL", context.signupUrl],
];

const sendViaResend = async (
  subject: string,
  html: string,
): Promise<EmailResult> => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = parseRecipients(process.env.LEAD_FALLBACK_TO);
  const from = process.env.LEAD_FALLBACK_FROM;

  if (!apiKey || to.length === 0 || !from) {
    return {
      sent: false,
      error:
        "Lead email not configured (need RESEND_API_KEY, LEAD_FALLBACK_TO, LEAD_FALLBACK_FROM)",
    };
  }

  try {
    const res = await fetchWithTimeout(
      RESEND_ENDPOINT,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
      },
      REQUEST_TIMEOUT_MS,
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent: false, error: `Resend responded ${res.status}: ${detail}` };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

/** Notify the team that a new lead was captured (success path). */
export const emailNewLead = async (
  lead: Lead,
  context: InquiryContext,
): Promise<EmailResult> => {
  const html =
    `<p>A new White Oak inquiry just came in and was saved to Propertybase.</p>` +
    detailsTable(leadRows(lead, context));
  return sendViaResend(
    `New White Oak lead — ${lead.firstName} ${lead.lastName}`,
    html,
  );
};

/** Backup when Propertybase is unreachable so the lead is never lost. */
export const emailLostLead = async (
  lead: Lead,
  context: InquiryContext,
  cause: string,
): Promise<EmailResult> => {
  const html =
    `<p>A White Oak inquiry could not be saved to Propertybase and is at risk of being lost. ` +
    `Please add it to the CRM manually.</p>` +
    detailsTable([...leadRows(lead, context), ["Failure reason", cause]]);
  return sendViaResend(
    `⚠️ White Oak lead not saved — ${lead.firstName} ${lead.lastName}`,
    html,
  );
};
