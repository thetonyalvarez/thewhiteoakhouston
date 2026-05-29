# 02 — Bot / Spam Protection on Lead Capture

## Summary
Lead capture forms attract bots within hours of going public. Add either a honeypot field (zero-friction, catches naive bots) or Cloudflare Turnstile (catches more, slightly more setup). Worth shipping before DNS cutover.

The codebase already has a clean place for this: `InquiryContext` (in `lib/validate-inquiry-context.ts`) is the per-submission metadata bucket — honeypot lives there alongside `signupUrl`.

## Action Items

- [ ] Decide: honeypot vs. Turnstile vs. both
- [ ] **Honeypot path (recommended first):**
  - [ ] Add a hidden `<input name="website">` field to the modal; CSS-hide it (don't `display: none` — some bots skip those; use `tabindex="-1"`, `autocomplete="off"`, position offscreen)
  - [ ] Include `website: String(formData.get("website") ?? "")` in the form payload
  - [ ] In `validateInquiryContext`, reject submissions where `website` is non-empty (return 400 with a generic "Submission failed" message — don't reveal it's a honeypot)
  - [ ] Add unit tests for both empty and non-empty honeypot values
- [ ] **Turnstile path:**
  - [ ] Sign up at https://dash.cloudflare.com/?to=/:account/turnstile
  - [ ] Add `<Turnstile />` widget to the modal form
  - [ ] Verify the token server-side in `/api/subscribe` before calling `buildInquiryPayload`
  - [ ] Store `TURNSTILE_SITE_KEY` (public) and `TURNSTILE_SECRET` (env) in Vercel
- [ ] Add a component test confirming the form fails gracefully if the honeypot fires or Turnstile rejects

## Technical Details

- Current form: `app/components/HearFromUs.tsx`
- Context validator: `lib/validate-inquiry-context.ts` (extend with `honeypot` field)
- API route: `app/api/subscribe/route.ts` — already calls `validateInquiryContext`, so no orchestration changes needed
- Turnstile is free up to 1M requests/month

## Recommendation

Start with the honeypot — it's a 10-line change with zero user friction and integrates cleanly into the existing context validator. Layer Turnstile on top later if spam rates make it necessary. Don't ship Turnstile alone without checking that it doesn't break the luxury feel of the form.
