# How to: Regenerate Placeholder Icons

When the brand bone color changes, or you want a different placeholder color for testing, regenerate all four icons with one command.

## TL;DR

```bash
node scripts/generate-placeholder-icons.mjs
```

Outputs (overwrites in place):
- `app/icon.png` (512×512)
- `app/apple-icon.png` (180×180)
- `app/opengraph-image.png` (1200×630)
- `app/favicon.ico` (64×64 PNG-in-ICO)

## To Change the Color

Edit `scripts/generate-placeholder-icons.mjs`:

```js
const BONE = { r: 0xec, g: 0xe2, b: 0xcb };
```

Match it to whatever's in `tailwind.config.ts` (the `bone` token). Keeping the icons and the page background in sync visually matters more than picking a "nice" color — mismatch reads as broken.

## To Change the Sizes

Edit the `targets` array in the same file. The three PNG outputs and the ICO can be any dimensions; Next.js will surface them at their native size.

## Why This Script Exists

- **Zero dependencies.** Pure Node stdlib (`zlib`). No `sharp`, no Pillow, no ImageMagick to install or update.
- **Reproducible.** Re-run any time, get byte-identical output (modulo `zlib`'s deterministic deflate).
- **Auditable.** ~100 lines of plain JS. The PNG and ICO formats are documented in the script's comments.

## When to Throw the Script Away

Once the real brand mark lands, this script becomes either:
- **Deprecated** — the designer hands you the four files directly; you just commit them
- **Extended** — the script is updated to accept an SVG input and rasterize at each size

Either is fine. Track that decision in [`tasks/backlog/swap-placeholder-icons-for-real-brand.md`](../tasks/backlog/swap-placeholder-icons-for-real-brand.md).
