import { afterEach, describe, expect, it, vi } from "vitest";
import { FetchError, fetchWithTimeout } from "./http";

const okResponse = () => ({ ok: true, status: 200 }) as unknown as Response;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchWithTimeout", () => {
  it("returns the response when fetch resolves before the timeout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithTimeout("https://x", { method: "GET" }, 1000);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("passes an AbortSignal through to the underlying fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await fetchWithTimeout("https://x", {}, 1000);

    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("clears the timer on success so no abort fires later", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));

    await fetchWithTimeout("https://x", {}, 1000);

    expect(clearSpy).toHaveBeenCalled();
  });

  it("throws FetchError{timedOut:true} when the request exceeds the timeout", async () => {
    vi.useFakeTimers();
    // Never resolves on its own; only rejects (AbortError) when the signal aborts.
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const e = new Error("aborted");
            e.name = "AbortError";
            reject(e);
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const p = fetchWithTimeout("https://x", {}, 5000);
    const expectation = expect(p).rejects.toMatchObject({
      name: "FetchError",
      timedOut: true,
      message: "Request timed out",
    });
    await vi.advanceTimersByTimeAsync(5000);
    await expectation;
  });

  it("throws FetchError{timedOut:false} on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(fetchWithTimeout("https://x", {}, 1000)).rejects.toMatchObject({
      name: "FetchError",
      timedOut: false,
      message: "Request failed",
    });
  });

  it("preserves the underlying error as FetchError.cause", async () => {
    const netErr = new TypeError("boom");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(netErr));

    const err = await fetchWithTimeout("https://x", {}, 1000).catch((e) => e);
    expect(err).toBeInstanceOf(FetchError);
    expect((err as FetchError).cause).toBe(netErr);
  });
});
