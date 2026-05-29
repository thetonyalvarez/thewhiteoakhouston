# Email Capture Modal + API Stub

**Shipped:** Commit `22edcf3` on `main`

## Summary
Built the "Hear From Us" client component as a modal: First/Last/Email/Phone fields, Escape-to-close, scroll lock, focus management, success state, error state. Stubbed `POST /api/subscribe` with validation that logs server-side until Propertybase credentials arrive.

## What Shipped
- `app/components/HearFromUs.tsx` — client component, modal with full a11y (role/aria-modal/aria-labelledby/focus/Escape)
- `app/api/subscribe/route.ts` — POST handler that validates and stubs
- `lib/validate-lead.ts` — extracted in a later commit for testability

## Key Decisions
- **Modal not separate route:** keeps the lander single-page-feeling; no router transitions on a placeholder site
- **Stub logs only:** explicit `TODO(propertybase)` block documents exactly what creds + field mapping unblock the real wiring
- **Phone optional:** lowers form friction; PB lead can survive without it
