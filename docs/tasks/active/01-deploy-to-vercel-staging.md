# 01 — Deploy to Vercel Staging

## Summary
Connect the GitHub repo to Vercel and deploy to a `*.vercel.app` subdomain so Nancy and Henrry can review the lander before any DNS cutover from Squarespace. Zero-config — Vercel auto-detects Next.js.

## Action Items

- [ ] Sign in at https://vercel.com with the appropriate account (Tony personal vs. Nan org — decision below)
- [ ] Decide which Vercel account/team owns this project (see Decisions, below)
- [ ] `New Project → Import Git Repository → thetonyalvarez/thewhiteoakhouston`
- [ ] Accept the auto-detected Next.js settings (no build env vars needed yet — Propertybase creds come later)
- [ ] Deploy
- [ ] Confirm the resulting `*.vercel.app` URL renders the lander, the modal opens, and `POST /api/subscribe` returns `{"ok":true}` (lead lands in Vercel logs, not Propertybase yet)
- [ ] Share the URL with Nancy first; she gates whether Henrry sees it
- [ ] Add Vercel Web Analytics (free) so we have inquiry-rate data from day one

## Decisions Deferred

- **Vercel account ownership:** Tony's personal account is fastest to spin up but couples this project to one person. If engagement signs, transfer to a Nan org. Tracked in `backlog/transfer-vercel-to-nan-org.md` once that decision is made.
- **Branch deploys:** Default behavior pushes preview deploys for every branch. Fine for now (no contributors besides Tony). Reconsider when a second contributor joins.

## Technical Details

- Repo: https://github.com/thetonyalvarez/thewhiteoakhouston
- Framework preset: Next.js (auto-detected)
- Build command: `npm run build` (auto)
- Output directory: `.next` (auto)
- Node version: Vercel defaults to Node 20+, which is fine — local dev runs on Node 18 but production builds use Vercel's runtime
- Environment variables: none required for the stub. When Propertybase wiring lands, add `PROPERTYBASE_*` vars in Vercel dashboard (see `02-wire-propertybase-lead-capture.md`)

## Out of Scope

- DNS cutover (`thewhiteoakhouston.com` repointing from Squarespace) — requires Henrry/owner sign-off; do that AFTER they review on `*.vercel.app`
- Custom domain attachment in Vercel — also deferred until DNS decision
