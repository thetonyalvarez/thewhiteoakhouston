# The White Oak

**Pre-launch landing page for The White Oak — a 42-residence boutique condo in Houston Heights.** Captures inquiries while the brand engagement, photography, and full site are in production.

**Live:** https://thewhiteoakhouston.vercel.app/

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # run unit tests
```

## Tech Stack
- Next.js 15.4.10 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4.17
- Fraunces (display) + Inter (UI) via `next/font/google`
- Vitest + React Testing Library
- Vercel — auto-deploys on push to `main`

## Current Status
- ✅ Landing page deployed — "The Heights, Rooted." + Hear From Us modal
- ✅ `/api/subscribe` validates leads + context and builds the full PB-shaped Inquiry payload (logs server-side; HTTP POST is next)
- ✅ Propertybase field mapping done — 15 fields land cleanly per the live PB org's schema
- ✅ Bone placeholder icons across favicon, apple-touch, Open Graph
- ✅ Vitest harness with 39 assertions across validators + mapping
- ✅ Vercel auto-deploy from GitHub `main`
- 🚧 Propertybase HTTP client + auth (blocked on Connected App credentials + auth-flow decision)
- 📋 Bot / spam protection (queued as active task #02)
- 📋 DNS cutover from Squarespace
- 📋 Real brand assets (blocked on engagement signing)

## Documentation

📖 **[Full Documentation](docs/start-here.md)** — Setup, roadmap, and the why behind the decisions

📋 **[Current Tasks](docs/tasks/active/)** — What's being worked on now

🔧 **[Quick Reference](docs/quick-reference.md)** — Commands, URLs, and common fixes
