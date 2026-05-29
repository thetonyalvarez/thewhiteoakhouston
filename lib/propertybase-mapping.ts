/**
 * Propertybase Inquiry field mapping for The White Oak landing page.
 *
 * Marketers call form submissions "leads"; in Salesforce/Propertybase they
 * become Inquiries on the `pba__Request__c` custom object. This module is
 * the bridge — the only place in the codebase that knows PB field naming.
 *
 * Mirrors the convention used in nan-crm/apps/agent-app/src/sf.ts:
 *   - PB-managed custom fields: `pba__FieldName__c`
 *   - PB-specific lookups:      `pba__FieldName_pb__c`
 *
 * Adding a new field later — 3-step recipe (no architectural changes):
 *   1. Add field to the form in app/components/HearFromUs.tsx
 *   2. Add field to the Lead type + rule in lib/validate-lead.ts (with a test)
 *   3. Add one row to FIELD_MAP below: pba__YourField__c: (l) => l.yourField
 */

import type { Lead } from "./validate-lead";

// Values allowed in a Salesforce sObject field. Booleans + numbers included
// for future fields (checkboxes, currency, counts). `null` is reserved for
// explicit clears; we don't currently emit it.
type SfFieldValue = string | number | boolean | null;

type Mapper = (lead: Lead) => SfFieldValue | undefined;

/**
 * Per-lead field mapping.
 *
 * Each key is the Salesforce API name of a field on `pba__Request__c`. Each
 * value is a function that derives that field's value from the validated
 * Lead. Functions may return `undefined` to omit the field entirely (e.g. for
 * optional fields the user left blank) — `buildInquiryPayload` drops those
 * before sending to PB so we never write empty strings into picklist or
 * required-but-defaulted fields.
 */
export const FIELD_MAP: Record<string, Mapper> = {
  pba__FirstName__c: (l) => l.firstName,
  pba__LastName__c: (l) => l.lastName,
  pba__Email__c: (l) => l.email,
  pba__Phone__c: (l) => l.phone,
};

/**
 * Constants applied to every Inquiry created from this site.
 *
 * Edit this when the org-wide taxonomy changes. Anything that varies per
 * submission belongs in FIELD_MAP, not here.
 *
 * TODO(pb-org): confirm the exact picklist value for `pba__Type__c` against
 *   the live PB org. "Web Form" matches nan-crm's createInquiry default but
 *   the picklist may vary per Salesforce instance.
 * TODO(pb-org): set `pba__Source__c` to whatever value the team uses to
 *   distinguish The White Oak captures from other inbound traffic.
 * TODO(pb-org): add `pba__Project_pb__c: "<Salesforce record ID>"` once we
 *   have the ID of the White Oak project record in PB. Required for the
 *   Inquiry to associate with the right project in dashboards.
 * TODO(pb-org): decide whether OwnerId is set here or left to PB workflow
 *   rules / assignment queues.
 */
export const INQUIRY_DEFAULTS: Record<string, SfFieldValue> = {
  pba__Status__c: "New",
  pba__Type__c: "Web Form",
};

/**
 * Build the Salesforce-shaped payload for a single Inquiry.
 *
 * Strategy:
 *   1. Start with INQUIRY_DEFAULTS (constants).
 *   2. Apply each FIELD_MAP mapper to the Lead.
 *   3. Drop any field whose mapped value is undefined or an empty string,
 *      so PB never receives blanks for optional fields the user skipped.
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
