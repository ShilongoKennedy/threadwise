import { afterEach, describe, expect, it, vi } from "vitest";
import { handleThreadwise } from "./handler.server";

const request = (url = "http://localhost:3000/api/threadwise") =>
  new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "analyze-source", text: "A short excerpt to analyse." }),
  });

describe("AI route authentication", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects anonymous callers when the local flag is off", async () => {
    vi.stubEnv("ALLOW_LOCAL_AI_UNAUTHENTICATED", "");
    const response = await handleThreadwise(request());
    expect(response.status).toBe(401);
  });

  it("honours the documented local flag on loopback", async () => {
    vi.stubEnv("ALLOW_LOCAL_AI_UNAUTHENTICATED", "true");
    // No provider key: the run must fail as a model error, not as an auth error.
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const response = await handleThreadwise(request());
    expect(response.status).not.toBe(401);
  });

  it("refuses the local flag on a deployed host", async () => {
    vi.stubEnv("ALLOW_LOCAL_AI_UNAUTHENTICATED", "true");
    const response = await handleThreadwise(
      request("https://threadwise-beta.vercel.app/api/threadwise"),
    );
    expect(response.status).toBe(401);
  });

  it("refuses the local flag in a production build", async () => {
    vi.stubEnv("ALLOW_LOCAL_AI_UNAUTHENTICATED", "true");
    vi.stubEnv("VERCEL", "1");
    const response = await handleThreadwise(request());
    expect(response.status).toBe(401);
  });
});

describe("cross-source source cap", () => {
  afterEach(() => vi.unstubAllEnvs());

  const withUrls = (urls: string[]) =>
    new Request("http://localhost:3000/api/threadwise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "cross-source", urls }),
    });

  it("rejects more than five sources before any scrape runs", async () => {
    vi.stubEnv("ALLOW_LOCAL_AI_UNAUTHENTICATED", "true");
    const urls = Array.from({ length: 6 }, (_, i) => `https://example.com/${i}`);
    const response = await handleThreadwise(withUrls(urls));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: expect.stringMatching(/five/i) });
  });

  it("rejects entries that are not complete URLs", async () => {
    vi.stubEnv("ALLOW_LOCAL_AI_UNAUTHENTICATED", "true");
    const response = await handleThreadwise(withUrls(["example.com"]));
    expect(response.status).toBe(400);
  });
});
