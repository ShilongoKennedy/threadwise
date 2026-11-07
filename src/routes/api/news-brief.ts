import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const methodNotAllowed = () => json({ error: "Method not allowed. Use POST." }, 405);

/**
 * Legacy path, kept alive on purpose.
 *
 * The daily scheduled job still points here. It no longer writes a brief — it
 * only scores due watches, which is the part worth keeping. New schedulers
 * should call /api/check-watches.
 */
export const Route = createFileRoute("/api/news-brief")({
  server: {
    handlers: {
      GET: methodNotAllowed,
      PUT: methodNotAllowed,
      PATCH: methodNotAllowed,
      DELETE: methodNotAllowed,
      POST: async ({ request }) => {
        const { runWatchCheck } = await import("@/lib/threadwise/check-watches.server");
        return runWatchCheck(request);
      },
    },
  },
});
