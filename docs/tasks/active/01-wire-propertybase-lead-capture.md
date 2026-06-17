# 01 — Wire Propertybase Lead Capture

🚧 **IN PROGRESS — sandbox integration built + validated end to end. Remaining: Resend key, production credentials, deploy.**

## Summary
Replace the stub `console.info` in `app/api/subscribe/route.ts` with a real Propertybase Inquiry create call so submitted leads land in CRM. PB uses Salesforce's `pba__Request__c` custom object — not the standard SF Lead.

**Data model correction (discovered during build):** `pba__Request__c` (Inquiry) has NO name/phone columns — those live on a standard **Contact**, and the Inquiry links to it via the **`pba__Contact__c`** lookup. So each submission is a two-step flow: look up Contact by email → create one if absent → create the Inquiry linked to it. The original field map (`pba__FirstName__c` etc.) did not exist on the object and was corrected.

**Mandatory rotation (discovered during build):** an insert-time flow ("New Web Inquiry Allocation") runs the Sales Rotation allocator and **rolls back the insert if `pbasr__Rotation_Name__c` is missing/invalid** — the inquiry silently never persists. We use `"General Sales Rotation"` (Tony's call, 2026-05-28). Switch to a dedicated "The White Oak" rotation if PB admin creates one.

Auth is OAuth 2.0 Client Credentials Flow via an **External Client App** (Salesforce's newer Connected App replacement). Proven against sandbox.

Critical that PB outages don't silently drop leads — email-on-failure fallback (Resend) is built; needs an API key to go live.

## ✅ Done

- [x] Field mapping module — `lib/propertybase-mapping.ts` (FIELD_MAP, INQUIRY_DEFAULTS, `buildInquiryPayload(lead, context)`)
- [x] Unit tests for mapping — `lib/propertybase-mapping.test.ts` (7 assertions)
- [x] InquiryContext type + validator — `lib/validate-inquiry-context.ts` for per-submission metadata (signupUrl today; honeypot, UTM, etc. as they come)
- [x] Sandbox-vs-production switching pattern documented — `docs/how-to-guides/configure-propertybase-env.md` (instance URL + Connected App credentials are env-scoped; `RecordTypeId` + picklist values are schema-replicated so they stay hardcoded)
- [x] `.env.example` with both sandbox + production URL examples
- [x] Route logs the PB-shaped payload (correct field shape) instead of raw form input

## Action Items

### Unblock — DONE
- [x] Auth approach decided: **OAuth 2.0 Client Credentials Flow** via an **External Client App** (sandbox app created; run-as user Henrry, unfrozen; IP relaxation on)
- [x] Sandbox Connected/External Client App credentials obtained (Client ID / Secret in `.env.local`)
- [x] Fallback inbox decided: **tony@nanproperties.com**

### Build — DONE (sandbox)
- [x] `.env.local` populated with sandbox values (gitignored)
- [x] `lib/propertybase-config.ts` — `getInstanceUrl()`, `getClientId()`, `getClientSecret()`
- [x] `lib/propertybase.ts` — token fetch + cache, `findContactIdByEmail`, `createContact`, `createInquiry`, `submitInquiry` orchestrator (lookup → create Contact if absent → create linked Inquiry); 401 re-auth + timeout handling
- [x] Corrected `lib/propertybase-mapping.ts` — `buildContactPayload(lead)` + `buildInquiryPayload(lead, context, contactId)`; Inquiry links via `pba__Contact__c`; `Email__c`/`Mobile__c`; **`pbasr__Rotation_Name__c: "General Sales Rotation"`** (required for persistence)
- [x] `app/api/subscribe/route.ts` calls `submitInquiry`; on failure → fallback email + 200
- [x] Fallback `lib/lead-fallback.ts` (Resend HTTP API, no SDK dep) — code complete

### Test — DONE
- [x] 71 unit/integration tests pass; production build clean
- [x] Route handler integration tests (PB success, failure→fallback, fallback-also-fails, validation 400s)
- [x] Client tests (token cache, 401 retry, 5xx, timeout, malformed, SOQL escaping, contact lookup/create, submit orchestration)
- [x] **Live sandbox E2E proven**: Contact created → Inquiry created + linked via `pba__Contact__c` → persists → owner allocated by rotation (test records cleaned up)

### Remaining (external actions — not code)
- [ ] **Resend:** Tony signs up, create API key → set `RESEND_API_KEY` in `.env.local` + Vercel; verify a sender domain for production (`LEAD_FALLBACK_FROM`)
- [ ] Manual fault injection: break the token, confirm fallback email fires (once `RESEND_API_KEY` set)
- [ ] **Production** External Client App credentials + `PROPERTYBASE_*` vars in Vercel (Production env)
- [ ] Set sandbox `PROPERTYBASE_*` in Vercel Preview/Development
- [ ] Manual prod: submit once; confirm the Inquiry appears in PRODUCTION PB

### Ship
- [ ] Deploy to Vercel, smoke test sandbox in preview, promote to production

## Technical Details

- **Mapping module:** `lib/propertybase-mapping.ts` — single source of truth for form fields → Salesforce fields, split into `buildContactPayload` (standard Contact) and `buildInquiryPayload` (`pba__Request__c`, linked via `pba__Contact__c`). Pure — no env reads. Field/value notes verified against the live `describe` API are inline.
- **HTTP client:** `lib/propertybase.ts` — `submitInquiry(lead, context)` is the entry point; `findContactIdByEmail` / `createContact` / `createInquiry` are the building blocks. Token cached in-module, re-auth once on 401, 10s timeout.
- **Config:** `lib/propertybase-config.ts` — env getters (`getInstanceUrl/getClientId/getClientSecret`).
- **Fallback:** `lib/lead-fallback.ts` — Resend HTTP API; reads `RESEND_API_KEY`, `LEAD_FALLBACK_TO`, `LEAD_FALLBACK_FROM`.
- **Validators:** `lib/validate-lead.ts` (user input) + `lib/validate-inquiry-context.ts` (per-submission metadata).
- **Salesforce REST endpoints:** `POST {INSTANCE_URL}/services/data/v60.0/sobjects/Contact` and `.../sobjects/pba__Request__c`; Contact lookup via `.../query/?q=<SOQL>`; token via `POST .../services/oauth2/token` (grant_type=client_credentials). All with `Authorization: Bearer <token>`.

## ⚠️ Gotchas discovered (don't relearn the hard way)
- **Contact is mandatory & linked:** `pba__Request__c` has no name/phone fields. Name/phone live on Contact; the Inquiry points at it via `pba__Contact__c`. Email also stored on the Inquiry as `Email__c` (note: NOT `pba__Email__c`); phone as `Mobile__c`.
- **`pbasr__Rotation_Name__c` is REQUIRED.** The "New Web Inquiry Allocation" flow runs `pbasr.SalesRotation` on insert and rolls back if the rotation is missing/invalid — the inquiry returns a 201 then silently never persists (not even in the recycle bin). Valid values: `General Sales Rotation`, `Galveston`, `NAN General Enquiries`.
- **`Inquiry_Type__c` does not exist** — the "Inquiry Type" picklist is `pba__Type_pb__c`.
- **External Client App, not Connected App:** this org uses Salesforce's newer External Client App Manager. Client Credentials Flow works identically over the wire; the run-as user must be Active/unfrozen, have API + object create perms, and the app needs IP relaxation (Vercel has no fixed IP).

## Why a Fallback Matters

If PB is down for 10 minutes and 3 inquiries arrive, a stub-and-pray approach loses them. The fallback emails ensure every lead is at least visible to a human within minutes of submission, even when the integration fails.
