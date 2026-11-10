import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const Route = createFileRoute("/api/analyst-redteam")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        const gate = rateLimit(clientKey(request, "analyst-redteam"), 30, 60 * 60 * 1000);
        if (!gate.ok) return json({ error: "Too many rounds for now. Try again shortly." }, 429);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with `report` and `position`." }, 400);
        }
        const report = (body as { report?: unknown }).report;
        const position = typeof (body as { position?: unknown })?.position === "string" ? (body as { position: string }).position.trim() : "";
        const history = Array.isArray((body as { history?: unknown }).history)
          ? (body as { history: { role: "user" | "assistant"; content: string }[] }).history
          : [];
        if (!report || typeof report !== "object") return json({ error: "Send the read with the position." }, 400);
        if (position.length < 20) return json({ error: "State a position worth arguing with — a sentence or two." }, 400);

        try {
          const { redTeam } = await import("@/lib/threadwise/analyst");
          const result = await redTeam(report as never, position, history);
          return json({ ok: true, ...result }, 200);
        } catch (error) {
          console.error("[red-team] failed:", error);
          return json({ error: "The red team could not be assembled just now. Try again." }, 502);
        }
      },
    },
  },
});
