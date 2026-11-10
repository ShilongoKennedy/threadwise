import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST /api/publish-read — deliberately put a read on the public index. */
export const Route = createFileRoute("/api/publish-read")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "publish-read"), 30, 60 * 60 * 1000).ok) {
          return json({ error: "Too many publish changes. Try again later." }, 429);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with a `token`." }, 400);
        }
        const token = typeof (body as { token?: unknown })?.token === "string" ? (body as { token: string }).token : "";
        const publish = (body as { publish?: unknown })?.publish === true;
        if (!/^[a-z0-9]{6,20}$/.test(token)) return json({ error: "Unknown read." }, 400);

        const header = request.headers.get("authorization") ?? "";
        const jwt = header.startsWith("Bearer ") ? header.slice(7) : "";
        if (!jwt) return json({ error: "Sign in to publish a read." }, 401);

        const { publishRead } = await import("@/lib/threadwise/analyst");
        const result = await publishRead(token, publish, jwt);
        if (!result.ok) return json({ error: result.error ?? "Could not publish." }, 403);
        return json({ ok: true, published: publish }, 200);
      },
    },
  },
});
