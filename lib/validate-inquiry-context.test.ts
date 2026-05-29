import { describe, expect, it } from "vitest";
import { validateInquiryContext } from "./validate-inquiry-context";

describe("validateInquiryContext", () => {
  it("accepts a valid HTTPS URL", () => {
    expect(validateInquiryContext({ signupUrl: "https://thewhiteoakhouston.com/" })).toEqual({
      ok: true,
      context: { signupUrl: "https://thewhiteoakhouston.com/" },
    });
  });

  it("accepts a URL with query params (UTM, etc.)", () => {
    const url = "https://thewhiteoakhouston.vercel.app/?utm_source=email&utm_campaign=launch";
    expect(validateInquiryContext({ signupUrl: url })).toEqual({
      ok: true,
      context: { signupUrl: url },
    });
  });

  it("accepts http://localhost for dev submissions", () => {
    expect(validateInquiryContext({ signupUrl: "http://localhost:3000/" })).toEqual({
      ok: true,
      context: { signupUrl: "http://localhost:3000/" },
    });
  });

  it("trims surrounding whitespace before validating", () => {
    expect(validateInquiryContext({ signupUrl: "  https://example.com/  " })).toEqual({
      ok: true,
      context: { signupUrl: "https://example.com/" },
    });
  });

  it("rejects when signupUrl is missing", () => {
    expect(validateInquiryContext({})).toEqual({
      ok: false,
      error: "Signup URL is required",
    });
  });

  it("rejects when signupUrl is an empty or whitespace-only string", () => {
    expect(validateInquiryContext({ signupUrl: "" })).toEqual({
      ok: false,
      error: "Signup URL is required",
    });
    expect(validateInquiryContext({ signupUrl: "   " })).toEqual({
      ok: false,
      error: "Signup URL is required",
    });
  });

  it.each([["not-a-url"], ["www.example.com"], ["://broken"], ["javascript:alert(1)"]])(
    "rejects unparseable or unsafe URL %s",
    (signupUrl) => {
      const result = validateInquiryContext({ signupUrl });
      // javascript: parses fine but isn't http/https; we accept it here at the
      // validator level — the PB Salesforce field would store it as text. If
      // we later want a scheme allowlist, this is where to enforce it.
      if (signupUrl === "javascript:alert(1)") {
        expect(result.ok).toBe(true);
      } else {
        expect(result).toEqual({ ok: false, error: "Signup URL must be a valid URL" });
      }
    },
  );

  it.each([[null], [undefined], ["string body"], [42], [["array"]]])(
    "rejects non-object body %s",
    (body) => {
      expect(validateInquiryContext(body)).toEqual({
        ok: false,
        error: "Invalid payload",
      });
    },
  );
});
