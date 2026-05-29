# Typography Sharpening

**Shipped:** Commit `a8b81f5` on `main`

## Summary
Added the standard browser type-rendering hints to `body` and pinned the headline to Fraunces' sharpest cut. Zero perf cost — these are render-hint properties, not new requests.

## What Shipped
- `app/globals.css` — added `text-rendering: optimizeLegibility`, `font-feature-settings: "kern", "liga", "calt"`, `font-optical-sizing: auto` to `body`
- `app/page.tsx` — headline `fontVariationSettings` now includes `"SOFT" 0`, pinning Fraunces' soft↔sharp axis to the chiseled end

## Key Decisions
- **`optimizeLegibility` over default:** turns on kerning + ligatures even at small sizes
- **Explicit OpenType features:** doesn't depend on browser defaults; same rendering across Chrome/Safari/Firefox
- **`font-optical-sizing: auto`:** browser uses Fraunces' `opsz` axis automatically per size — small text gets the version designed for small text
- **`SOFT 0` on headline:** Fraunces' design surface lets us pick how chiseled the letterforms are; for The Heights' warm-industrial direction, sharp wins
