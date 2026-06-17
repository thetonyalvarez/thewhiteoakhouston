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

  it.each([
    ["not-a-url"],
    ["www.example.com"],
    ["://broken"],
    // Parseable but non-web schemes must be rejected so they can't be stored
    // on the Inquiry or emailed to staff as a trusted-looking link.
    ["javascript:alert(1)"],
    ["data:text/html,<script>alert(1)</script>"],
    ["file:///etc/passwd"],
  ])("rejects unparseable or non-http(s) URL %s", (signupUrl) => {
    expect(validateInquiryContext({ signupUrl })).toEqual({
      ok: false,
      error: "Signup URL must be a valid URL",
    });
  });

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
