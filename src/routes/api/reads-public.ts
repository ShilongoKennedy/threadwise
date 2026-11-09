import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "public, max-age=120" } });

/** GET /api/reads-public — the index shows only deliberately published reads. */
export const Route = createFileRoute("/api/reads-public")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { publicReads } = await import("@/lib/threadwise/analyst");
          return json({ ok: true, reads: await publicReads() }, 200);
        } catch {
          return json({ ok: true, reads: [] }, 200);
        }
      },
    },
  },
});
