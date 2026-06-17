/**
 * Minimal fetch transport with an abort-based timeout.
 *
 * Neutral building block shared by the Propertybase client and the lead-loss
 * fallback so the AbortController / timer / cleanup dance lives in exactly one
 * place. Callers layer their own error shaping on top (PropertybaseError, a
 * `{ sent }` result, etc.).
 */

/** Thrown when a request times out (`timedOut: true`) or the network fails. */
export class FetchError extends Error {
  readonly timedOut: boolean;

  constructor(message: string, timedOut: boolean, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "FetchError";
    this.timedOut = timedOut;
  }
}

/**
 * `fetch` that aborts after `timeoutMs`. Returns the raw `Response` (including
 * non-2xx — `fetch` only rejects on network/abort). Throws `FetchError` on a
 * timeout or network failure.
 */
export const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    throw new FetchError(
      timedOut ? "Request timed out" : "Request failed",
      timedOut,
      err,
    );
  } finally {
    clearTimeout(timer);
  }
};
