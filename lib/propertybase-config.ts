/**
 * Env-var accessors for the Propertybase / Salesforce integration.
 *
 * The single place the integration reads `process.env`. Everything else
 * (token fetch, record create) calls these getters, so a missing var fails
 * with one clear, actionable message instead of an undefined creeping into
 * an HTTP request.
 *
 * Sandbox vs. production is purely which values are loaded into the
 * environment — there is no branching here. See
 * `docs/how-to-guides/configure-propertybase-env.md`.
 *
 * Mirrors the env-helper pattern in `nan-crm/api/auth/_lib.ts`.
 */

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set — see docs/how-to-guides/configure-propertybase-env.md`,
    );
  }
  return value;
};

/**
 * Salesforce My Domain URL for the target org. Trailing slashes are stripped
 * so callers can safely append `/services/...` paths.
 */
export const getInstanceUrl = (): string =>
  required("PROPERTYBASE_INSTANCE_URL").replace(/\/+$/, "");

/** Connected/External Client App Consumer Key. */
export const getClientId = (): string => required("PROPERTYBASE_CLIENT_ID");

/** Connected/External Client App Consumer Secret. */
export const getClientSecret = (): string =>
  required("PROPERTYBASE_CLIENT_SECRET");
