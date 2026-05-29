# Tech Stack Rationale

Why each choice. Written so a future contributor can challenge a decision with full context, not so they have to reverse-engineer it.

## Next.js 15.4.10 (App Router) + React 19

**Why:** Every sibling project on this team uses Next.js (`thebeverlyhouston.com`, `mvl-website`, `nan-properties-website-2024`, `the-closing-club`). Matching that stack means zero ramp-up for anyone else who joins, identical Vercel deployment story, and shared muscle memory for routing, fonts, and metadata.

**Why App Router specifically:** new convention as of Next 13.4; file-based metadata (`app/icon.png`, `app/opengraph-image.png`) is dramatically simpler than the pages-router equivalent. Server components default lets us keep the page mostly static and only mark `HearFromUs` as `"use client"`.

**Alternatives considered:** Astro (great for static), SvelteKit (no team familiarity). Both would have meant a one-off stack.

## TypeScript

**Why:** Catches the class of "I renamed a field in `lib/validate-lead.ts` and forgot to update `route.ts`" bugs at compile time. Trivial cost for a project this small; pays compounding returns as it grows.

## Tailwind CSS 3.4.17 (NOT v4)

**Why v3:** Every sibling project uses 3.4.x. Tailwind v4's native binding (`@tailwindcss/oxide`) requires Node 20+; local dev runs on Node 18. Switching avoids both consistency drift and toolchain friction.

**When to revisit:** If/when the team upgrades local Node to 20+ across all projects, migrate everyone simultaneously. Don't be the first.

## Fraunces (display) + Inter (UI)

**Why Fraunces:** A variable serif with optical sizing and a soft↔sharp axis. For The Heights direction (warm industrial, editorial-not-glossy), Fraunces at sharp setting reads as confident without feeling Miami or Museum District. Free, on Google Fonts, self-hostable via `next/font`.

**Why Inter:** The least-opinionated modern UI sans. Renders cleanly at small sizes, gets out of the way on buttons and form fields, doesn't compete with Fraunces.

**Alternatives:** Canela Deck (paid, ~$1k+); PP Editorial New (paid). Worth revisiting if a paid license fits the budget post-engagement. Until then, Fraunces is a credible stand-in.

## Vitest (NOT Jest)

**Why:** Vitest uses Vite's transformer, which means it natively understands TypeScript, JSX, and ESM without a Babel config. ~3x faster than Jest on this codebase. Same API surface (`describe`/`it`/`expect`) so RTL muscle memory transfers.

**Why 2.x not 3.x:** Vitest 3 dropped Node 16 and is still settling — 2.x is the production-safe pick for Node 18.

## React Testing Library + jest-dom matchers

**Why:** Tests components as a user uses them, not as the framework rendered them. Steers contributors away from snapshot tests and toward behavioral tests, which catch real regressions.

## Vercel

**Why:** Zero-config Next.js deployment, automatic preview deploys per branch, built-in analytics, runs on the same team account as `thebeverlyhouston.com`. Free tier is plenty for pre-launch traffic.

**Alternatives:** Netlify (similar), Cloudflare Pages (cheaper but requires Workers for the API route). No reason to deviate from team standard.

## `next/font/google` (NOT a `<link rel="stylesheet">` to fonts.googleapis.com)

**Why:** `next/font` downloads the fonts at build time, self-hosts them on Vercel's CDN, and inlines the CSS in the HTML head. Zero external requests, no FOUT, no GDPR concerns from Google receiving visitor IPs.

## NPM (NOT pnpm / yarn / bun)

**Why:** Matches every sibling project. No reason to introduce a new package manager for one project.

## Solid Bone Placeholder Icons (NOT a generic logo)

**Why:** A wrong logo would be worse than no logo, and a stock "house" icon would cheapen the page. A flat bone square matching the background reads as "intentionally minimal" and removes any default `favicon.ico` (which would otherwise be the Next.js triangle). When the real brand mark arrives, the drop-in is one git commit.

## Things We Don't Have And Why That's Fine (For Now)

- **No CI:** single contributor, no `npm test` gating yet. Add when a second person joins.
- **No E2E tests:** the modal → API contract is verifiable in ~30 seconds by hand on a stub site. Worth automating once Propertybase wiring lands.
- **No Storybook:** one component (`HearFromUs`). Overkill.
- **No analytics:** sub-task of the Vercel staging deploy; Vercel Web Analytics flips on with one toggle.
- **No CMS:** the page has 4 words of copy. A CMS would be 100x the build for 0x the value.
