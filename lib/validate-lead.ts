/**
 * Lead capture validation for the "Hear From Us" form on The White Oak.
 *
 * Kept dependency-free and isolated from Next.js so the unit tests are
 * fast and the same function can be reused if we add more capture forms.
 */

export type Lead = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

export type ValidateResult =
  | { ok: true; lead: Lead }
  | { ok: false; error: string };

// Intentionally simple. Real-world deliverability is verified by the email
// provider, not a regex — we just want to reject obviously malformed input.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readString = (record: Record<string, unknown>, key: string): string =>
  typeof record[key] === "string" ? (record[key] as string).trim() : "";

export const validateLead = (body: unknown): ValidateResult => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid payload" };
  }

  const record = body as Record<string, unknown>;
  const firstName = readString(record, "firstName");
  const lastName = readString(record, "lastName");
  const email = readString(record, "email");
  const phone = readString(record, "phone");

  if (!firstName) return { ok: false, error: "First name is required" };
  if (!lastName) return { ok: false, error: "Last name is required" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Valid email is required" };

  return {
    ok: true,
    lead: { firstName, lastName, email, phone: phone || undefined },
  };
};
