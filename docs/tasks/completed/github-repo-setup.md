# GitHub Repo Setup

**Shipped:** Repo at https://github.com/thetonyalvarez/thewhiteoakhouston, branch `main`

## Summary
Initialized git via `create-next-app`, made the first project commit (everything beyond the scaffold), added the origin remote, and pushed `main`. Two commits live: the bare scaffold and our build-on-top commit, so the history clearly shows what we authored vs. what came from the tooling.

## What Shipped
- Origin remote: `https://github.com/thetonyalvarez/thewhiteoakhouston.git`
- Branch: `main` (tracking `origin/main`)
- `.gitignore` covers `node_modules`, `.next`, `.env*`, `.DS_Store`, `.vercel`, `*.tsbuildinfo`

## Key Decisions
- **Repo under Tony's personal account (`thetonyalvarez`), not Nan org:** fastest to spin up; transfer to Nan org once engagement signs (tracked separately)
- **Two commits not amended:** keeps the create-next-app provenance visible
- **Explicit `git add` paths, never `git add -A`:** matches `CLAUDE.md` guidance, avoids accidental secret commits
