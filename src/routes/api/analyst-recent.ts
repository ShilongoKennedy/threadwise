import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** GET /api/analyst-recent — the signed-in reader's own last reads. */
export const Route = createFileRoute("/api/analyst-recent")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const header = request.headers.get("authorization") ?? "";
        const jwt = header.startsWith("Bearer ") ? header.slice(7) : "";
        if (!jwt) return json({ error: "Sign in to see your reads." }, 401);

        try {
          const { recentReads } = await import("@/lib/threadwise/analyst");
          return json({ ok: true, reads: await recentReads(jwt) }, 200);
        } catch (error) {
          console.error("[analyst-recent] failed:", error);
          return json({ reads: [] }, 200);
        }
      },
    },
  },
});
