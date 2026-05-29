# Transfer Repo + Vercel Project to Nan Org

## Summary
Repo currently lives under Tony's personal GitHub (`thetonyalvarez/thewhiteoakhouston`); Vercel project sits under his personal Vercel account. Once the engagement signs and this site is officially a Nan property, transfer both so the project isn't coupled to one person's accounts.

## When To Do This

Don't transfer until:
- Engagement is signed and The White Oak is officially under Nan & Co. Developer Services
- A Nan GitHub org exists with admin access for whoever should own this repo
- A Nan Vercel team exists with appropriate billing setup

## Action Items

### GitHub
- [ ] Decide which GitHub org/team should own the repo
- [ ] On GitHub: Settings → Transfer ownership → enter the destination org
- [ ] After transfer, update local clones: `git remote set-url origin <new URL>`
- [ ] Update `docs/quick-reference.md` and `README.md` with the new repo URL

### Vercel
- [ ] Decide which Vercel team should own the project
- [ ] On Vercel: Project → Settings → Transfer Project → select destination team
- [ ] Reconnect the Git integration if needed (the transfer should preserve it, but verify)
- [ ] Re-add environment variables on the destination team (Vercel does NOT carry env vars across transfers)
- [ ] Trigger a redeploy and verify the site is still live

### Custom Domain (if applicable)
- [ ] If DNS cutover has already happened, re-add the custom domain to the project in the destination team — Vercel transfers the project, not the domain claim

## Risks

- **Env vars lost on Vercel transfer.** Have `.env.local` or a password-manager note ready so you can re-add `PROPERTYBASE_*` vars immediately post-transfer to avoid downtime.
- **GitHub Actions / Vercel deploy hooks** referencing the old URL will break. Audit any external integration (Slack notifications, etc.) before transferring.
