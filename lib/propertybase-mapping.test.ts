import { describe, expect, it } from "vitest";
import {
  FIELD_MAP,
  INQUIRY_DEFAULTS,
  buildContactPayload,
  buildInquiryPayload,
} from "./propertybase-mapping";
import type { Lead } from "./validate-lead";
import type { InquiryContext } from "./validate-inquiry-context";

const lead: Lead = {
  firstName: "Nancy",
  lastName: "Almodovar",
  email: "nancy@example.com",
  phone: "7135551234",
};

const context: InquiryContext = {
  signupUrl: "https://thewhiteoakhouston.com/",
};

const CONTACT_ID = "003000000000001";

describe("buildContactPayload", () => {
  it("maps lead fields to standard Contact fields", () => {
    expect(buildContactPayload(lead)).toEqual({
      FirstName: "Nancy",
      LastName: "Almodovar",
      Email: "nancy@example.com",
      Phone: "7135551234",
    });
  });

  it("omits Phone when phone is absent", () => {
    const payload = buildContactPayload({ ...lead, phone: undefined });
    expect(payload).not.toHaveProperty("Phone");
    expect(payload).toMatchObject({ FirstName: "Nancy", LastName: "Almodovar" });
  });

  it("only emits known Contact fields, never pba__*__c name fields", () => {
    // Guards against the historical bug where name/phone were mapped to
    // pba__FirstName__c etc., which do not exist on pba__Request__c.
    const keys = Object.keys(buildContactPayload(lead)).sort();
    expect(keys).toEqual(["Email", "FirstName", "LastName", "Phone"]);
  });
});

describe("buildInquiryPayload", () => {
  it("links the Inquiry to the resolved Contact via pba__Contact__c", () => {
    const payload = buildInquiryPayload(lead, context, CONTACT_ID);
    expect(payload.pba__Contact__c).toBe(CONTACT_ID);
  });

  it("maps email + phone to the Inquiry's own Email__c / Mobile__c", () => {
    const payload = buildInquiryPayload(lead, context, CONTACT_ID);
    expect(payload).toMatchObject({
      Email__c: "nancy@example.com",
      Mobile__c: "7135551234",
    });
  });

  it("maps the dynamic Signup_Site_URL__c from context", () => {
    const payload = buildInquiryPayload(
      lead,
      { signupUrl: "https://thewhiteoakhouston.vercel.app/?utm=email" },
      CONTACT_ID,
    );
    expect(payload.Signup_Site_URL__c).toBe(
      "https://thewhiteoakhouston.vercel.app/?utm=email",
    );
  });

  it("always includes INQUIRY_DEFAULTS", () => {
    expect(buildInquiryPayload(lead, context, CONTACT_ID)).toMatchObject(
      INQUIRY_DEFAULTS,
    );
  });

  it("sets a non-empty Sales Rotation (its absence silently drops the inquiry)", () => {
    // The PB allocation flow rolls back the insert when pbasr__Rotation_Name__c
    // is missing/invalid, so this field is load-bearing for persistence.
    const payload = buildInquiryPayload(lead, context, CONTACT_ID);
    expect(payload.pbasr__Rotation_Name__c).toBeTruthy();
  });

  it("does not emit any field that fails to exist on pba__Request__c", () => {
    const payload = buildInquiryPayload(lead, context, CONTACT_ID);
    for (const dead of [
      "pba__FirstName__c",
      "pba__LastName__c",
      "pba__Email__c",
      "pba__Phone__c",
      "Inquiry_Type__c",
    ]) {
      expect(payload).not.toHaveProperty(dead);
    }
  });

  it("omits Mobile__c when phone is absent (undefined)", () => {
    const payload = buildInquiryPayload(
      { ...lead, phone: undefined },
      context,
      CONTACT_ID,
    );
    expect(payload).not.toHaveProperty("Mobile__c");
    expect(payload.Email__c).toBe("nancy@example.com");
    expect(payload.pba__Status__c).toBe("Assigned");
  });

  it("omits Mobile__c when phone is an empty string", () => {
    const payload = buildInquiryPayload({ ...lead, phone: "" }, context, CONTACT_ID);
    expect(payload).not.toHaveProperty("Mobile__c");
  });

  it("does not leak unknown fields from the Lead or Context", () => {
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
    const payload = buildInquiryPayload(expandedLead, expandedContext, CONTACT_ID);
    const keys = Object.keys(payload).sort();
    const expectedKeys = [
      "pba__Contact__c",
      ...Object.keys(FIELD_MAP),
      ...Object.keys(INQUIRY_DEFAULTS),
    ].sort();
    expect(keys).toEqual(expectedKeys);
  });

  it("returns a fresh object each call (no shared mutation of defaults)", () => {
    const a = buildInquiryPayload(lead, context, CONTACT_ID);
    const b = buildInquiryPayload(lead, context, CONTACT_ID);
    expect(a).not.toBe(b);
    a.pba__Status__c = "Tampered";
    expect(b.pba__Status__c).toBe("Assigned");
    expect(INQUIRY_DEFAULTS.pba__Status__c).toBe("Assigned");
  });
});
