import { NextResponse } from "next/server";
import { validateLead } from "@/lib/validate-lead";
import { buildInquiryPayload } from "@/lib/propertybase-mapping";

/**
 * POST /api/subscribe
 *
 * Receives lead capture from the "Hear From Us" modal.
 *
 * Today the route validates, builds the PB-shaped Inquiry payload, and logs
 * it server-side. Once Propertybase credentials + auth flow land, swap the
 * `console.info` below for an HTTP POST to
 *   {PROPERTYBASE_INSTANCE_URL}/services/data/v60.0/sobjects/pba__Request__c
 * with a `Bearer <access_token>` header. Field shape is already correct.
 *
 * See `lib/propertybase-mapping.ts` for the field bridge.
 * See `.env.example` for the env vars that will be required.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const v = validateLead(json);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const inquiry = buildInquiryPayload(v.lead);

  // TODO(propertybase): POST `inquiry` to /services/data/v60.0/sobjects/pba__Request__c here.
  console.info("[white-oak] inquiry captured (stub — not yet sent to Propertybase):", inquiry);

  return NextResponse.json({ ok: true });
}
