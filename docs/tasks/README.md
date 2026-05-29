# Task Management System

This directory organizes development tasks and technical improvements for The White Oak landing page.

## Directory Structure

### `active/`
Current high-priority tasks to complete in sequence. Files are prefixed with numbers (01-, 02-, etc.) to indicate order. Anything blocked is still listed here with a 🔒 note explaining what's blocking it — so the blocker is visible, not hidden in backlog.

### `backlog/`
Tasks that should happen but have no specific timeline or order. Includes hardening (rate limit, bot protection, structured logging), nice-to-haves, and items waiting for an external dependency (real brand mark).

### `completed/`
Archive of completed tasks. Move files here when done so the active/ list stays focused. Each completed file points to the commit(s) that shipped it.

## File Naming Conventions

- **Active tasks:** `01-description.md`, `02-description.md`
- **Backlog tasks:** `descriptive-name.md`
- **Completed tasks:** Keep original name, optionally add completion date or commit ref in the body

## Task Format

Each task file should include the following, in this order:

- **Summary** — 2–3 sentences describing what and why
- **Action Items** — Specific steps as markdown checkboxes, with short notes (blockers, caveats, decisions deferred)
- **Technical Details** — Relevant file paths, commands, dependencies, env vars

Keep them short. A task file is a checklist, not a spec.

## Usage

1. Open `active/` and pick the lowest-numbered unblocked file.
2. Work through its checkboxes.
3. When done, move the file to `completed/` and update [`../start-here.md`](../start-here.md) roadmap.
4. Review `backlog/` whenever active/ thins out, or during planning.
