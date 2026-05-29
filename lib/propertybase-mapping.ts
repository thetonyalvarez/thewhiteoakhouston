/**
 * Propertybase Inquiry field mapping for The White Oak landing page.
 *
 * Marketers call form submissions "leads"; in Salesforce/Propertybase they
 * become Inquiries on the `pba__Request__c` custom object. This module is
 * the bridge — the only place in the codebase that knows PB field naming.
 * Mirrors the convention used in `nan-crm/apps/agent-app/src/sf.ts`
 * (managed-package fields use `pba__FieldName__c`; PB-specific lookups
 * use `pba__FieldName_pb__c`).
 */

import type { Lead } from "./validate-lead";

// Values allowed in a Salesforce sObject field. Booleans + numbers included
// for future fields (checkboxes, currency, counts). `null` is reserved for
// explicit clears; we don't currently emit it.
type SfFieldValue = string | number | boolean | null;

type Mapper = (lead: Lead) => SfFieldValue | undefined;

/**
 * Per-lead field mapping. Each key is a Salesforce API name on
 * `pba__Request__c`; each value derives that field from the validated Lead.
 * Return `undefined` to omit the field (e.g. optional fields left blank).
 *
 * To add a new field (3 steps, no architectural changes):
 *   1. Add field to the form in `app/components/HearFromUs.tsx`
 *   2. Add field to the `Lead` type + rule in `lib/validate-lead.ts` (+ test)
 *   3. Add one row below: `pba__YourField__c: (l) => l.yourField`
 */
export const FIELD_MAP: Record<string, Mapper> = {
  pba__FirstName__c: (l) => l.firstName,
  pba__LastName__c: (l) => l.lastName,
  pba__Email__c: (l) => l.email,
  pba__Phone__c: (l) => l.phone,
};

/**
 * Constants applied to every Inquiry from this site. Edit when the org-wide
 * taxonomy changes; anything varying per submission belongs in FIELD_MAP.
 *
 * TODO(pb-org): confirm `pba__Type__c` picklist value against the live org —
 *   "Web Form" mirrors nan-crm's default but the picklist varies per instance.
 * TODO(pb-org): set `pba__Source__c` to whatever distinguishes White Oak.
 * TODO(pb-org): add `pba__Project_pb__c: "<SF record ID>"` once known —
 *   required for the Inquiry to attach to the project in PB dashboards.
 * TODO(pb-org): decide whether OwnerId is set here or by PB workflow rules.
 */
export const INQUIRY_DEFAULTS: Record<string, SfFieldValue> = {
  pba__Status__c: "New",
  pba__Type__c: "Web Form",
};

/**
 * Build the Salesforce-shaped payload for a single Inquiry: start with
 * INQUIRY_DEFAULTS, then apply each FIELD_MAP mapper, dropping any field
 * whose mapped value is undefined or an empty string so PB never receives
 * blanks for optional fields the user skipped.
 */
export const buildInquiryPayload = (lead: Lead): Record<string, SfFieldValue> => {
  const payload: Record<string, SfFieldValue> = { ...INQUIRY_DEFAULTS };

  for (const [sfField, mapper] of Object.entries(FIELD_MAP)) {
    const value = mapper(lead);
    if (value === undefined || value === "") continue;
    payload[sfField] = value;
  }

  return payload;
};
