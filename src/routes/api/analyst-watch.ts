import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const methodNotAllowed = () => json({ error: "Method not allowed. Use POST." }, 405);

/** POST /api/analyst-watch — turn a saved read's signals into dated watches. */
export const Route = createFileRoute("/api/analyst-watch")({
  server: {
    handlers: {
      GET: methodNotAllowed,
      PUT: methodNotAllowed,
      PATCH: methodNotAllowed,
      DELETE: methodNotAllowed,
      POST: async ({ request }) => {
        const header = request.headers.get("authorization") ?? "";
        const jwt = header.startsWith("Bearer ") ? header.slice(7) : "";
        if (!jwt) return json({ error: "Sign in to keep these signals." }, 401);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with a `token`." }, 400);
        }
        const token = typeof (body as { token?: unknown })?.token === "string" ? (body as { token: string }).token : "";
        if (!token) return json({ error: "A saved read is required." }, 400);

        try {
          const { watchSignals } = await import("@/lib/threadwise/analyst");
          const result = await watchSignals(token, jwt);
          return json({ ok: true, ...result }, 200);
        } catch (error) {
          console.error("[analyst-watch] failed:", error);
          return json({ error: "Could not keep those signals just now. Try again." }, 400);
        }
      },
    },
  },
});
