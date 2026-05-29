# Brand Tokens

Single source of truth for The White Oak's current visual tokens. Pre-engagement, so these are placeholders informed by the brand platform notes (Heights: warm industrial, understated). Will be replaced when the formal brand system is delivered.

## Colors

| Token | Hex | RGB | Used in |
|---|---|---|---|
| `bone` | `#ECE2CB` | 236 / 226 / 203 | Page background, all 4 placeholder icons, button hover text color |
| `ink` | `#1A1410` | 26 / 20 / 16 | All text, button borders, button background on hover |

The bone is intentionally warm — toward oat rather than gray — to match the Heights direction in `brand-guidelines.json`. The ink is near-black but slightly warm, so it never reads as harsh black against the bone.

## Where the Hex Values Live

| File | What it controls |
|---|---|
| `tailwind.config.ts` | `bone` / `ink` Tailwind classes — `bg-bone`, `text-ink`, etc. |
| `app/globals.css` | `html`/`body` background-color and color directly (loaded before Tailwind utilities apply) |
| `scripts/generate-placeholder-icons.mjs` | `BONE` constant used to render the four placeholder icons |

**If you change the bone color, change it in all three places** and re-run `node scripts/generate-placeholder-icons.mjs`. The mismatch will be visually obvious (icons no longer blend into the page) but easy to miss in a hurry.

## Typography

| Role | Family | Loaded via | File |
|---|---|---|---|
| Display | **Fraunces** (variable, Google Fonts) | `next/font/google` | `app/layout.tsx` |
| UI / body | **Inter** (variable, Google Fonts) | `next/font/google` | `app/layout.tsx` |

Both are free, self-hosted by Next at build time (no runtime font request to Google), and exposed as CSS variables:

- `var(--font-fraunces)`
- `var(--font-inter)`

Used in `tailwind.config.ts` as `font-display` and `font-sans`.

## Fraunces Variable Axes In Use

| Axis | Value | Effect |
|---|---|---|
| `opsz` (optical size) | `144` on the headline | Uses Fraunces' display-sized letterforms |
| `SOFT` (soft↔sharp) | `0` on the headline | Pins to the chiseled, sharp end |

Set via `style={{ fontVariationSettings: '"opsz" 144, "SOFT" 0' }}` on the `<h1>` in `app/page.tsx`.

Inter's variable axes are managed automatically by `font-optical-sizing: auto` in `globals.css`.

## What's NOT Tokenized (Yet)

These are inline in components today. When the design system formalizes, move them to tokens:

- Headline size: `clamp(3rem, 12vw, 9rem)` on `app/page.tsx`
- Headline tracking: `tracking-[-0.02em]`
- Headline leading: `leading-[0.95]`
- Button letterspacing: `tracking-[0.2em] uppercase`
- Modal max-width: `max-w-md`
- Field underline color: `border-ink/30` / `border-ink` on focus

## Don't

- Don't use generic Tailwind grays for text. Use `text-ink` or `text-ink/[opacity]` so a future bone-to-other-color rebrand is a one-file change.
- Don't introduce a third color without updating this doc and `tailwind.config.ts`. The two-color palette is intentional — preserves the editorial feel and prevents drift.
