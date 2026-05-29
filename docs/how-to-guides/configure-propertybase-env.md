# How to: Configure Propertybase Sandbox vs. Production

Same code targets either Salesforce org. The switch is entirely in env-var values — no code branches. This is the standard nan-crm pattern; see `nan-crm/api/auth/_lib.ts` for the prior art.

## The mapping

| Surface | Vercel Environment | Branch / source | Reads vars from | Targets |
|---|---|---|---|---|
| Local `npm run dev` | — | your laptop | `.env.local` | Sandbox |
| Preview deploy | **Preview** | any branch ≠ `main` + PRs | Vercel "Preview" env | Sandbox |
| `vercel dev` CLI | **Development** | local | Vercel "Development" env | Sandbox |
| Production deploy | **Production** | pushes to `main` | Vercel "Production" env | Production |

Vercel automatically picks the right environment based on what's being deployed. Your code just reads `process.env.PROPERTYBASE_*` via `lib/propertybase-config.ts` — nothing else.

## One-time setup

### 1. Local dev (`.env.local`)

```bash
cp .env.example .env.local
```

Then fill in sandbox values:

```
PROPERTYBASE_INSTANCE_URL=https://my-nanproperties--partialbox.sandbox.my.salesforce.com
PROPERTYBASE_RECORD_TYPE_ID=<sandbox RecordTypeId — look up in sandbox Setup>
```

`.env.local` is gitignored. Never commit it.

### 2. Vercel project (sandbox values for Preview + Development)

Vercel dashboard → **The White Oak project** → **Settings** → **Environment Variables**.

For each variable, add it twice — once with "Preview" + "Development" checked (sandbox value), once with "Production" checked (production value).

| Variable | Preview / Development | Production |
|---|---|---|
| `PROPERTYBASE_INSTANCE_URL` | `https://my-nanproperties--partialbox.sandbox.my.salesforce.com` | `https://my-nanproperties.my.salesforce.com` |
| `PROPERTYBASE_RECORD_TYPE_ID` | sandbox 18-char ID | `0121I000000kzBVQAY` |

When auth lands, you'll also have `PROPERTYBASE_CLIENT_ID` and `PROPERTYBASE_CLIENT_SECRET` — same pattern, different Connected App consumer key per org.

### 3. Redeploy after changing vars

Vercel does NOT auto-redeploy when you change env vars. Trigger a redeploy:

- Push any commit (even a no-op), or
- Vercel dashboard → Deployments → click the latest → ⋯ → Redeploy

## Looking up sandbox values

**Instance URL:** log into the sandbox org; the URL bar after login shows the My Domain. Strip the path, keep the protocol + host.

**RecordTypeId:** Salesforce Setup → Object Manager → `pba__Request__c` → Record Types → click the "White Oak"-relevant record type → the URL contains `RecordType/<ID>/view`. Copy the 18-char ID.

## Why each variable is org-scoped

- **Instance URL** — different domain per org by definition.
- **RecordTypeId** — Salesforce assigns IDs at record creation in each org; sandbox refreshes regenerate them. No way to share IDs across orgs.
- **Connected App credentials** — Connected Apps are org-scoped. Same code, two registrations, two consumer keys.
- **Picklist values** — *not* org-scoped (they're part of the schema and replicate to sandbox). That's why `Contact_Type__c: "Buyer"` lives hardcoded in `INQUIRY_DEFAULTS` and not in env vars.

## Verification

After setup, deploy a preview branch and submit a test inquiry:

```bash
# from a non-main branch
git push
# wait for Vercel preview URL
curl -X POST -H "Content-Type: application/json" \
  -d '{"firstName":"Sandbox","lastName":"Test","email":"st@example.com","signupUrl":"https://preview-url.vercel.app/"}' \
  https://<preview-url>.vercel.app/api/subscribe
```

Then check the Vercel runtime logs. The logged payload should show the sandbox `RecordTypeId`, confirming the env split is working. Repeat with a production deploy to verify production picks up its own values.

## When something doesn't work

- **`PROPERTYBASE_INSTANCE_URL is not set`** in logs → you skipped step 2 for the environment you're deploying to. Vercel keeps env vars scoped per environment; double-check the checkboxes.
- **`PROPERTYBASE_RECORD_TYPE_ID is not set — falling back to the production value`** warning → safe in pre-launch but unsafe once the real PB client lands. The fallback is removed in commit-TBD; until then it just means you haven't set the var yet.
- **Preview deploy hits production PB** → check that `PROPERTYBASE_INSTANCE_URL` for the "Preview" environment is the sandbox URL, not the prod URL.
