import { afterEach, describe, expect, it, vi } from "vitest";
import { clientKey, pruneBuckets, rateLimit } from "./rate-limit";

afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("allows up to the limit, then refuses with a retry window", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i += 1) {
      expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window", () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 1, 1_000).ok).toBe(true);
    expect(rateLimit(key, 1, 1_000).ok).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(rateLimit(key, 1, 1_000).ok).toBe(true);
  });

  it("keys callers by forwarded address and scope", () => {
    const request = new Request("https://x.test/api", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(clientKey(request, "analyst-read")).toBe("analyst-read:203.0.113.9");
  });

  it("prunes expired buckets", () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;
    rateLimit(key, 1, 1_000);
    vi.advanceTimersByTime(1_001);
    pruneBuckets(0);
    expect(rateLimit(key, 1, 1_000).ok).toBe(true);
  });
});
