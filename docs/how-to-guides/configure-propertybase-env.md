# How to: Configure Propertybase Sandbox vs. Production

Same code targets either Salesforce org. The switch is entirely in env-var values — no code branches. This is the standard nan-crm pattern; see `nan-crm/api/auth/_lib.ts` for the prior art.

## The mapping

| Surface | Vercel Environment | Branch / source | Reads vars from | Targets |
|---|---|---|---|---|
| Local `npm run dev` | — | your laptop | `.env.local` | Sandbox |
| Preview deploy | **Preview** | any branch ≠ `main` + PRs | Vercel "Preview" env | Sandbox |
| `vercel dev` CLI | **Development** | local | Vercel "Development" env | Sandbox |
| Production deploy | **Production** | pushes to `main` | Vercel "Production" env | Production |

Vercel automatically picks the right environment based on what's being deployed. The HTTP client (once it lands) just reads `process.env.PROPERTYBASE_*` — nothing else.

## What is — and isn't — env-scoped

| Value | Env-scoped? | Why |
|---|---|---|
| Instance URL (`PROPERTYBASE_INSTANCE_URL`) | **Yes** | Sandbox and production have different My Domain hostnames. |
| Connected App `CLIENT_ID` / `CLIENT_SECRET` | **Yes** | Connected Apps are org-scoped; the consumer key from sandbox won't authenticate against prod. |
| `RecordTypeId` | **No** | Replicated between Nan's sandbox and production orgs (confirmed) — stays hardcoded in `lib/propertybase-mapping.ts`. |
| Picklist values (Contact_Type__c, etc.) | **No** | Part of the Salesforce schema, replicates to sandbox automatically. |

If Nan's PB org ever stops sharing record IDs across sandbox refreshes, the env-var pattern below extends straightforwardly to cover `RecordTypeId` too — add a getter to a new `lib/propertybase-config.ts` and pass it through `buildInquiryPayload`.

## One-time setup

### 1. Local dev (`.env.local`)

```bash
cp .env.example .env.local
```

Then fill in the sandbox instance URL (and Connected App creds once auth lands):

```
PROPERTYBASE_INSTANCE_URL=https://my-nanproperties--partialbox.sandbox.my.salesforce.com
```

`.env.local` is gitignored. Never commit it.

### 2. Vercel project (sandbox values for Preview + Development)

Vercel dashboard → **The White Oak project** → **Settings** → **Environment Variables**.

For each variable, add it twice — once with "Preview" + "Development" checked (sandbox value), once with "Production" checked (production value).

| Variable | Preview / Development | Production |
|---|---|---|
| `PROPERTYBASE_INSTANCE_URL` | `https://my-nanproperties--partialbox.sandbox.my.salesforce.com` | `https://my-nanproperties.my.salesforce.com` |

When auth lands, add `PROPERTYBASE_CLIENT_ID` and `PROPERTYBASE_CLIENT_SECRET` (or whichever vars match the chosen auth flow) — same pattern, different Connected App per org.

### 3. Redeploy after changing vars

Vercel does NOT auto-redeploy when you change env vars. Trigger a redeploy:

- Push any commit (even a no-op), or
- Vercel dashboard → Deployments → click the latest → ⋯ → Redeploy

## Looking up sandbox values

**Instance URL:** log into the sandbox org; the URL bar after login shows the My Domain. Strip the path, keep the protocol + host.

**Connected App credentials:** Salesforce Setup → App Manager → find the Connected App for The White Oak site (or create one if needed) → View → Manage Consumer Details. The Consumer Key + Consumer Secret are what go into the env vars.

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

Once the HTTP client lands, check the **sandbox** PB org for the new Inquiry. Repeat with a production deploy to verify production picks up its own values.

## When something doesn't work

- **`PROPERTYBASE_INSTANCE_URL is not set`** in logs → you skipped step 2 for the environment you're deploying to. Vercel keeps env vars scoped per environment; double-check the checkboxes.
- **Preview deploy hits production PB** → check that `PROPERTYBASE_INSTANCE_URL` for the "Preview" environment is the sandbox URL, not the prod URL.
- **Sandbox auth works locally but fails on Vercel** → almost certainly a missing/wrong Connected App credential in the Vercel env. Compare against `.env.local`.
