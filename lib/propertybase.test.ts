import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Re-imported per test (with vi.resetModules) so the module-scoped token
// cache never leaks between cases.
let mod: typeof import("./propertybase");

type FakeResponseInit = {
  ok?: boolean;
  status: number;
  json?: unknown;
  text?: string;
};

const fakeResponse = ({ ok, status, json, text }: FakeResponseInit): Response =>
  ({
    ok: ok ?? (status >= 200 && status < 300),
    status,
    json: async () => json ?? {},
    text: async () => text ?? "",
  }) as unknown as Response;

const tokenOk = () =>
  fakeResponse({
    status: 200,
    json: {
      access_token: "tok-123",
      instance_url: "https://x--partialbox.sandbox.my.salesforce.com",
      token_type: "Bearer",
    },
  });

const queryWith = (ids: string[]) =>
  fakeResponse({
    status: 200,
    json: { totalSize: ids.length, records: ids.map((Id) => ({ Id })) },
  });

const created = (id: string) => fakeResponse({ status: 201, json: { id, success: true } });

const fetchMock = vi.fn();

const lead = {
  firstName: "Nancy",
  lastName: "Almodovar",
  email: "nancy@example.com",
  phone: "7135551234",
};
const context = { signupUrl: "https://thewhiteoakhouston.com/" };

const lastBody = (callIndex: number) =>
  JSON.parse(fetchMock.mock.calls[callIndex][1].body as string);

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("PROPERTYBASE_INSTANCE_URL", "https://x--partialbox.sandbox.my.salesforce.com");
  vi.stubEnv("PROPERTYBASE_CLIENT_ID", "id");
  vi.stubEnv("PROPERTYBASE_CLIENT_SECRET", "secret");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  mod = await import("./propertybase");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("createInquiry", () => {
  it("fetches a token then creates the record, returning the id", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(created("a1B000000001"));

    const result = await mod.createInquiry({ Email__c: "nancy@example.com" });

    expect(result).toEqual({ id: "a1B000000001" });
    expect(fetchMock.mock.calls[0][0]).toContain("/services/oauth2/token");
    expect(fetchMock.mock.calls[1][0]).toContain("/sobjects/pba__Request__c");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer tok-123");
  });

  it("reuses the cached token across calls (no second token fetch)", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk())
      .mockResolvedValueOnce(created("id1"))
      .mockResolvedValueOnce(created("id2"));

    await mod.createInquiry({ Email__c: "a@example.com" });
    await mod.createInquiry({ Email__c: "b@example.com" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes("/oauth2/token"))).toHaveLength(1);
  });

  it("re-auths once and retries when the create returns 401", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk())
      .mockResolvedValueOnce(fakeResponse({ status: 401, text: "expired" }))
      .mockResolvedValueOnce(tokenOk())
      .mockResolvedValueOnce(created("retried"));

    const result = await mod.createInquiry({ Email__c: "n@example.com" });

    expect(result).toEqual({ id: "retried" });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("throws PropertybaseError on a 5xx create", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(fakeResponse({ status: 500, text: "boom" }));

    await expect(mod.createInquiry({ Email__c: "n@example.com" })).rejects.toMatchObject({
      name: "PropertybaseError",
      status: 500,
      detail: "boom",
    });
  });

  it("throws PropertybaseError when the token request fails", async () => {
    fetchMock.mockResolvedValueOnce(fakeResponse({ status: 400, text: "invalid_grant" }));

    await expect(mod.createInquiry({ Email__c: "n@example.com" })).rejects.toMatchObject({
      name: "PropertybaseError",
      status: 400,
    });
  });

  it("throws PropertybaseError when the create response has no id", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(fakeResponse({ status: 201, json: { success: true } }));

    await expect(mod.createInquiry({ Email__c: "n@example.com" })).rejects.toThrowError(/returned no id/);
  });

  it("treats a timeout (AbortError) as a PropertybaseError", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    fetchMock.mockRejectedValueOnce(abort);

    await expect(mod.createInquiry({ Email__c: "n@example.com" })).rejects.toMatchObject({
      name: "PropertybaseError",
      message: "Propertybase request timed out",
    });
  });

  it("PropertybaseError carries status and detail", () => {
    const err = new mod.PropertybaseError("nope", 503, "unavailable");
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(503);
    expect(err.detail).toBe("unavailable");
  });
});

describe("findContactIdByEmail", () => {
  it("returns the matching Contact id", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(queryWith(["003000000000999"]));

    expect(await mod.findContactIdByEmail("nancy@example.com")).toBe("003000000000999");
    expect(fetchMock.mock.calls[1][0]).toContain("/query/?q=");
  });

  it("returns null when no Contact matches", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(queryWith([]));
    expect(await mod.findContactIdByEmail("none@example.com")).toBeNull();
  });

  it("escapes single quotes in the email to prevent SOQL injection", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(queryWith([]));
    await mod.findContactIdByEmail("o'brien@example.com");
    const url = decodeURIComponent(String(fetchMock.mock.calls[1][0]));
    expect(url).toContain("Email = 'o\\'brien@example.com'");
  });

  it("throws PropertybaseError on query failure", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(fakeResponse({ status: 400, text: "MALFORMED_QUERY" }));
    await expect(mod.findContactIdByEmail("x@example.com")).rejects.toMatchObject({
      name: "PropertybaseError",
      status: 400,
    });
  });
});

describe("createContact", () => {
  it("creates a Contact and returns the id", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(created("003000000000abc"));
    const result = await mod.createContact({ LastName: "Almodovar" });
    expect(result).toEqual({ id: "003000000000abc" });
    expect(fetchMock.mock.calls[1][0]).toContain("/sobjects/Contact");
  });
});

describe("submitInquiry", () => {
  it("reuses an existing Contact and creates the linked Inquiry", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk())
      .mockResolvedValueOnce(queryWith(["003EXISTING"]))
      .mockResolvedValueOnce(created("a1BINQUIRY"));

    const result = await mod.submitInquiry(lead, context);

    expect(result).toEqual({
      contactId: "003EXISTING",
      inquiryId: "a1BINQUIRY",
      contactCreated: false,
    });
    // No Contact create — token, query, inquiry only.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // Inquiry links to the existing contact.
    expect(lastBody(2).pba__Contact__c).toBe("003EXISTING");
    expect(lastBody(2).Email__c).toBe("nancy@example.com");
  });

  it("creates a Contact when none exists, then the linked Inquiry", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk())
      .mockResolvedValueOnce(queryWith([]))
      .mockResolvedValueOnce(created("003NEW"))
      .mockResolvedValueOnce(created("a1BNEW"));

    const result = await mod.submitInquiry(lead, context);

    expect(result).toEqual({
      contactId: "003NEW",
      inquiryId: "a1BNEW",
      contactCreated: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    // Contact create carried the standard name fields.
    expect(lastBody(2)).toMatchObject({ FirstName: "Nancy", LastName: "Almodovar" });
    // Inquiry links to the freshly created contact.
    expect(lastBody(3).pba__Contact__c).toBe("003NEW");
  });

  it("propagates a PropertybaseError if Contact create fails", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk())
      .mockResolvedValueOnce(queryWith([]))
      .mockResolvedValueOnce(fakeResponse({ status: 400, text: "REQUIRED_FIELD_MISSING" }));

    await expect(mod.submitInquiry(lead, context)).rejects.toMatchObject({
      name: "PropertybaseError",
      status: 400,
    });
  });
});
