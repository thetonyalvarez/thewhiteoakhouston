# Bone Placeholder Icons + OG Metadata

**Shipped:** Commit `a1baeb6` on `main`

## Summary
Generated favicon, Apple touch icon, and Open Graph image as flat bone-colored squares so browser tabs, the Vercel dashboard tile, and shared link previews all match the page background until the real brand mark arrives. Pure Node stdlib — no `sharp`, no Pillow, no ImageMagick.

## What Shipped
- `scripts/generate-placeholder-icons.mjs` — solid PNG encoder using `zlib`, plus PNG-in-ICO wrapper
- `app/icon.png` (512×512)
- `app/apple-icon.png` (180×180)
- `app/opengraph-image.png` (1200×630)
- `app/favicon.ico` (64×64 PNG inside ICO)
- `app/layout.tsx` — added `metadata.openGraph` and `metadata.twitter` blocks

## Key Decisions
- **Generate from brand hex, don't save user's pasted image:** zero compression drift; pixel-perfect match to the page background; regenerable when bone color changes
- **All four formats:** modern browsers prefer `icon.png`, iOS needs `apple-icon.png`, social/Vercel reads `opengraph-image.png`, legacy/direct requests still hit `favicon.ico`
- **Next App Router file convention:** no need to declare `metadata.icons` — Next auto-emits `<link>` and `<meta property="og:image">` tags from the filenames
