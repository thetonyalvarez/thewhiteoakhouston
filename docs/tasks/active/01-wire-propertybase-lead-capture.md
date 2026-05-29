# 01 — Wire Propertybase Lead Capture

🔒 **BLOCKED on auth approach + per-environment credentials.**

## Summary
Replace the stub `console.info` in `app/api/subscribe/route.ts` with a real Propertybase Inquiry create call so submitted leads land in CRM. PB uses Salesforce's `pba__Request__c` custom object — not the standard SF Lead — and `pba__FieldName__c` naming.

Field mapping is done. What's left is the auth flow + HTTP client + the env-var helper module to support them.

Critical that PB outages don't silently drop leads — add an email-on-failure fallback before going live.

## ✅ Done

- [x] Field mapping module — `lib/propertybase-mapping.ts` (FIELD_MAP, INQUIRY_DEFAULTS, `buildInquiryPayload(lead, context)`)
- [x] Unit tests for mapping — `lib/propertybase-mapping.test.ts` (7 assertions)
- [x] InquiryContext type + validator — `lib/validate-inquiry-context.ts` for per-submission metadata (signupUrl today; honeypot, UTM, etc. as they come)
- [x] Sandbox-vs-production switching pattern documented — `docs/how-to-guides/configure-propertybase-env.md` (instance URL + Connected App credentials are env-scoped; `RecordTypeId` + picklist values are schema-replicated so they stay hardcoded)
- [x] `.env.example` with both sandbox + production URL examples
- [x] Route logs the PB-shaped payload (correct field shape) instead of raw form input

## Action Items

### Unblock
- [ ] Decide auth approach: OAuth 2.0 Client Credentials Flow (recommended for server-to-server) vs. JWT Bearer vs. long-lived refresh token
- [ ] Obtain sandbox + production Connected App credentials (Client ID / Secret, one Connected App per org)
- [ ] Decide the fallback inbox: where leads go if PB returns 5xx or times out

### Build
- [ ] Create `.env.local` from `.env.example` with sandbox values (gitignored — already covered)
- [ ] Set `PROPERTYBASE_*` vars in Vercel for each environment (see `docs/how-to-guides/configure-propertybase-env.md`)
- [ ] Add `lib/propertybase-config.ts` — `getInstanceUrl()`, `getClientId()`, `getClientSecret()` (mirrors `nan-crm/api/auth/_lib.ts` pattern)
- [ ] Add `lib/propertybase.ts` — token-fetch + `createInquiry(inquiry)` helper. Pattern mirrors `nan-crm/apps/agent-app/src/sf.ts` (Bearer token, JSON POST to `/services/data/v60.0/sobjects/pba__Request__c`)
- [ ] Update `app/api/subscribe/route.ts` to call the PB client on valid input
- [ ] Implement fallback: on PB failure (any non-2xx or timeout), log the full payload AND email it to the fallback inbox; return 200 to the user so they don't see an error

### Test
- [ ] Integration tests for the route handler — see `backlog/post-handler-integration-tests.md`
- [ ] Test cases: PB 200, PB 5xx, PB timeout, malformed PB response, valid lead with missing optional phone
- [ ] Manual: submit through the live preview-deploy modal once; confirm the Inquiry appears in SANDBOX PB
- [ ] Manual prod: submit through the production modal once; confirm the Inquiry appears in PRODUCTION PB
- [ ] Manual fault injection: intentionally break the token; confirm fallback email fires

### Ship
- [ ] Deploy to Vercel, smoke test sandbox in preview, promote to production

## Technical Details

- **Mapping module:** `lib/propertybase-mapping.ts` — single source of truth for our form fields → `pba__*__c` Salesforce fields. Adding a new field is a 3-step (user input) / 2-step (metadata) recipe, documented at the top of the file. Pure — no env reads.
- **Validators:** `lib/validate-lead.ts` (user input) + `lib/validate-inquiry-context.ts` (per-submission metadata).
- **Stub location:** `app/api/subscribe/route.ts` — search for `TODO(propertybase)`. Field shape is already correct; only the HTTP call is missing.
- **Reference implementation:** `nan-crm/apps/agent-app/src/sf.ts` (REST shape, Bearer token, JSON body) + `nan-crm/api/auth/_lib.ts` (env-var helper pattern).
- **Salesforce REST endpoint:** `POST {INSTANCE_URL}/services/data/v60.0/sobjects/pba__Request__c` with `Authorization: Bearer <token>` and `Content-Type: application/json`.

## Why a Fallback Matters

If PB is down for 10 minutes and 3 inquiries arrive, a stub-and-pray approach loses them. The fallback emails ensure every lead is at least visible to a human within minutes of submission, even when the integration fails.
