import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST /api/question-gap — the counter-case for a one-sided or empty question. */
export const Route = createFileRoute("/api/question-gap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "question-gap"), 30, 60 * 60 * 1000).ok) {
          return json({ error: "Too many gap checks for now. Try again later." }, 429);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with `question` and `findings`." }, 400);
        }

        const question =
          typeof (body as { question?: unknown })?.question === "string"
            ? (body as { question: string }).question.trim().slice(0, 500)
            : "";
        if (question.length < 10) {
          return json({ error: "Give the question at least a sentence." }, 400);
        }

        const findings = Array.isArray((body as { findings?: unknown })?.findings)
          ? (body as { findings: { stance?: unknown; note?: unknown }[] }).findings
              .filter(
                (finding) =>
                  finding &&
                  typeof finding.stance === "string" &&
                  typeof finding.note === "string",
              )
              .slice(0, 20)
              .map((finding) => ({
                stance: finding.stance === "against" ? "against" : "for",
                note: finding.note.slice(0, 400),
              }))
          : [];

        try {
          const { questionGap } = await import("@/lib/threadwise/analyst");
          const gap = await questionGap(question, findings);
          if (!gap) return json({ error: "The counter-case could not be found just now." }, 502);
          return json({ ok: true, gap }, 200);
        } catch (error) {
          console.error("[question-gap] failed:", error);
          return json({ error: "The counter-case could not be found just now." }, 502);
        }
      },
    },
  },
});
