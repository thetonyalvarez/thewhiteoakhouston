import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { submitInquiry } from "@/lib/propertybase";
import { emailNewLead, emailLostLead } from "@/lib/lead-email";

// Run `after()` callbacks synchronously so the post-response notification is
// observable in tests; keep the rest of next/server (NextResponse) intact.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (cb: () => unknown) => void cb() };
});
vi.mock("@/lib/propertybase", () => ({
  submitInquiry: vi.fn(),
}));
vi.mock("@/lib/lead-email", () => ({
  emailNewLead: vi.fn(),
  emailLostLead: vi.fn(),
}));

const submitInquiryMock = vi.mocked(submitInquiry);
const emailNewLeadMock = vi.mocked(emailNewLead);
const emailLostLeadMock = vi.mocked(emailLostLead);

const post = (body: unknown): Promise<Response> =>
  POST(
    new Request("http://localhost:3000/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const validLead = {
  firstName: "Nancy",
  lastName: "Almodovar",
  email: "nancy@example.com",
  phone: "7135551234",
  signupUrl: "https://thewhiteoakhouston.com/",
};

beforeEach(() => {
  submitInquiryMock.mockReset();
  emailNewLeadMock.mockReset();
  emailNewLeadMock.mockResolvedValue({ sent: true });
  emailLostLeadMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/subscribe", () => {
  it("submits the inquiry and returns 200 on a valid lead", async () => {
    submitInquiryMock.mockResolvedValue({
      contactId: "003X",
      inquiryId: "a1B000000001",
      contactCreated: true,
    });

    const res = await post(validLead);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(submitInquiryMock).toHaveBeenCalledOnce();
    // The client receives the validated lead + context, not the raw body.
    const [lead, context] = submitInquiryMock.mock.calls[0];
    expect(lead).toMatchObject({ firstName: "Nancy", email: "nancy@example.com" });
    expect(context).toEqual({ signupUrl: "https://thewhiteoakhouston.com/" });
    // Every successful lead notifies the team; the failure fallback does not fire.
    expect(emailNewLeadMock).toHaveBeenCalledOnce();
    const [notifyLead] = emailNewLeadMock.mock.calls[0];
    expect(notifyLead).toMatchObject({ firstName: "Nancy", email: "nancy@example.com" });
    expect(emailLostLeadMock).not.toHaveBeenCalled();
  });

  it("silently drops a submission with a filled honeypot (no PB, no email)", async () => {
    const res = await post({ ...validLead, company: "Acme Spam Co" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(submitInquiryMock).not.toHaveBeenCalled();
    expect(emailNewLeadMock).not.toHaveBeenCalled();
    expect(emailLostLeadMock).not.toHaveBeenCalled();
  });

  it("processes a submission whose honeypot is present but empty", async () => {
    submitInquiryMock.mockResolvedValue({
      contactId: "003X",
      inquiryId: "a1B000000001",
      contactCreated: true,
    });

    const res = await post({ ...validLead, company: "" });

    expect(res.status).toBe(200);
    expect(submitInquiryMock).toHaveBeenCalledOnce();
  });

  it("rejects invalid JSON with 400", async () => {
    const res = await post("{not json");
    expect(res.status).toBe(400);
    expect(submitInquiryMock).not.toHaveBeenCalled();
  });

  it("rejects a lead failing validation with 400 and never calls PB", async () => {
    const res = await post({ ...validLead, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Valid email is required" });
    expect(submitInquiryMock).not.toHaveBeenCalled();
  });

  it("rejects a missing signupUrl with 400", async () => {
    const { firstName, lastName, email, phone } = validLead;
    const res = await post({ firstName, lastName, email, phone });
    expect(res.status).toBe(400);
    expect(submitInquiryMock).not.toHaveBeenCalled();
  });

  it("falls back to email and still returns 200 when Propertybase fails", async () => {
    submitInquiryMock.mockRejectedValue(new Error("Inquiry create failed (500)"));
    emailLostLeadMock.mockResolvedValue({ sent: true });

    const res = await post(validLead);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(emailLostLeadMock).toHaveBeenCalledOnce();
    // Fallback receives the human-readable lead + the failure cause.
    const [lead, , cause] = emailLostLeadMock.mock.calls[0];
    expect(lead).toMatchObject({ firstName: "Nancy", email: "nancy@example.com" });
    expect(cause).toContain("500");
  });

  it("still returns 200 even when the fallback email also fails", async () => {
    submitInquiryMock.mockRejectedValue(new Error("timeout"));
    emailLostLeadMock.mockResolvedValue({ sent: false, error: "Resend responded 422" });

    const res = await post(validLead);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
