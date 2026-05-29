# How to: Run Tests Locally

## TL;DR

```bash
npm test           # one-shot, exits with status
npm run test:watch # re-runs on save
```

## What Runs

Vitest auto-discovers any `*.test.ts` or `*.test.tsx` file anywhere in the project. Today:

- `lib/validate-lead.test.ts` — 17 assertions on the lead validator

## Adding a Test

Drop a `*.test.ts` next to the code it tests (preferred) or under `lib/` for shared logic. Vitest globals (`describe`, `it`, `expect`) are enabled in `vitest.config.ts` — no imports needed for those, but you do need to import the function under test.

Example skeleton:

```ts
import { describe, expect, it } from "vitest";
import { thing } from "./thing";

describe("thing", () => {
  it("does what it should", () => {
    expect(thing(input)).toEqual(expected);
  });
});
```

## Component Tests (when you add them)

React Testing Library + jest-dom matchers are installed and wired through `vitest.setup.ts`. Example:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import HearFromUs from "@/app/components/HearFromUs";

it("opens the modal when the button is clicked", async () => {
  render(<HearFromUs />);
  await userEvent.click(screen.getByRole("button", { name: /hear from us/i }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
```

## Debugging a Failing Test

```bash
npm test -- --reporter=verbose         # show each assertion
npm test -- lib/validate-lead.test.ts  # run a single file
npm test -- -t "rejects malformed"     # filter by test name pattern
```

## Common Gotchas

- **Path alias not resolving in tests.** `vitest.config.ts` has its own `resolve.alias`. If you add a new alias to `tsconfig.json`, mirror it there too.
- **`window` undefined.** Means jsdom isn't loading — check `test.environment: "jsdom"` in `vitest.config.ts`.
- **`expect(...).toBeInTheDocument()` is not a function.** `vitest.setup.ts` isn't being loaded — make sure `test.setupFiles` includes it.
