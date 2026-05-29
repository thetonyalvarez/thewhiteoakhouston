import { NextResponse } from "next/server";
import { validateLead } from "@/lib/validate-lead";
import { validateInquiryContext } from "@/lib/validate-inquiry-context";
import { buildInquiryPayload } from "@/lib/propertybase-mapping";
import { getPropertybaseConfig } from "@/lib/propertybase-config";

/**
 * POST /api/subscribe
 *
 * Receives lead capture from the "Hear From Us" modal.
 *
 * Body shape:
 *   { firstName, lastName, email, phone?, signupUrl }
 *
 * Today the route validates, builds the PB-shaped Inquiry payload, and logs
 * it server-side. Once Propertybase credentials + auth flow land, swap the
 * `console.info` below for an HTTP POST to
 *   {getInstanceUrl()}/services/data/v60.0/sobjects/pba__Request__c
 * with a `Bearer <access_token>` header. Field shape is already correct.
 *
 * Sandbox vs. production switching happens via env vars only — see
 * `lib/propertybase-config.ts` and `docs/how-to-guides/configure-propertybase-env.md`.
 */
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

  const config = getPropertybaseConfig();
  const inquiry = buildInquiryPayload(leadResult.lead, contextResult.context, config);

  // TODO(propertybase): POST `inquiry` to /services/data/v60.0/sobjects/pba__Request__c here.
  console.info("[white-oak] inquiry captured (stub — not yet sent to Propertybase):", inquiry);

  return NextResponse.json({ ok: true });
}
