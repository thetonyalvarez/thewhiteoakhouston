import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientId, getClientSecret, getInstanceUrl } from "./propertybase-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("propertybase-config", () => {
  it("returns the instance URL when set", () => {
    vi.stubEnv("PROPERTYBASE_INSTANCE_URL", "https://x--partialbox.sandbox.my.salesforce.com");
    expect(getInstanceUrl()).toBe("https://x--partialbox.sandbox.my.salesforce.com");
  });

  it("strips trailing slashes from the instance URL", () => {
    vi.stubEnv("PROPERTYBASE_INSTANCE_URL", "https://x.my.salesforce.com///");
    expect(getInstanceUrl()).toBe("https://x.my.salesforce.com");
  });

  it("returns client id and secret when set", () => {
    vi.stubEnv("PROPERTYBASE_CLIENT_ID", "consumer-key");
    vi.stubEnv("PROPERTYBASE_CLIENT_SECRET", "consumer-secret");
    expect(getClientId()).toBe("consumer-key");
    expect(getClientSecret()).toBe("consumer-secret");
  });

  it("throws a clear error when a required var is missing", () => {
    vi.stubEnv("PROPERTYBASE_INSTANCE_URL", "");
    expect(() => getInstanceUrl()).toThrowError(/PROPERTYBASE_INSTANCE_URL is not set/);
  });
});
