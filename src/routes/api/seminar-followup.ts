import { createFileRoute } from "@tanstack/react-router";
import { seminarSchema } from "@/lib/threadwise/seminar";
import { seminarLessonSchema } from "@/lib/threadwise/seminar-lesson";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST /api/seminar-followup — a grounded tutor answer after the deeper lesson. */
export const Route = createFileRoute("/api/seminar-followup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        const gate = rateLimit(clientKey(request, "seminar-followup"), 12, 60 * 60 * 1000);
        if (!gate.ok) {
          return json(
            { error: `That is a lot of follow-ups for now. Try again in ${Math.ceil(gate.retryAfter / 60)} minutes.` },
            429,
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with the seminar, lesson and question." }, 400);
        }

        const raw = body as {
          text?: unknown;
          context?: unknown;
          seminar?: unknown;
          lesson?: unknown;
          question?: unknown;
          history?: unknown;
        };
        const text = typeof raw.text === "string" ? raw.text.trim() : "";
        const context = typeof raw.context === "string" ? raw.context.trim() : "";
        const question = typeof raw.question === "string" ? raw.question.trim() : "";
        if (text.length < 20) return json({ error: "The original seminar text is missing." }, 400);
        if (text.length > 3000) return json({ error: "Keep the quote under 3,000 characters." }, 413);
        if (context.length > 1000) return json({ error: "Keep the context under 1,000 characters." }, 413);
        if (question.length < 5) return json({ error: "Ask a fuller question." }, 400);
        if (question.length > 600) return json({ error: "Keep the follow-up under 600 characters." }, 413);

        const seminar = seminarSchema.safeParse(raw.seminar);
        if (!seminar.success) return json({ error: "The seminar is not valid." }, 400);
        const lesson = seminarLessonSchema.safeParse(raw.lesson);
        if (!lesson.success) return json({ error: "The lesson is not valid." }, 400);

        const history = Array.isArray(raw.history)
          ? (raw.history as unknown[])
              .filter(
                (turn): turn is { role: "user" | "assistant"; content: string } =>
                  Boolean(turn) &&
                  typeof turn === "object" &&
                  ((turn as { role?: unknown }).role === "user" ||
                    (turn as { role?: unknown }).role === "assistant") &&
                  typeof (turn as { content?: unknown }).content === "string",
              )
              .slice(-6)
              .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 1200) }))
          : [];

        try {
          const { askSeminarTutor } = await import("@/lib/threadwise/seminar-followup");
          const answer = await askSeminarTutor(
            text,
            context,
            seminar.data,
            lesson.data,
            question,
            history,
          );
          if (!answer) throw new Error("Empty tutor answer.");
          return json({ ok: true, answer }, 200);
        } catch (error) {
          console.error("[seminar-followup] failed:", error);
          return json({ error: "The tutor could not answer that just now. Try again." }, 502);
        }
      },
    },
  },
});
