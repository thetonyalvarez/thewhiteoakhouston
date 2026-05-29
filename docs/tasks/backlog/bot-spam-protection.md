# Bot / Spam Protection on Lead Capture

## Summary
Lead capture forms attract bots within hours of going public. Add either a honeypot field (zero-friction, catches naive bots) or Cloudflare Turnstile (catches more, slightly more setup). Either is worth shipping before DNS cutover.

## Action Items

- [ ] Decide: honeypot vs. Turnstile vs. both
- [ ] **Honeypot path:**
  - [ ] Add a hidden `<input name="website">` field to the modal; CSS-hide it so humans never see it
  - [ ] In `lib/validate-lead.ts` or the route, reject any submission where `website` is non-empty
  - [ ] Add a unit test
- [ ] **Turnstile path:**
  - [ ] Sign up at https://dash.cloudflare.com/?to=/:account/turnstile
  - [ ] Add `<Turnstile />` widget to the modal form
  - [ ] Verify the token server-side in `/api/subscribe` before validating the lead
  - [ ] Store `TURNSTILE_SITE_KEY` (public) and `TURNSTILE_SECRET` (env) in Vercel
- [ ] Add a component test confirming the form fails gracefully if the honeypot fires or Turnstile rejects

## Technical Details

- Current form: `app/components/HearFromUs.tsx`
- API route: `app/api/subscribe/route.ts`
- Turnstile is free up to 1M requests/month; Tony already uses Cloudflare for other Nan properties

## Recommendation

Start with the honeypot — it's a 10-line change with zero user friction. Layer Turnstile on top later if spam rates make it necessary. Don't ship Turnstile alone without checking that it doesn't break the luxury feel of the form.
