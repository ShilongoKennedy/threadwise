import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const methodNotAllowed = () => json({ error: "Method not allowed. Use POST." }, 405);

export const Route = createFileRoute("/api/check-watches")({
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
