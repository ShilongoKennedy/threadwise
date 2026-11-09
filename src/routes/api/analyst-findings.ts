import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST /api/analyst-findings — what this read adds to the reader's open questions. */
export const Route = createFileRoute("/api/analyst-findings")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "analyst-findings"), 40, 60 * 60 * 1000).ok) {
          return json({ error: "Too many requests for now." }, 429);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with `report` and `questions`." }, 400);
        }
        const report = (body as { report?: unknown }).report;
        const questions = Array.isArray((body as { questions?: unknown }).questions)
          ? (body as { questions: { id: string; question: string }[] }).questions.slice(0, 8)
          : [];
        if (!report || typeof report !== "object" || !questions.length) {
          return json({ ok: true, findings: [] }, 200);
        }

        try {
          const { proposeFindings } = await import("@/lib/threadwise/analyst");
          return json({ ok: true, findings: await proposeFindings(report as never, questions) }, 200);
        } catch (error) {
          console.error("[analyst-findings] failed:", error);
          return json({ ok: true, findings: [] }, 200);
        }
      },
    },
  },
});
