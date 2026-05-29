/**
 * Validates submission metadata — the per-request context fields that the
 * client sends alongside user input. Today that's just the URL the form was
 * filled out on; later this is where honeypot, UTM, IP, and user-agent
 * fields would land.
 *
 * Kept separate from `validate-lead.ts` because Lead = what the user typed;
 * Context = metadata about the submission. The Salesforce mapping in
 * `propertybase-mapping.ts` consumes both.
 */

export type InquiryContext = {
  signupUrl: string;
};

export type ValidateContextResult =
  | { ok: true; context: InquiryContext }
  | { ok: false; error: string };

export const validateInquiryContext = (body: unknown): ValidateContextResult => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid payload" };
  }

  const record = body as Record<string, unknown>;
  const signupUrl = typeof record.signupUrl === "string" ? record.signupUrl.trim() : "";

  if (!signupUrl) return { ok: false, error: "Signup URL is required" };

  // Use the URL constructor as the validator — throws on anything not parseable.
  try {
    new URL(signupUrl);
  } catch {
    return { ok: false, error: "Signup URL must be a valid URL" };
  }

  return { ok: true, context: { signupUrl } };
};
