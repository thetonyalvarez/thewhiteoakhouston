# 02 — Wire Propertybase Lead Capture

🔒 **BLOCKED on Propertybase credentials + field mapping from Tony.**

## Summary
Replace the stub `console.info` in `app/api/subscribe/route.ts` with a real Propertybase Lead create call so submitted leads land in CRM. Critical that PB outages don't silently drop leads — add an email-on-failure fallback before going live.

## Action Items

### Unblock
- [ ] Tony obtains: `PROPERTYBASE_API_BASE`, `PROPERTYBASE_API_TOKEN`, `PROPERTYBASE_LEAD_SOURCE_ID`
- [ ] Tony confirms field mapping: which PB Lead fields correspond to our `firstName` / `lastName` / `email` / `phone`, plus any required defaults (assigned owner, project = "The White Oak", campaign tag)
- [ ] Tony decides the fallback inbox: where leads go if PB returns 5xx or times out

### Build
- [ ] Create `.env.example` documenting the required env vars (commit it)
- [ ] Create `.env.local` with real values (gitignored — already covered)
- [ ] Add a minimal PB client in `lib/propertybase.ts` — POST a Lead with the mapped fields, 10-second timeout
- [ ] Update `app/api/subscribe/route.ts` to call the PB client on valid input
- [ ] Implement fallback: on PB failure (any non-2xx or timeout), log the full payload AND email it to the fallback inbox; return 200 to the user so they don't see an error
- [ ] Add `PROPERTYBASE_*` vars to Vercel dashboard (Production + Preview)

### Test
- [ ] Write integration tests for the route handler (mock `fetch`/`global.fetch` — see `backlog/post-handler-integration-tests.md`)
- [ ] Test cases: PB 200, PB 5xx, PB timeout, malformed PB response, valid lead with missing optional phone
- [ ] Manual: submit through the live modal once; confirm the lead appears in PB; intentionally break the token; confirm fallback fires

### Ship
- [ ] Deploy to Vercel preview, test once, promote to production

## Technical Details

- Stub location: `app/api/subscribe/route.ts` (search for `TODO(propertybase)`)
- Validator (already done): `lib/validate-lead.ts`
- Vercel env vars: set them in Project Settings → Environment Variables; they're injected at build + runtime
- PB API docs: ask Nan's PB admin for the relevant endpoint reference — typically `POST /api/v1/leads`

## Why a Fallback Matters

A wrong email is worse than a late one (Tony's rule from `CLAUDE.md`). If PB is down for 10 minutes and 3 inquiries arrive, a stub-and-pray approach loses them. The fallback emails ensure every lead is at least visible to a human within minutes of submission, even when the integration fails.
