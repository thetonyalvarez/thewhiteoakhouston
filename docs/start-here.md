# START HERE — The White Oak Development

## 🎯 What You're Building
**The White Oak** — a pre-launch landing page for a 42-residence boutique condo development in Houston Heights. The site captures inquiries while the formal brand engagement, photography, and full marketing site are in production.

**Current Status**: Live at https://thewhiteoakhouston.vercel.app/. Lead capture endpoint validates and logs to Vercel runtime logs — Propertybase wiring is the next milestone.

**Your Mission**: Wire `/api/subscribe` to Propertybase (blocked on credentials), then plan the DNS cutover from Squarespace once Henrry/owner signs off.

## 🚀 Quick Start (5 minutes)

### 1. Get the Code Running

```bash
# from thewhiteoakhouston.com/
npm install
npm run dev              # opens http://localhost:3000
```

In another terminal:

```bash
npm test                 # run the 17-assertion validator suite
npm run test:watch       # re-run on save
```

Sanity-check the API (local or live):

```bash
# local
curl -X POST -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"Lead","email":"test@example.com"}' \
  http://localhost:3000/api/subscribe
# → {"ok":true}

# live
curl -X POST -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"Lead","email":"test@example.com"}' \
  https://thewhiteoakhouston.vercel.app/api/subscribe
# → {"ok":true}
```

The server logs every captured lead. It does NOT yet post to Propertybase.

### 2. Your Roadmap

Work through these in order:

1. ✅ **Phase 0: Scaffold Next.js 15 + Tailwind 3 + TypeScript** — COMPLETED
2. ✅ **Phase 1: Landing page + Hear From Us modal** — COMPLETED
3. ✅ **Phase 2: `/api/subscribe` endpoint with validation + stub** — COMPLETED
4. ✅ **Phase 3: Vitest harness + validator unit tests** — COMPLETED
5. ✅ **Phase 4: Bone placeholder icons + OG metadata** — COMPLETED
6. ✅ **Phase 5: GitHub repo + initial push** — COMPLETED
7. ✅ **Phase 6: Vercel auto-deploy from `main`** — COMPLETED (live at https://thewhiteoakhouston.vercel.app/)
8. 🔒 **[Phase 7: Propertybase wiring](tasks/active/01-wire-propertybase-lead-capture.md)** ← **DO THIS NEXT** ([field mapping done](tasks/completed/propertybase-field-mapping.md); blocked on auth + Connected App credentials)
9. 📋 **[Phase 8: Bot / spam protection](tasks/active/02-bot-spam-protection.md)** — honeypot field + optional Turnstile, before DNS cutover
10. **[Phase 9: Real brand assets swap](tasks/backlog/swap-placeholder-icons-for-real-brand.md)** — when brand engagement signs
11. **[Phase 10: API hardening](tasks/backlog/)** — rate limit, structured logging, integration tests, a11y axe checks
12. **[Phase 11: Vercel Web Analytics](tasks/backlog/vercel-web-analytics.md)** — pre-launch nice-to-have for inquiry-rate visibility
13. **[Phase 12: DNS cutover from Squarespace](tasks/backlog/dns-cutover-from-squarespace.md)** — when everything above is green
14. **[Phase 13: Transfer repo + Vercel project to Nan org](tasks/backlog/transfer-to-nan-org.md)** — when engagement signs

## 📚 Documentation Structure

### When You Need Help
- **[quick-reference.md](quick-reference.md)** — Commands, file paths, and common fixes
- **[tasks/](tasks/)** — Step-by-step task lists; your active checklist
- **[reference/](reference/)** — Deep technical docs (brand tokens, lead capture flow, stack rationale)
- **[how-to-guides/](how-to-guides/)** — Project-specific walkthroughs (regenerate icons, run tests)

### Key Principle
**Read docs just-in-time.** Don't pre-load everything — open the next active task, do it, mark it done, then look at what's next. The roadmap above is the map; the task files are the turn-by-turn directions.

## ✅ Success Criteria

MVP is complete when:
- `thewhiteoakhouston.com` (the apex domain) resolves publicly to this site (currently still Squarespace)
- Submitted leads land in Propertybase reliably (with a fallback path so a PB outage doesn't drop leads silently)
- The bone placeholder icons have been swapped for the real brand mark
- Basic analytics (Vercel Web Analytics or GA4) is in place so we can measure inquiry rate

## 🎯 **Ready? Open [`tasks/active/01-wire-propertybase-lead-capture.md`](tasks/active/01-wire-propertybase-lead-capture.md) and get to work →**
