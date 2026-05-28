import { NextResponse } from "next/server";
import { validateLead } from "@/lib/validate-lead";

/**
 * POST /api/subscribe
 *
 * Receives lead capture from the "Hear From Us" modal.
 *
 * TODO(propertybase): Replace the console log with the Propertybase Lead
 * create call once we have:
 *   - PROPERTYBASE_API_BASE          (e.g. https://api.propertybase.com)
 *   - PROPERTYBASE_API_TOKEN         (OAuth bearer or API key)
 *   - PROPERTYBASE_LEAD_SOURCE_ID    (so White Oak leads are attributable)
 *   - Lead field mapping              (which PB Lead fields map to our
 *                                       firstName/lastName/email/phone, plus
 *                                       any required defaults like assigned
 *                                       owner, project, or campaign)
 * Until then this endpoint validates the payload, logs it server-side, and
 * returns 200 so the UI flow is testable end-to-end.
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

  // TODO(propertybase): POST v.lead to Propertybase here.
  console.info("[white-oak] lead captured (stub — not yet sent to Propertybase):", v.lead);

  return NextResponse.json({ ok: true });
}
