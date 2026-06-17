import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emailNewLead, emailLostLead } from "./lead-email";

const lead = {
  firstName: "Nancy",
  lastName: "Almodovar",
  email: "nancy@example.com",
  phone: "7135551234",
};
const context = { signupUrl: "https://thewhiteoakhouston.com/" };

const fetchMock = vi.fn();

const resend = (status: number, body = "") =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  }) as unknown as Response;

const bodyOf = (callIndex: number) =>
  JSON.parse(fetchMock.mock.calls[callIndex][1].body as string);

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("LEAD_FALLBACK_TO", "tony@nanproperties.com");
  vi.stubEnv("LEAD_FALLBACK_FROM", "leads@thewhiteoakhouston.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("emailLostLead", () => {
  it("sends via Resend and returns {sent:true} on success", async () => {
    fetchMock.mockResolvedValue(resend(200));

    const result = await emailLostLead(lead, context, "Inquiry create failed (500)");

    expect(result).toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    const body = bodyOf(0);
    expect(body.to).toEqual(["tony@nanproperties.com"]);
    expect(body.from).toBe("leads@thewhiteoakhouston.com");
    expect(body.subject).toContain("Nancy Almodovar");
    expect(body.html).toContain("nancy@example.com");
    expect(body.html).toContain("7135551234");
    expect(body.html).toContain("Inquiry create failed (500)");
  });

  it.each([["RESEND_API_KEY"], ["LEAD_FALLBACK_TO"], ["LEAD_FALLBACK_FROM"]])(
    "returns {sent:false} without calling fetch when %s is unset",
    async (missingVar) => {
      vi.stubEnv(missingVar, "");

      const result = await emailLostLead(lead, context, "x");

      expect(result.sent).toBe(false);
      expect(result.error).toMatch(/not configured/);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("returns {sent:false} with status + detail on a Resend non-2xx", async () => {
    fetchMock.mockResolvedValue(resend(422, "from domain not verified"));

    const result = await emailLostLead(lead, context, "x");

    expect(result.sent).toBe(false);
    expect(result.error).toContain("422");
    expect(result.error).toContain("from domain not verified");
  });

  it("never throws on a network failure", async () => {
    // The inner fetch rejects; fetchWithTimeout re-wraps it as a FetchError.
    fetchMock.mockRejectedValue(new TypeError("network down"));

    const result = await emailLostLead(lead, context, "x");

    expect(result).toEqual({ sent: false, error: "Request failed" });
  });

  it("never throws on a timeout (inner abort)", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    fetchMock.mockRejectedValue(abort);

    const result = await emailLostLead(lead, context, "x");

    expect(result).toEqual({ sent: false, error: "Request timed out" });
  });

  it("HTML-escapes user-supplied fields to prevent injection", async () => {
    fetchMock.mockResolvedValue(resend(200));

    await emailLostLead(
      { ...lead, lastName: '<img src=x onerror=alert(1)>' },
      context,
      "x",
    );

    const html = bodyOf(0).html as string;
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("renders a dash for a missing phone", async () => {
    fetchMock.mockResolvedValue(resend(200));

    await emailLostLead({ ...lead, phone: undefined }, context, "x");

    expect(bodyOf(0).html).toContain("—");
  });

  it("sends to every recipient in a comma-separated LEAD_FALLBACK_TO", async () => {
    vi.stubEnv("LEAD_FALLBACK_TO", "tony@nanproperties.com, mary@nanproperties.com");
    fetchMock.mockResolvedValue(resend(200));

    await emailLostLead(lead, context, "x");

    expect(bodyOf(0).to).toEqual([
      "tony@nanproperties.com",
      "mary@nanproperties.com",
    ]);
  });
});

describe("emailNewLead", () => {
  it("sends a new-lead notification via Resend with the lead details", async () => {
    fetchMock.mockResolvedValue(resend(200));

    const result = await emailNewLead(lead, context);

    expect(result).toEqual({ sent: true });
    const body = bodyOf(0);
    expect(body.to).toEqual(["tony@nanproperties.com"]);
    expect(body.subject).toContain("New White Oak lead");
    expect(body.subject).toContain("Nancy Almodovar");
    expect(body.html).toContain("nancy@example.com");
  });
});
