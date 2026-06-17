import { NextResponse, after } from "next/server";
import { validateLead } from "@/lib/validate-lead";
import { validateInquiryContext } from "@/lib/validate-inquiry-context";
import { submitInquiry } from "@/lib/propertybase";
import { emailNewLead, emailLostLead } from "@/lib/lead-email";

/**
 * POST /api/subscribe
 *
 * Receives lead capture from the "Hear From Us" modal.
 *
 * Body shape:
 *   { firstName, lastName, email, phone?, signupUrl }
 *
 * Flow: validate input → resolve the Contact (lookup by email, create if
 * absent) → create the linked Inquiry in Propertybase → email the team a
 * new-lead notification. If Propertybase fails (non-2xx, timeout, malformed
 * response), fall back to emailing the lead to a human inbox so it's never
 * lost, and still return 200 to the visitor — a CRM outage shouldn't surface
 * as a submission error. A failed notification email never fails the request.
 *
 * Sandbox vs. production is selected by env vars only — see
 * `docs/how-to-guides/configure-propertybase-env.md`.
 */

// Give the handler enough budget for the worst-case PB path (token + lookup +
// contact create + inquiry create, each capped at 5s) PLUS the email fallback,
// so a slow/hung Propertybase can't kill the function before the lead is saved.
export const maxDuration = 30;

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadResult = validateLead(json);
  if (!leadResult.ok) {
    return NextResponse.json({ error: leadResult.error }, { status: 400 });
  }

  const contextResult = validateInquiryContext(json);
  if (!contextResult.ok) {
    return NextResponse.json({ error: contextResult.error }, { status: 400 });
  }

  try {
    const { inquiryId, contactId, contactCreated } = await submitInquiry(
      leadResult.lead,
      contextResult.context,
    );
    console.info(
      "[white-oak] inquiry created in Propertybase:",
      { inquiryId, contactId, contactCreated },
    );
    // Notify the team of the new lead AFTER the response is sent. The lead is
    // already safe in Propertybase, so the visitor shouldn't wait on (or be
    // affected by) the email round-trip. `after` keeps the function alive past
    // the response, within the maxDuration budget above — so notification is
    // best-effort: if Propertybase latency consumed most of the budget, the
    // platform may end the function before this fires. The lead is persisted
    // regardless; only the convenience notification would be skipped.
    after(async () => {
      const notify = await emailNewLead(leadResult.lead, contextResult.context);
      if (!notify.sent) {
        console.error("[white-oak] new-lead notification email failed:", notify.error);
      }
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Propertybase failed. Never lose the lead: email the fallback inbox and
    // still return 200 so the visitor sees success.
    console.error("[white-oak] Propertybase submit failed; invoking fallback:", err);
    const fallback = await emailLostLead(
      leadResult.lead,
      contextResult.context,
      err instanceof Error ? err.message : String(err),
    );
    if (!fallback.sent) {
      console.error(
        "[white-oak] FALLBACK EMAIL ALSO FAILED — lead is only in logs:",
        fallback.error,
        leadResult.lead,
      );
    }
    return NextResponse.json({ ok: true });
  }
}
