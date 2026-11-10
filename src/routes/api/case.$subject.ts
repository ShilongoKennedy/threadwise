import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** GET /api/case/$subject — one case's reads, for client-side navigation. */
export const Route = createFileRoute("/api/case/$subject")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "case-reads"), 120, 60 * 60 * 1000).ok) {
          return json({ error: "Too many case lookups from this address. Try again later." }, 429);
        }

        try {
          const { caseReads } = await import("@/lib/threadwise/analyst");
          return json(
            { ok: true, subject: params.subject, reads: await caseReads(params.subject) },
            200,
          );
        } catch (error) {
          console.error("[case-reads] failed:", error);
          return json({ ok: true, subject: params.subject, reads: [] }, 200);
        }
      },
    },
  },
});
