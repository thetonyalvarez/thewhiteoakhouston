/**
 * Propertybase Inquiry field mapping for The White Oak landing page.
 *
 * Marketers call form submissions "leads"; in Salesforce/Propertybase they
 * become Inquiries on the `pba__Request__c` custom object. This module is
 * the bridge — the only place in the codebase that knows PB field naming.
 * Mirrors the convention used in `nan-crm/apps/agent-app/src/sf.ts`
 * (managed-package fields use `pba__FieldName__c`; PB-specific lookups
 * use `pba__FieldName_pb__c`; org-custom fields drop the `pba__` prefix).
 */

import type { Lead } from "./validate-lead";
import type { InquiryContext } from "./validate-inquiry-context";

// Values allowed in a Salesforce sObject field. Booleans + numbers included
// for future fields (checkboxes, currency, counts). `null` is reserved for
// explicit clears; we don't currently emit it.
type SfFieldValue = string | number | boolean | null;

type Mapper = (lead: Lead, context: InquiryContext) => SfFieldValue | undefined;

/**
 * Per-lead field mapping. Each key is a Salesforce API name on
 * `pba__Request__c`; each value derives that field from the validated Lead
 * and submission Context. Return `undefined` to omit the field (e.g.
 * optional fields the user left blank).
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
  pba__FirstName__c: (l) => l.firstName,
  pba__LastName__c: (l) => l.lastName,
  pba__Email__c: (l) => l.email,
  pba__Phone__c: (l) => l.phone,
  Signup_Site_URL__c: (_, ctx) => ctx.signupUrl,
};

/**
 * Constants applied to every Inquiry from this site. Edit when the org-wide
 * taxonomy changes; anything varying per submission belongs in FIELD_MAP.
 *
 * Values + field constraints per Tony's spec from the live PB org:
 *   RecordTypeId           — record type for The White Oak's Inquiry shape
 *   Contact_Type__c        — restricted multipicklist
 *   Inquiry_Type__c        — restricted picklist
 *   Lead_Type__c           — picklist
 *   Lead_Source__c         — picklist; drives PB assignment rules / ownership
 *   pba__PropertyType__c   — multipicklist
 *   pba__Status__c         — picklist; "Assigned" matches the PB convention
 *                            where Lead_Source__c triggers owner assignment
 *   pba__Type_pb__c        — picklist
 *   Qualification_Notes__c — textarea(32768); the project name as a stable
 *                            text marker for queries / dashboards
 */
export const INQUIRY_DEFAULTS: Record<string, SfFieldValue> = {
  RecordTypeId: "0121I000000kzBVQAY",
  Contact_Type__c: "Buyer",
  Inquiry_Type__c: "Buyer",
  Lead_Type__c: "Company Lead",
  Lead_Source__c: "Developer Services",
  pba__PropertyType__c: "Condo",
  pba__Status__c: "Assigned",
  pba__Type_pb__c: "Buyer",
  Qualification_Notes__c: "The White Oak",
};

/**
 * Build the Salesforce-shaped payload for a single Inquiry: start with
 * INQUIRY_DEFAULTS, then apply each FIELD_MAP mapper, dropping any field
 * whose mapped value is undefined or an empty string so PB never receives
 * blanks for optional fields the user skipped.
 */
export const buildInquiryPayload = (
  lead: Lead,
  context: InquiryContext,
): Record<string, SfFieldValue> => {
  const payload: Record<string, SfFieldValue> = { ...INQUIRY_DEFAULTS };

  for (const [sfField, mapper] of Object.entries(FIELD_MAP)) {
    const value = mapper(lead, context);
    if (value === undefined || value === "") continue;
    payload[sfField] = value;
  }

  return payload;
};
