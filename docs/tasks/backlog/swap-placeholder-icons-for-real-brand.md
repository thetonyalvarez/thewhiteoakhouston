# Swap Placeholder Icons for Real Brand Mark

## Summary
When the formal brand engagement signs and the designer delivers The White Oak's mark, replace the four bone-square placeholder icons. Two paths — drop-in PNGs (fastest) or regenerate via script (repeatable).

## Action Items

- [ ] Receive deliverables from designer: 1024×1024 SVG of the final mark (preferred), or PNGs at 512×512, 180×180, 1200×630
- [ ] Decide path: manual drop-in vs. extend `scripts/generate-placeholder-icons.mjs`
- [ ] **Manual path:** save new files at `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png`, `app/favicon.ico` (overwrite); commit; deploy
- [ ] **Scripted path:** extend the generator to accept an SVG input and rasterize at each size; commit script + regenerated outputs
- [ ] Verify in production: hard-refresh, check the Vercel project tile, share a test link in Slack/iMessage and confirm the OG image renders
- [ ] If the brand mark uses a non-bone background, also update `tailwind.config.ts` colors + `app/globals.css` body background

## Technical Details

- Current files: `app/{favicon.ico,icon.png,apple-icon.png,opengraph-image.png}`
- Current generator: `scripts/generate-placeholder-icons.mjs` (pure Node, zlib only)
- Sizes Next expects:
  - `icon.png`: 512×512 (modern browser favicon)
  - `apple-icon.png`: 180×180 (iOS home screen)
  - `opengraph-image.png`: 1200×630 (social previews)
  - `favicon.ico`: any size, PNG-in-ICO supported by all modern browsers

## Notes

Browser favicon caches are aggressive. After deploy, validate in an incognito window — not your normal session.
