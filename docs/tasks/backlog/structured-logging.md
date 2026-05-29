# Structured Logging in /api/subscribe

## Summary
The current handler uses `console.info` with an inline lead object. Vercel captures stdout, so leads are visible — but they're unstructured strings, hard to filter or alert on. Switch to structured JSON logs with a request ID so we can search "show me all PB failures in the last hour" in one query.

## Action Items

- [ ] Add a `lib/log.ts` helper that emits JSON-serialized log lines with: `timestamp`, `level`, `event`, `requestId`, `lead` (when present), `error` (when present)
- [ ] Generate a `requestId` per request (`crypto.randomUUID()`)
- [ ] Replace the inline `console.info` in `app/api/subscribe/route.ts` with structured calls: `log.info('lead.received', {requestId, lead})`, `log.error('propertybase.failed', {requestId, error})`
- [ ] After Propertybase wiring: add `log.info('propertybase.success', {...})` so we can compute success rate from logs alone
- [ ] Add a quick `how-to-guides/query-vercel-logs.md` once we have real production traffic and know the query patterns we actually want

## Technical Details

- Vercel automatically parses JSON log lines and exposes them as queryable fields in the dashboard
- Don't log PII in plain text if logs are shared broadly — but lead email/name in CRM-bound captures is acceptable per Nan's existing practice
- Consider adopting `pino` if the helper grows past ~30 lines

## Why Backlog

Premature optimization until there's production traffic. Lighting up structured logs before the first 100 real submissions is wasted work — we don't yet know what queries we'll actually want to run.
