import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "public, max-age=300" } });

const uncached = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const Route = createFileRoute("/api/read/$token")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        // Token-gated, but a token is not a secret from a scraper: cap lookups.
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "read-token"), 120, 60 * 60 * 1000).ok) {
          return uncached(
            { error: "Too many read lookups from this address. Try again later." },
            429,
          );
        }
        const { loadRead } = await import("@/lib/threadwise/analyst");
        const read = await loadRead(params.token);
        if (!read) return json({ error: "Not found." }, 404);
        return json({ ok: true, ...read, at: read.at ?? null }, 200);
      },
    },
  },
});
