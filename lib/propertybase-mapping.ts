/**
 * Propertybase field mapping for The White Oak landing page.
 *
 * The Propertybase data model is many-to-one: a Contact is the durable
 * "business card" (FirstName/LastName/Email/Phone) and each web submission
 * becomes an Inquiry on `pba__Request__c` that points back at that Contact
 * through the `pba__Contact__c` lookup. The Inquiry object has NO
 * first/last/phone-name columns — those live only on the Contact.
 *
 * Verified against the live org via the sobjects `describe` API:
 *   - `pba__FirstName__c` / `pba__LastName__c` / `pba__Phone__c` / `pba__Email__c`
 *     do NOT exist on `pba__Request__c`.
 *   - `Email__c` (email) and `Mobile__c` (phone) DO exist on the Inquiry.
 *   - `Inquiry_Type__c` does NOT exist — the "Inquiry Type" picklist is
 *     `pba__Type_pb__c`.
 *   - All picklist values below are confirmed members of their picklists.
 *
 * A submission therefore maps to TWO payloads:
 *   - buildContactPayload(lead)            — used only when no Contact already
 *                                            has this email (client looks up
 *                                            by email first, creates if absent)
 *   - buildInquiryPayload(lead, ctx, id)   — always created, linked to the
 *                                            resolved Contact id
 *
 * This module is pure — no env reads, no I/O. The instance URL + credentials
 * are env-scoped and handled by `lib/propertybase.ts`. The record/field
 * values here are schema-shared across orgs, so they're safe to hardcode.
 */

import type { Lead } from "./validate-lead";
import type { InquiryContext } from "./validate-inquiry-context";

// Values allowed in a Salesforce sObject field. Booleans + numbers included
// for future fields (checkboxes, currency, counts). `null` is reserved for
// explicit clears; we don't currently emit it. Exported as the single source
// of truth for payload shape so the HTTP client (`lib/propertybase.ts`) shares
// it rather than redeclaring the same union.
export type SfFieldValue = string | number | boolean | null;

/** A Salesforce sObject create/update payload. */
export type SfPayload = Record<string, SfFieldValue>;

type Mapper = (lead: Lead, context: InquiryContext) => SfFieldValue | undefined;

/**
 * Build the standard Salesforce Contact payload for a submitter. This is only
 * sent when no Contact already exists for the email (see
 * `findContactIdByEmail` in `lib/propertybase.ts`).
 *
 * `LastName` is the only required Contact field; `FirstName`, `Email`, and
 * `Phone` are optional. `Phone` is omitted when the user left it blank.
 */
export const buildContactPayload = (lead: Lead): SfPayload => {
  const payload: SfPayload = {
    FirstName: lead.firstName,
    LastName: lead.lastName,
    Email: lead.email,
  };
  if (lead.phone) payload.Phone = lead.phone;
  return payload;
};

/**
 * Per-submission Inquiry fields derived from the Lead + Context. Each key is a
 * Salesforce API name on `pba__Request__c`. Return `undefined` to omit the
 * field (e.g. an optional field the user left blank). The Contact link
 * (`pba__Contact__c`) is added in `buildInquiryPayload`, not here, because it
 * comes from the lookup/create step rather than the form.
 *
 * To add a new field (3 steps for user input, 2 for metadata):
 *   User input:
 *     1. Add field to the form in `app/components/HearFromUs.tsx`
 *     2. Add field to the `Lead` type + rule in `lib/validate-lead.ts` (+ test)
 *     3. Add one row below: `Your_Field__c: (l) => l.yourField`
 *   Submission metadata:
 *     1. Add field to `InquiryContext` + rule in `lib/validate-inquiry-context.ts`
 *     2. Add one row below: `Your_Field__c: (_, ctx) => ctx.yourField`
 */
export const FIELD_MAP: Record<string, Mapper> = {
  Email__c: (l) => l.email,
  Mobile__c: (l) => l.phone,
  Signup_Site_URL__c: (_, ctx) => ctx.signupUrl,
};

/**
 * Constants applied to every Inquiry from this site. Edit when the org-wide
 * taxonomy changes; anything varying per submission belongs in FIELD_MAP.
 *
 * All values are confirmed picklist members on `pba__Request__c`:
 *   RecordTypeId           — White Oak Inquiry record type (shared across orgs)
 *   Contact_Type__c        — multipicklist
 *   Lead_Type__c           — picklist
 *   Lead_Source__c         — picklist; drives PB assignment rules / ownership
 *   pba__PropertyType__c   — multipicklist
 *   pba__Status__c         — picklist; "Assigned" matches the PB convention
 *                            where Lead_Source__c triggers owner assignment
 *   pba__Type_pb__c        — picklist ("Inquiry Type")
 *   Qualification_Notes__c — textarea; project name as a stable text marker
 *   pbasr__Rotation_Name__c — REQUIRED. On insert, the "New Web Inquiry
 *                            Allocation" flow runs the Sales Rotation
 *                            allocator (`pbasr.SalesRotation`) to assign an
 *                            owner. Without a valid rotation the flow throws
 *                            and the insert is rolled back — the inquiry
 *                            silently never persists. Valid values:
 *                            "General Sales Rotation", "Galveston",
 *                            "NAN General Enquiries". We use the general sales
 *                            rotation; switch to a dedicated "The White Oak"
 *                            rotation here if/when PB admin creates one.
 */
export const INQUIRY_DEFAULTS: SfPayload = {
  RecordTypeId: "0121I000000kzBVQAY",
  Contact_Type__c: "Buyer",
  Lead_Type__c: "Company Lead",
  Lead_Source__c: "Developer Services",
  pba__PropertyType__c: "Condo",
  pba__Status__c: "Assigned",
  pba__Type_pb__c: "Buyer",
  Qualification_Notes__c: "The White Oak",
  pbasr__Rotation_Name__c: "General Sales Rotation",
};

/**
 * Build the Salesforce-shaped payload for a single Inquiry: start with
 * INQUIRY_DEFAULTS, attach the resolved Contact id via `pba__Contact__c`, then
 * apply each FIELD_MAP mapper, dropping any field whose value is undefined or
 * an empty string so PB never receives blanks for skipped optional fields.
 */
export const buildInquiryPayload = (
  lead: Lead,
  context: InquiryContext,
  contactId: string,
): SfPayload => {
  const payload: SfPayload = {
    ...INQUIRY_DEFAULTS,
    pba__Contact__c: contactId,
  };

  for (const [sfField, mapper] of Object.entries(FIELD_MAP)) {
    const value = mapper(lead, context);
    if (value === undefined || value === "") continue;
    payload[sfField] = value;
  }

  return payload;
};
