import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** GET /api/cases — the public case index, for client-side navigation. */
export const Route = createFileRoute("/api/cases")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "cases"), 120, 60 * 60 * 1000).ok) {
          return json({ error: "Too many case lookups from this address. Try again later." }, 429);
        }

        try {
          const { listCases } = await import("@/lib/threadwise/analyst");
          return json({ ok: true, cases: await listCases() }, 200);
        } catch (error) {
          console.error("[cases] failed:", error);
          return json({ ok: true, cases: [] }, 200);
        }
      },
    },
  },
});
