# POST Handler Integration Tests

## Summary
Add Vitest integration tests for the `/api/subscribe` route handler itself, complementing the existing unit tests on the validator. Catches refactors that break the route → validator → response wiring and gives us the test scaffold to extend with Propertybase failure cases.

## Action Items

- [ ] Create `app/api/subscribe/route.test.ts`
- [ ] Test happy path: valid payload → 200 `{ok: true}`
- [ ] Test malformed JSON: invalid body → 400 "Invalid JSON"
- [ ] Test validation error: missing firstName → 400 "First name is required"
- [ ] After Propertybase wiring lands, add:
  - [ ] PB returns 200 → handler returns 200 AND PB was called once with mapped fields
  - [ ] PB returns 5xx → handler returns 200 (don't error the user) AND fallback log/email fires
  - [ ] PB times out → handler returns 200 AND fallback log/email fires
  - [ ] PB returns malformed response → handler returns 200 AND fallback fires

## Technical Details

- Test pattern: import `POST` from the route file, call it with a `Request` object, assert on the returned `Response`
- Mock `fetch` (or whichever PB client wraps it) at the module boundary using `vi.mock()` or `vi.spyOn(global, "fetch")`
- File goes in `app/api/subscribe/route.test.ts` so it lives next to the code it tests; Vitest auto-discovers `*.test.ts` anywhere

## Why This Is Backlog (Not Active)

The stub already returns the expected responses, and the validator (the actual business logic) is fully unit-tested. The real value of these integration tests is the test scaffold for the Propertybase failure cases — and those cases don't exist yet. Easier to write them when there's a real PB client to mock.
