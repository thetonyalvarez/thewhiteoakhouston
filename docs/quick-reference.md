# Quick Reference

One-pager. If you do something twice, it belongs here.

## Commands

```bash
npm run dev              # dev server, http://localhost:3000
npm run build            # production build
npm run start            # serve production build locally
npm run lint             # ESLint
npm test                 # run all Vitest suites once
npm run test:watch       # re-run tests on save
```

Regenerate placeholder icons (bone squares) from the brand hex:

```bash
node scripts/generate-placeholder-icons.mjs
```

## URLs

| Where | URL |
|---|---|
| Local dev | http://localhost:3000 |
| GitHub repo | https://github.com/thetonyalvarez/thewhiteoakhouston |
| Production domain (planned) | https://thewhiteoakhouston.com |
| Squarespace (current public site) | https://thewhiteoakhouston.com |

## File Locations

| What | Where |
|---|---|
| Landing page | `app/page.tsx` |
| Modal + form | `app/components/HearFromUs.tsx` |
| Lead capture API | `app/api/subscribe/route.ts` |
| Validator (pure, testable) | `lib/validate-lead.ts` |
| Validator tests | `lib/validate-lead.test.ts` |
| Brand color tokens | `tailwind.config.ts` (`bone`, `ink`) |
| Font registration | `app/layout.tsx` |
| Global CSS | `app/globals.css` |
| Icon generator | `scripts/generate-placeholder-icons.mjs` |
| Favicons / OG image | `app/{favicon.ico,icon.png,apple-icon.png,opengraph-image.png}` |

## Brand Tokens

| Token | Hex | Used for |
|---|---|---|
| `bone` | `#ECE2CB` | Page background, icons, button hover bg-inverse |
| `ink` | `#1A1410` | Text, button borders, button bg on hover |

See **[reference/brand-tokens.md](reference/brand-tokens.md)** for the full story.

## Common Fixes

**"Port 3000 is in use"** — Next.js auto-jumps to 3001. Or kill the stale process:
```bash
lsof -ti:3000 | xargs kill
```

**"Cannot find native binding" (Tailwind oxide)** — Tailwind v4 was installed instead of v3. Fix:
```bash
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@3.4.17 postcss@8.4.49 autoprefixer@10.4.20
```

**Tests can't find `@/lib/...`** — `vitest.config.ts` must include the `@` alias matching `tsconfig.json`. It does today; if you change `tsconfig.json` paths, update vitest config too.

**Dev server shows stale page** — clear Next's cache:
```bash
rm -rf .next && npm run dev
```

## Conventions

- **Don't amend commits.** Always make new commits.
- **No `git add -A` or `git add .`** Add specific paths.
- **Commit format:** Imperative subject line, blank line, body explaining the *why*, then `Co-Authored-By` trailer.
- **Branches:** Work on `main` for now (single contributor, no CI). Move to feature branches once a second contributor or Vercel preview deploys are wired up.
