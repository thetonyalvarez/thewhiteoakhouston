import { describe, expect, it } from "vitest";
import { validateLead } from "./validate-lead";

describe("validateLead", () => {
  it("accepts a valid payload with all fields", () => {
    const result = validateLead({
      firstName: "Nancy",
      lastName: "Almodovar",
      email: "nancy@example.com",
      phone: "7135551234",
    });
    expect(result).toEqual({
      ok: true,
      lead: {
        firstName: "Nancy",
        lastName: "Almodovar",
        email: "nancy@example.com",
        phone: "7135551234",
      },
    });
  });

  it("rejects when firstName is missing or empty", () => {
    expect(validateLead({ lastName: "X", email: "a@b.co" })).toEqual({
      ok: false,
      error: "First name is required",
    });
    expect(
      validateLead({ firstName: "   ", lastName: "X", email: "a@b.co" }),
    ).toEqual({
      ok: false,
      error: "First name is required",
    });
  });

  it("rejects when lastName is missing or empty", () => {
    expect(validateLead({ firstName: "X", email: "a@b.co" })).toEqual({
      ok: false,
      error: "Last name is required",
    });
  });

  it.each([
    ["bad"],
    ["foo@"],
    ["@bar.com"],
    ["foo@bar"],
    ["foo bar@baz.com"],
    [""],
  ])("rejects malformed email %s", (email) => {
    expect(validateLead({ firstName: "X", lastName: "Y", email })).toEqual({
      ok: false,
      error: "Valid email is required",
    });
  });

  it("treats phone as optional and omits it when blank", () => {
    const result = validateLead({
      firstName: "X",
      lastName: "Y",
      email: "a@b.co",
    });
    expect(result).toEqual({
      ok: true,
      lead: { firstName: "X", lastName: "Y", email: "a@b.co", phone: undefined },
    });
  });

  it.each([[null], [undefined], ["string body"], [42], [["array"]]])(
    "rejects non-object body %s",
    (body) => {
      expect(validateLead(body)).toEqual({
        ok: false,
        error: "Invalid payload",
      });
    },
  );

  it("trims whitespace on all fields", () => {
    const result = validateLead({
      firstName: "  Nancy  ",
      lastName: "\tAlmodovar\n",
      email: "  nancy@example.com  ",
      phone: "  7135551234  ",
    });
    expect(result).toEqual({
      ok: true,
      lead: {
        firstName: "Nancy",
        lastName: "Almodovar",
        email: "nancy@example.com",
        phone: "7135551234",
      },
    });
  });

  it("ignores unknown fields so they cannot leak to Propertybase", () => {
    const result = validateLead({
      firstName: "X",
      lastName: "Y",
      email: "a@b.co",
      role: "admin",
      __proto__: { evil: true },
      assignedTo: "attacker@example.com",
    });
    expect(result).toEqual({
      ok: true,
      lead: { firstName: "X", lastName: "Y", email: "a@b.co", phone: undefined },
    });
    if (result.ok) {
      expect(Object.keys(result.lead).sort()).toEqual([
        "email",
        "firstName",
        "lastName",
        "phone",
      ]);
    }
  });
});
