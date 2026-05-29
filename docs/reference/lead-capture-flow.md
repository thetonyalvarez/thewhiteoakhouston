# Lead Capture Flow

End-to-end data path from "user clicks Hear From Us" to "lead lands somewhere queryable."

## Current State (Stub)

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser                                                          │
│                                                                  │
│   user clicks button                                             │
│        │                                                         │
│        ▼                                                         │
│   <HearFromUs /> (client component, app/components/)             │
│        │  opens modal, focuses first field                       │
│        │  user fills First/Last/Email/Phone                      │
│        │  user clicks Submit                                     │
│        │                                                         │
│        ▼                                                         │
│   fetch("/api/subscribe", { method: "POST", body: JSON })        │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Next.js server runtime (Vercel function in production)           │
│                                                                  │
│   POST /api/subscribe → app/api/subscribe/route.ts               │
│        │                                                         │
│        ▼                                                         │
│   try { await req.json() }                                       │
│        │  catch → return 400 "Invalid JSON"                      │
│        ▼                                                         │
│   validateLead(body)   ← lib/validate-lead.ts (pure, tested)     │
│        │  if invalid → return 400 with specific error            │
│        ▼                                                         │
│   console.info("[white-oak] lead captured ...", lead)            │
│        │                                                         │
│        ▼                                                         │
│   return 200 { ok: true }                                        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Vercel runtime logs (production) OR terminal (dev)               │
│                                                                  │
│   [white-oak] lead captured (stub):                              │
│     { firstName: 'X', lastName: 'Y', email: 'x@y.co', phone: ...}│
│                                                                  │
│   ⚠️  No CRM. No email. If logs aren't read, the lead is lost.   │
└─────────────────────────────────────────────────────────────────┘
```

## Target State (Post-Propertybase Wiring)

```
... [same client + Next runtime up through validateLead] ...
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ lib/propertybase.ts                                              │
│                                                                  │
│   POST {PB_API_BASE}/leads with mapped fields                    │
│   timeout: 10s                                                   │
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│   │  2xx        │  │  5xx        │  │  timeout    │              │
│   │  ✓ lead in  │  │  fallback   │  │  fallback   │              │
│   │     PB      │  │     fires   │  │     fires   │              │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│          │                │                │                     │
│          ▼                ▼                ▼                     │
│   log success         log + email      log + email               │
│   return 200          fallback inbox   fallback inbox            │
│                       return 200       return 200                │
└─────────────────────────────────────────────────────────────────┘
```

**Key principle:** the user-facing response is always 200 if the lead was valid. PB failures are an operational concern, not a user-facing one. A "we'll be in touch" message that secretly dropped the lead is the worst outcome.

## Validation Rules

(Implemented in `lib/validate-lead.ts`, tested in `lib/validate-lead.test.ts`.)

- `firstName` — required, trimmed, non-empty
- `lastName` — required, trimmed, non-empty
- `email` — required, trimmed, matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `phone` — optional, trimmed; omitted from the result when empty
- Unknown fields are silently dropped — protects against payload injection where an attacker tries to add `assignedTo` or other PB fields
- `__proto__`, arrays, non-objects, null, and undefined are all rejected with `"Invalid payload"`

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/subscribe` | Lead capture (only endpoint today) |

## Future Endpoints

- `GET /api/health` — readiness probe (if Vercel monitoring ever needs it)
- `POST /api/contact` — separate form if the brand wants a distinct broker/owner contact channel
