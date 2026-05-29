import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Re-import per test so the module-level fallback-warned flag resets.
const loadConfig = async () => {
  vi.resetModules();
  return await import("./propertybase-config");
};

describe("getInstanceUrl", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.PROPERTYBASE_INSTANCE_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns the env value when set", async () => {
    process.env.PROPERTYBASE_INSTANCE_URL = "https://example.my.salesforce.com";
    const { getInstanceUrl } = await loadConfig();
    expect(getInstanceUrl()).toBe("https://example.my.salesforce.com");
  });

  it("throws a descriptive error when unset", async () => {
    const { getInstanceUrl } = await loadConfig();
    expect(() => getInstanceUrl()).toThrow(/PROPERTYBASE_INSTANCE_URL is not set/);
  });
});

describe("getRecordTypeId", () => {
  const originalEnv = { ...process.env };
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    delete process.env.PROPERTYBASE_RECORD_TYPE_ID;
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    warnSpy.mockRestore();
  });

  it("returns the env value when set", async () => {
    process.env.PROPERTYBASE_RECORD_TYPE_ID = "0120000000ABCDEFGH";
    const { getRecordTypeId } = await loadConfig();
    expect(getRecordTypeId()).toBe("0120000000ABCDEFGH");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("falls back to the production value and warns when unset", async () => {
    const { getRecordTypeId } = await loadConfig();
    expect(getRecordTypeId()).toBe("0121I000000kzBVQAY");
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toMatch(/PROPERTYBASE_RECORD_TYPE_ID is not set/);
  });

  it("only warns once per module load even on repeated calls", async () => {
    const { getRecordTypeId } = await loadConfig();
    getRecordTypeId();
    getRecordTypeId();
    getRecordTypeId();
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});

describe("getPropertybaseConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.PROPERTYBASE_RECORD_TYPE_ID;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("bundles every env-derived value into one object", async () => {
    process.env.PROPERTYBASE_RECORD_TYPE_ID = "0120000000ABCDEFGH";
    const { getPropertybaseConfig } = await loadConfig();
    expect(getPropertybaseConfig()).toEqual({
      recordTypeId: "0120000000ABCDEFGH",
    });
  });
});
