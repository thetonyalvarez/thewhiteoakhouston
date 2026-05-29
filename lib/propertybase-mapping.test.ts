import { describe, expect, it } from "vitest";
import {
  FIELD_MAP,
  INQUIRY_DEFAULTS,
  buildInquiryPayload,
} from "./propertybase-mapping";
import type { Lead } from "./validate-lead";
import type { InquiryContext } from "./validate-inquiry-context";
import type { PropertybaseConfig } from "./propertybase-config";

const lead: Lead = {
  firstName: "Nancy",
  lastName: "Almodovar",
  email: "nancy@example.com",
  phone: "7135551234",
};

const context: InquiryContext = {
  signupUrl: "https://thewhiteoakhouston.com/",
};

// Stand-in for whatever sandbox/prod RecordTypeId the real config returns.
// Tests stay independent of env vars by passing the config explicitly.
const config: PropertybaseConfig = {
  recordTypeId: "0121I000000kzBVQAY",
};

describe("buildInquiryPayload", () => {
  it("maps lead fields to their pba__*__c equivalents", () => {
    const payload = buildInquiryPayload(lead, context, config);
    expect(payload).toMatchObject({
      pba__FirstName__c: "Nancy",
      pba__LastName__c: "Almodovar",
      pba__Email__c: "nancy@example.com",
      pba__Phone__c: "7135551234",
    });
  });

  it("maps the dynamic Signup_Site_URL__c from context", () => {
    const payload = buildInquiryPayload(
      lead,
      { signupUrl: "https://thewhiteoakhouston.vercel.app/?utm=email" },
      config,
    );
    expect(payload.Signup_Site_URL__c).toBe("https://thewhiteoakhouston.vercel.app/?utm=email");
  });

  it("always includes INQUIRY_DEFAULTS", () => {
    expect(buildInquiryPayload(lead, context, config)).toMatchObject(INQUIRY_DEFAULTS);
  });

  it("uses RecordTypeId from config (env-scoped, sandbox vs prod)", () => {
    const sandboxConfig: PropertybaseConfig = { recordTypeId: "012SANDBOX00000000" };
    const prodConfig: PropertybaseConfig = { recordTypeId: "012PROD000000000000" };
    expect(buildInquiryPayload(lead, context, sandboxConfig).RecordTypeId).toBe(
      "012SANDBOX00000000",
    );
    expect(buildInquiryPayload(lead, context, prodConfig).RecordTypeId).toBe(
      "012PROD000000000000",
    );
  });

  it("omits pba__Phone__c when phone is absent (undefined)", () => {
    const payload = buildInquiryPayload({ ...lead, phone: undefined }, context, config);
    expect(payload).not.toHaveProperty("pba__Phone__c");
    // Still has the required-by-validator fields and the defaults.
    expect(payload.pba__FirstName__c).toBe("Nancy");
    expect(payload.pba__Status__c).toBe("Assigned");
  });

  it("omits pba__Phone__c when phone is an empty string", () => {
    // Should never reach the mapper in production (validator strips empties),
    // but the mapper itself must defend against it so an upstream regression
    // doesn't send blank picklist values into PB.
    const payload = buildInquiryPayload({ ...lead, phone: "" }, context, config);
    expect(payload).not.toHaveProperty("pba__Phone__c");
  });

  it("does not leak unknown fields from the Lead or Context", () => {
    // A future refactor might let extra fields slip through validation. The
    // mapper must only emit keys it knows about.
    const expandedLead = {
      ...lead,
      assignedTo: "attacker@example.com",
      ownerId: "00500000ABCDEFG",
    } as Lead;
    const expandedContext = {
      ...context,
      ip: "1.2.3.4",
      userAgent: "evil-bot/1.0",
    } as InquiryContext;
    const payload = buildInquiryPayload(expandedLead, expandedContext, config);
    const keys = Object.keys(payload).sort();
    const expectedKeys = [
      "RecordTypeId",
      ...Object.keys(FIELD_MAP),
      ...Object.keys(INQUIRY_DEFAULTS),
    ].sort();
    expect(keys).toEqual(expectedKeys);
  });

  it("returns a fresh object each call (no shared mutation of defaults)", () => {
    const a = buildInquiryPayload(lead, context, config);
    const b = buildInquiryPayload(lead, context, config);
    expect(a).not.toBe(b);
    a.pba__FirstName__c = "Tampered";
    expect(b.pba__FirstName__c).toBe("Nancy");
    // And the source defaults stay untouched.
    expect(INQUIRY_DEFAULTS.pba__Status__c).toBe("Assigned");
  });
});
