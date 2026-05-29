# Vitest Harness + Validator Tests

**Shipped:** Commit `22edcf3` on `main`

## Summary
Installed Vitest 2.x + React Testing Library + jsdom. Extracted `validate()` from the route handler into `lib/validate-lead.ts` so it can be unit-tested without spinning up Next. Wrote a 17-assertion suite covering valid payloads, missing fields, malformed emails, optional phone, non-object bodies, whitespace trimming, and a `__proto__` injection attempt that confirms unknown fields never leak to Propertybase.

## What Shipped
- `vitest.config.ts` — jsdom env, `@/*` alias matching tsconfig
- `vitest.setup.ts` — RTL matchers
- `lib/validate-lead.ts` — pure, Next-free validator
- `lib/validate-lead.test.ts` — 17 assertions across 8 scenarios
- `package.json` — `test` and `test:watch` scripts

## Key Decisions
- **Vitest 2.x not 3.x:** 3.x dropped Node 16, 2.x runs cleanly on Node 18
- **Extracted validator to `lib/`:** the route file imports it; lets us test logic without the Next.js runtime, and the function is reusable for any future capture form
- **`it.each` for parameterized cases:** 8 scenarios become 17 assertions without test-file bloat
