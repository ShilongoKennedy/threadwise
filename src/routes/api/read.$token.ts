import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "public, max-age=300" } });

export const Route = createFileRoute("/api/read/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { loadRead } = await import("@/lib/threadwise/analyst");
        const read = await loadRead(params.token);
        if (!read) return json({ error: "Not found." }, 404);
        return json({ ok: true, ...read }, 200);
      },
    },
  },
});
