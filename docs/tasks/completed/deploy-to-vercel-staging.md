# Deploy to Vercel

**Shipped:** Live at https://thewhiteoakhouston.vercel.app/

## Summary
Connected the GitHub repo to Vercel via the dashboard import flow. Vercel auto-detected Next.js, no build configuration needed. Every push to `main` now triggers a production deploy; preview deploys spin up automatically for any branch.

## What Shipped
- Production deployment at `thewhiteoakhouston.vercel.app`
- Auto-deploy on push to `main`
- All four icon endpoints serving (icon.png, apple-icon.png, opengraph-image.png, favicon.ico)
- `/api/subscribe` returns 200 on valid payload, 400 on validation failure — verified live

## What Was Deferred (Not Blockers)
- **Vercel Web Analytics** — one-toggle add in the Vercel dashboard plus `<Analytics />` from `@vercel/analytics/next`. Add when Tony wants traffic data.
- **Vercel account / org transfer** — repo lives under Tony's personal GitHub; project sits under Tony's personal Vercel. Transfer to Nan org once engagement signs.
- **Sharing with Nancy / Henrry** — Tony's call when to send the URL.

## Issue Caught + Fixed in Same Push Cycle
First deploy's OG meta tag pointed to `https://thewhiteoakhouston.com/opengraph-image.png` — the apex domain, which is still Squarespace until DNS cutover. Anyone sharing the vercel.app URL would have gotten a broken preview card. Fixed: `metadataBase` now falls back to `VERCEL_URL` when `NEXT_PUBLIC_SITE_URL` isn't set, so previews resolve correctly from whatever URL the site is currently served at.

## Key Decisions
- **GitHub-push deploys, not CLI:** zero-friction, no `vercel` binary required locally
- **No DNS cutover yet:** apex domain stays on Squarespace until Henrry/owner signs off; `vercel.app` URL is the review surface
- **Production branch = `main`:** standard pattern, matches every sibling project
