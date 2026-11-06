import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Without these the router falls through to the SPA and answers 200 with HTML. */
const methodNotAllowed = () => json({ error: "Method not allowed. Use POST." }, 405);

/**
 * POST /api/analyst
 *
 * Takes one move and returns a structured political read. Public by design — it
 * is the front door of the product — so it is input-capped and time-boxed rather
 * than authenticated.
 */
export const Route = createFileRoute("/api/analyst")({
  server: {
    handlers: {
      GET: methodNotAllowed,
      PUT: methodNotAllowed,
      PATCH: methodNotAllowed,
      DELETE: methodNotAllowed,
      POST: async ({ request }) => {
        const started = Date.now();
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with a `text` field." }, 400);
        }

        const image = typeof (body as { image?: unknown })?.image === "string" ? (body as { image: string }).image : "";
        if (image) {
          if (image.length > 6_000_000) return json({ error: "That image is too large. Use a screenshot under 4 MB." }, 413);
          try {
            const { transcribeMove } = await import("@/lib/threadwise/analyst");
            const reading = await transcribeMove(image);
            return json({ ok: true, reading, ms: Date.now() - started }, 200);
          } catch (error) {
            console.error("[analyst] transcription failed:", error);
            return json({ error: error instanceof Error ? error.message : "That screenshot could not be read." }, 502);
          }
        }

        const question = typeof (body as { question?: unknown })?.question === "string" ? (body as { question: string }).question.trim() : "";
        if (question) {
          const report = (body as { report?: unknown }).report;
          const history = Array.isArray((body as { history?: unknown }).history)
            ? ((body as { history: { role: "user" | "assistant"; content: string }[] }).history)
            : [];
          if (!report || typeof report !== "object") return json({ error: "Send the read alongside the question." }, 400);
          try {
            const { askAnalyst } = await import("@/lib/threadwise/analyst");
            const answer = await askAnalyst(report as never, question, history);
            return json({ ok: true, answer, ms: Date.now() - started }, 200);
          } catch (error) {
            console.error("[analyst] question failed:", error);
            return json({ error: error instanceof Error ? error.message : "The analyst could not answer." }, 502);
          }
        }

        const text = typeof (body as { text?: unknown })?.text === "string" ? (body as { text: string }).text.trim() : "";
        if (text.length < 20) return json({ error: "Give the analyst at least a sentence to work with." }, 400);
        if (text.length > 4000) return json({ error: "That is longer than one move. Trim it to under 4,000 characters." }, 413);

        try {
          const { analyseMove, saveRead } = await import("@/lib/threadwise/analyst");
          const report = await analyseMove(text);
          const token = await saveRead(text, report);
          return json({ ok: true, report, token, ms: Date.now() - started }, 200);
        } catch (error) {
          console.error("[analyst] failed:", error);
          return json(
            { error: error instanceof Error ? error.message : "The analyst could not finish this read." },
            502,
          );
        }
      },
    },
  },
});
