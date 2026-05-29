# DNS Cutover from Squarespace to Vercel

## Summary
The apex domain `thewhiteoakhouston.com` currently resolves to the legacy Squarespace site. The new Next.js lander is live at `https://thewhiteoakhouston.vercel.app/`. Once Tony is ready to flip, repoint DNS to Vercel and update `NEXT_PUBLIC_SITE_URL` so OG previews resolve from the custom domain.

## Pre-cutover Checks

- [ ] Propertybase wiring is complete (`active/01-wire-propertybase-lead-capture.md`) and tested in production — never cut over with the form still in stub mode
- [ ] Bot / spam protection shipped (`active/02-bot-spam-protection.md`) — bots will find a public lead form within hours
- [ ] Real brand assets swapped if delivered (`backlog/swap-placeholder-icons-for-real-brand.md`), or accept that the bone placeholder ships to the public domain
- [ ] Tony has logged into the Squarespace account and located DNS settings + current MX records (so no email is lost in the cutover)
- [ ] At least one full end-to-end submission tested on production Vercel deploy lands in the production PB org

## Action Items

- [ ] In Vercel: Project → Settings → Domains → add `thewhiteoakhouston.com` and `www.thewhiteoakhouston.com`. Vercel provides the DNS records to set.
- [ ] In Squarespace (or wherever DNS is hosted): update A / CNAME records to point at Vercel. Preserve MX records exactly so email keeps working.
- [ ] Wait for DNS propagation (TTL-dependent, usually < 1 hour)
- [ ] Vercel auto-issues TLS via Let's Encrypt — confirm `https://thewhiteoakhouston.com` resolves with a green padlock
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://thewhiteoakhouston.com` in Vercel Production env vars; redeploy
- [ ] Confirm `<meta property="og:image">` now points to the custom domain (curl the page, grep the tag)
- [ ] Share the canonical URL with anyone who has the vercel.app URL bookmarked

## Rollback

If something breaks, in Vercel Domains → Remove the custom domain (the vercel.app URL stays live). DNS revert in the registrar to the previous Squarespace A records.

## Technical Details

- Squarespace site lives at the same `thewhiteoakhouston.com` apex; only the DNS records change
- TLS: Vercel auto-provisions and renews
- The `metadataBase` resolver in `app/layout.tsx` already prefers `NEXT_PUBLIC_SITE_URL`; setting it in production env vars switches OG images cleanly
- Vercel's `*.vercel.app` URL keeps working after cutover — useful for testing
