import { describe, expect, it } from "vitest";
import {
  FIELD_MAP,
  INQUIRY_DEFAULTS,
  buildInquiryPayload,
} from "./propertybase-mapping";
import type { Lead } from "./validate-lead";

const lead: Lead = {
  firstName: "Nancy",
  lastName: "Almodovar",
  email: "nancy@example.com",
  phone: "7135551234",
};

describe("buildInquiryPayload", () => {
  it("maps all four form fields to their pba__*__c equivalents", () => {
    const payload = buildInquiryPayload(lead);
    expect(payload).toMatchObject({
      pba__FirstName__c: "Nancy",
      pba__LastName__c: "Almodovar",
      pba__Email__c: "nancy@example.com",
      pba__Phone__c: "7135551234",
    });
  });

  it("always includes INQUIRY_DEFAULTS", () => {
    const payload = buildInquiryPayload(lead);
    for (const [key, value] of Object.entries(INQUIRY_DEFAULTS)) {
      expect(payload[key]).toBe(value);
    }
  });

  it("omits pba__Phone__c when phone is absent (undefined)", () => {
    const payload = buildInquiryPayload({ ...lead, phone: undefined });
    expect(payload).not.toHaveProperty("pba__Phone__c");
    // Still has the required-by-validator fields and the defaults.
    expect(payload.pba__FirstName__c).toBe("Nancy");
    expect(payload.pba__Status__c).toBe("New");
  });

  it("omits pba__Phone__c when phone is an empty string", () => {
    // Should never reach the mapper in production (validator strips empties),
    // but the mapper itself must defend against it so an upstream regression
    // doesn't send blank picklist values into PB.
    const payload = buildInquiryPayload({ ...lead, phone: "" });
    expect(payload).not.toHaveProperty("pba__Phone__c");
  });

  it("does not leak unknown fields from the Lead object", () => {
    // A future refactor might let extra fields slip through validation. The
    // mapper must only emit keys it knows about.
    const expandedLead = {
      ...lead,
      assignedTo: "attacker@example.com",
      ownerId: "00500000ABCDEFG",
    } as Lead;
    const payload = buildInquiryPayload(expandedLead);
    const keys = Object.keys(payload).sort();
    const expectedKeys = [
      ...Object.keys(FIELD_MAP),
      ...Object.keys(INQUIRY_DEFAULTS),
    ].sort();
    expect(keys).toEqual(expectedKeys);
  });

  it("returns a fresh object each call (no shared mutation of defaults)", () => {
    const a = buildInquiryPayload(lead);
    const b = buildInquiryPayload(lead);
    expect(a).not.toBe(b);
    a.pba__FirstName__c = "Tampered";
    expect(b.pba__FirstName__c).toBe("Nancy");
    // And the source defaults stay untouched.
    expect(INQUIRY_DEFAULTS.pba__Status__c).toBe("New");
  });
});
