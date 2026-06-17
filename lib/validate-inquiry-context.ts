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
  let parsed: URL;
  try {
    parsed = new URL(signupUrl);
  } catch {
    return { ok: false, error: "Signup URL must be a valid URL" };
  }

  // Scheme allowlist: only http(s). A parseable but non-web URL
  // (javascript:, data:, file:, …) would otherwise be stored on the
  // Salesforce Inquiry and rendered in the notification email to staff — a
  // stored-link injection vector. The form only ever submits the page's own
  // http(s) location, so legitimate input is unaffected.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Signup URL must be a valid URL" };
  }

  return { ok: true, context: { signupUrl } };
};
