/**
 * Propertybase / Salesforce runtime configuration.
 *
 * Mirrors the pattern in `nan-crm/api/auth/_lib.ts`: no code branching on
 * environment, no NODE_ENV checks. Just env-var reads with validation.
 * Which Salesforce org gets called is decided entirely by which values
 * Vercel injects per environment:
 *
 *   Vercel Production  (deploys from `main`)  → production PB instance
 *   Vercel Preview     (PRs + non-main pushes) → sandbox PB instance
 *   Vercel Development (`vercel dev` CLI)      → sandbox PB instance
 *   Local `npm run dev`                        → reads .env.local (sandbox)
 *
 * See `docs/how-to-guides/configure-propertybase-env.md` for the
 * Vercel-dashboard setup. See `.env.example` for the variable shape.
 */

/**
 * Hardcoded fallback for the production PB org's RecordTypeId. Used ONLY
 * when PROPERTYBASE_RECORD_TYPE_ID is unset — typical during local dev
 * before env vars are configured. Logged once on fallback so it's visible.
 * Remove this fallback once the env-var is set in every environment.
 */
const PROD_RECORD_TYPE_ID_FALLBACK = "0121I000000kzBVQAY";

let warnedAboutRecordTypeFallback = false;

/**
 * Salesforce instance base URL — the My Domain of the target org.
 * Example: `https://my-nanproperties--partialbox.sandbox.my.salesforce.com`
 *
 * Required. Throws if unset because the route can't POST anywhere meaningful
 * without it. Today only the (eventual) HTTP client calls this; the stub
 * route doesn't, so missing config doesn't break local dev.
 */
export const getInstanceUrl = (): string => {
  const value = process.env.PROPERTYBASE_INSTANCE_URL;
  if (!value) {
    throw new Error(
      "PROPERTYBASE_INSTANCE_URL is not set. See .env.example for the shape and " +
        "docs/how-to-guides/configure-propertybase-env.md for Vercel setup.",
    );
  }
  return value;
};

/**
 * Salesforce RecordTypeId for the Inquiry record type used by The White Oak.
 * Org-scoped — the same 18-char ID does NOT exist across sandbox and prod.
 *
 * Falls back to the production value with a warning when unset. This keeps
 * the stub route (which logs the would-be payload) functional during local
 * dev before env vars are wired in. When the real HTTP client lands, change
 * this to throw on missing — silent fallback to a wrong-env ID would create
 * confusing PB errors.
 */
export const getRecordTypeId = (): string => {
  const value = process.env.PROPERTYBASE_RECORD_TYPE_ID;
  if (value) return value;

  if (!warnedAboutRecordTypeFallback) {
    warnedAboutRecordTypeFallback = true;
    console.warn(
      "[white-oak] PROPERTYBASE_RECORD_TYPE_ID is not set — falling back to the " +
        `production value (${PROD_RECORD_TYPE_ID_FALLBACK}). Set this per environment ` +
        "in Vercel and .env.local for sandbox parity.",
    );
  }
  return PROD_RECORD_TYPE_ID_FALLBACK;
};

export type PropertybaseConfig = {
  recordTypeId: string;
  // Future, once auth flow is decided:
  //   instanceUrl  — call getInstanceUrl() at HTTP-client construction time
  //   clientId     — Connected App consumer key (separate per org)
  //   clientSecret — Connected App secret (separate per org)
  //   accessToken  — for OAuth Client Credentials Flow token cache
};

/**
 * Bundle every env-derived value into one object so the route handler does
 * a single config read and downstream callers (mapping, HTTP client) take
 * a typed object instead of poking env vars themselves.
 */
export const getPropertybaseConfig = (): PropertybaseConfig => ({
  recordTypeId: getRecordTypeId(),
});
