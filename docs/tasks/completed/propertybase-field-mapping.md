# Propertybase Field Mapping Layer

**Shipped across:** `7c238ee` → `70a91dd` → `fa93671` → `ca8e2ad`

Part of the larger task `active/01-wire-propertybase-lead-capture.md` — this sub-step (field mapping + payload shape) is complete; auth + HTTP client remain.

## Summary
Built the boundary that translates form submissions into the Salesforce-shaped `pba__Request__c` (Inquiry) payload. Designed so adding a new field later is a single-line change in one obvious file. Field set + values confirmed against Nan's live PB org.

## What Shipped

- `lib/propertybase-mapping.ts` — `FIELD_MAP` (per-submission mappers), `INQUIRY_DEFAULTS` (org-wide constants), `buildInquiryPayload(lead, context)` (folds them, drops blanks)
- `lib/propertybase-mapping.test.ts` — 7 assertions
- `lib/validate-inquiry-context.ts` + tests — `InquiryContext` type for per-submission metadata, kept distinct from `Lead` (user input) so future metadata (honeypot, UTM, IP, UA) has an obvious home
- `app/components/HearFromUs.tsx` now sends `signupUrl: window.location.href`
- `app/api/subscribe/route.ts` validates both lead + context, builds the PB-shaped payload, logs it server-side (HTTP POST is the next chunk)
- `.env.example` documents the env-scoped vars (instance URL, Connected App creds)
- `docs/how-to-guides/configure-propertybase-env.md` documents the Vercel sandbox-vs-prod pattern

## Final Field Shape

Per Tony's spec from the live PB org:

**FIELD_MAP (per-submission):**
- `pba__FirstName__c`, `pba__LastName__c`, `pba__Email__c`, `pba__Phone__c`
- `Signup_Site_URL__c` — from `window.location.href`

**INQUIRY_DEFAULTS (constants applied to every Inquiry):**
- `RecordTypeId` — same value across sandbox + prod (`0121I000000kzBVQAY`)
- `Contact_Type__c: "Buyer"`
- `Inquiry_Type__c: "Buyer"`
- `Lead_Type__c: "Company Lead"`
- `Lead_Source__c: "Developer Services"`
- `pba__PropertyType__c: "Condo"`
- `pba__Status__c: "Assigned"`
- `pba__Type_pb__c: "Buyer"`
- `Qualification_Notes__c: "The White Oak"`
- `OwnerId` — explicit owner assignment

## Key Decisions

- **Lead vs. InquiryContext split:** User input goes on `Lead`; submission metadata goes on `InquiryContext`. Mapper signature is `(lead, context) => value`. Honeypot + UTM tracking will slot into `InquiryContext` without touching `Lead`.
- **No env vars for RecordTypeId:** I originally split it out as an env var assuming Salesforce record IDs would differ across orgs. Tony confirmed Nan's setup replicates IDs between sandbox + prod, so it stays hardcoded alongside picklist values (also schema-replicated). Reverted in `ca8e2ad`.
- **No `lib/propertybase-config.ts` yet:** Premature scaffolding. Will return when the HTTP client + auth land, with the getters those modules actually need (`getInstanceUrl()`, `getClientId()`, `getClientSecret()`).
- **Two-const split (FIELD_MAP vs INQUIRY_DEFAULTS):** Endorsed by `/simplify` review. Functions vs. literals carry exact types; visual scan tells you what varies per submission vs. what doesn't.

## Test Coverage

39/39 unit tests pass:
- 17 in `validate-lead.test.ts`
- 15 in `validate-inquiry-context.test.ts`
- 7 in `propertybase-mapping.test.ts`

Live smoke test confirms the route returns 200 with a valid payload, 400 without `signupUrl`, and the dev log shows the complete PB-shaped Inquiry payload (15 fields).

## What's Still Open (in active/01)

- Auth flow decision (Client Credentials Flow recommended)
- Connected App credentials for sandbox + production
- `lib/propertybase-config.ts` env helper module
- `lib/propertybase.ts` HTTP client + token caching
- Fallback inbox for PB failures
- Integration tests
