# 01 — Wire Propertybase Lead Capture

🔒 **BLOCKED on Propertybase credentials + auth approach.**

## Summary
Replace the stub `console.info` in `app/api/subscribe/route.ts` with a real Propertybase Inquiry create call so submitted leads land in CRM. PB uses Salesforce's `pba__Request__c` custom object — not the standard SF Lead — and `pba__FieldName__c` naming. Field mapping module already exists (see Done section). Auth flow + HTTP client are what's left.

Critical that PB outages don't silently drop leads — add an email-on-failure fallback before going live.

## ✅ Done

- [x] Field mapping module — `lib/propertybase-mapping.ts` (FIELD_MAP, INQUIRY_DEFAULTS, `buildInquiryPayload(lead)`)
- [x] Unit tests for the mapping module — `lib/propertybase-mapping.test.ts` (6 assertions)
- [x] Route now logs the PB-shaped payload, not the raw form input
- [x] `.env.example` documenting `PROPERTYBASE_INSTANCE_URL` and `PROPERTYBASE_ACCESS_TOKEN`

## Action Items

### Unblock
- [ ] Decide auth approach: Client Credentials Flow (recommended for server-to-server) vs. JWT Bearer vs. long-lived refresh token
- [ ] Obtain Salesforce instance URL (e.g. `https://nan-properties.my.salesforce.com`)
- [ ] Obtain Connected App credentials (Client ID / Secret) OR a long-lived access token
- [ ] Confirm the exact picklist value for `pba__Type__c` and any required `pba__Source__c` (currently TODOs in `lib/propertybase-mapping.ts`)
- [ ] Get the Salesforce record ID of the "The White Oak" project record — needed for `pba__Project_pb__c`
- [ ] Decide the fallback inbox: where leads go if PB returns 5xx or times out

### Build
- [ ] Create `.env.local` from `.env.example` with real values (gitignored — already covered)
- [ ] Add `lib/propertybase.ts` — token-fetch + `createInquiry(inquiry)` helper. Pattern mirrors `nan-crm/apps/agent-app/src/sf.ts` (Bearer token, JSON POST to `/services/data/v60.0/sobjects/pba__Request__c`)
- [ ] Update `app/api/subscribe/route.ts` to call the PB client on valid input
- [ ] Update `INQUIRY_DEFAULTS` and `FIELD_MAP` in `lib/propertybase-mapping.ts` to fill in the TODO values once known
- [ ] Implement fallback: on PB failure (any non-2xx or timeout), log the full payload AND email it to the fallback inbox; return 200 to the user so they don't see an error
- [ ] Add `PROPERTYBASE_*` vars to Vercel dashboard (Production + Preview)

### Test
- [ ] Write integration tests for the route handler (mock `fetch`/`global.fetch` — see `backlog/post-handler-integration-tests.md`)
- [ ] Test cases: PB 200, PB 5xx, PB timeout, malformed PB response, valid lead with missing optional phone
- [ ] Manual: submit through the live modal once; confirm the Inquiry appears in PB; intentionally break the token; confirm fallback fires

### Ship
- [ ] Deploy to Vercel, test once, monitor logs

## Technical Details

- Mapping module: `lib/propertybase-mapping.ts` — single source of truth for our form fields → `pba__*__c` Salesforce fields. Adding a new field later is a 3-step recipe documented at the top of the file.
- Stub location: `app/api/subscribe/route.ts` — search for `TODO(propertybase)`. Field shape is already correct, only the HTTP call is missing.
- Validator: `lib/validate-lead.ts` (done, fully tested).
- Reference implementation: `nan-crm/apps/agent-app/src/sf.ts` — same Salesforce REST shape, different auth (PKCE-based browser OAuth for that app; our use case is server-to-server).
- Vercel env vars: set them in Project Settings → Environment Variables; injected at build + runtime.
- Salesforce REST endpoint: `POST {INSTANCE_URL}/services/data/v60.0/sobjects/pba__Request__c` with `Authorization: Bearer <token>` and `Content-Type: application/json`.

## Why a Fallback Matters

If PB is down for 10 minutes and 3 inquiries arrive, a stub-and-pray approach loses them. The fallback emails ensure every lead is at least visible to a human within minutes of submission, even when the integration fails.
