# Accessibility — Automated axe Checks

## Summary
The modal does focus management, Escape-to-close, and `aria-modal` — manually. Add `@axe-core/playwright` to the E2E smoke test so any regression in accessibility shows up in CI before it ships. Cheap insurance.

## Action Items

- [ ] Install Playwright + axe: `npm i -D @playwright/test @axe-core/playwright`
- [ ] Create `e2e/landing.spec.ts` with one happy-path test (visit, click button, fill form, submit, assert success)
- [ ] Add `await new AxeBuilder({page}).analyze()` to assert zero a11y violations on both the page and the open modal
- [ ] Add `npm run test:e2e` script to `package.json`
- [ ] Wire to CI when CI exists (see `backlog/setup-ci.md` once created)

## Technical Details

- Axe catches: missing labels, low contrast, missing alt, broken landmarks, focus traps. It does NOT catch nuanced UX a11y (e.g., "this announcement is awkward for screen readers") — those need manual testing.
- Current modal a11y: explicit `role="dialog"`, `aria-modal="true"`, `aria-labelledby` linking the heading, Escape key handler, focus moves to first field, backdrop click closes, scroll lock — should pass axe out of the box.

## Why Backlog

No CI yet; axe in a local-only test is fine but doesn't catch regressions a contributor introduces. Land this together with CI setup.
