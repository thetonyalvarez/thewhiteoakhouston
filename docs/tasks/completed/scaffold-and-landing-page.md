# Scaffold + Landing Page

**Shipped:** Commit `22edcf3` on `main`

## Summary
Scaffolded Next.js 15.4.10 + React 19 + TypeScript via `create-next-app`. Downgraded to Tailwind 3.4.17 (from the scaffold's default v4) to match every sibling project's convention and to run on the local Node 18 toolchain. Built the landing page: bone background, centered "The Heights, Rooted." Fraunces headline at fluid `clamp(3rem, 12vw, 9rem)`, "Hear From Us" button below.

## What Shipped
- `app/page.tsx` — landing page
- `app/layout.tsx` — root layout with Fraunces + Inter fonts via `next/font/google`
- `app/globals.css` — bone background, font registration, body type rules
- `tailwind.config.ts` — `bone`/`ink` color tokens, font family tokens
- `postcss.config.mjs` — Tailwind v3 + autoprefixer

## Key Decisions
- **Tailwind v3 not v4:** v4's native binding requires Node 20; team standard is v3.4.x
- **Fraunces + Inter:** free, self-hosted via `next/font`, no FOUT, Vercel-friendly
- **Fluid headline sizing:** `clamp(3rem, 12vw, 9rem)` scales beautifully from mobile to desktop without breakpoints
