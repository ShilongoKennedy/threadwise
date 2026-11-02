import { createFileRoute } from "@tanstack/react-router";

/**
 * Verifies one watch on demand, using the same article the daily agent would.
 * The user's own JWT is used throughout, so row-level security — not this code —
 * decides which watch may be read and written.
 */
export const Route = createFileRoute("/api/check-watch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = Date.now();

        const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
        const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
        const key =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ??
          process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

        if (!url || !key) {
          return Response.json({ message: "Server is not configured." }, { status: 503 });
        }
        if (!token || token.split(".").length !== 3) {
          return Response.json({ message: "Sign in to check a watch." }, { status: 401 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            headers: { Authorization: `Bearer ${token}` },
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const { data: claims, error: authError } = await supabase.auth.getClaims(token);
        const userId = claims?.claims.sub;
        if (authError || !userId) {
          return Response.json({ message: "Sign in again to check a watch." }, { status: 401 });
        }

        let watchId = "";
        try {
          const body = (await request.json()) as { watchId?: string };
          watchId = typeof body.watchId === "string" ? body.watchId : "";
        } catch {
          return Response.json({ message: "Expected a watch id." }, { status: 400 });
        }
        if (!watchId) return Response.json({ message: "Expected a watch id." }, { status: 400 });

        const { data: watch, error: readError } = await supabase
          .from("claim_watches")
          .select("id, claim, scope, status, checked_at")
          .eq("id", watchId)
          .maybeSingle();

        if (readError) {
          return Response.json({ message: "That watch could not be read." }, { status: 400 });
        }
        if (!watch) {
          return Response.json({ message: "No such watch." }, { status: 404 });
        }
        if (watch.scope !== "personal") {
          return Response.json({ message: "Keep this suggestion before checking it." }, { status: 400 });
        }
        if (watch.status !== "pending") {
          return Response.json({ message: "That watch is already settled." }, { status: 409 });
        }
        if (watch.checked_at && Date.now() - new Date(watch.checked_at).getTime() < 3_600_000) {
          return Response.json(
            { message: "Checked within the last hour — try again later." },
            { status: 429 },
          );
        }

        const { fetchTopStories, fetchArticleText, checkClaims } = await import(
          "@/lib/threadwise/news-agent"
        );

        try {
          const [story] = await fetchTopStories(1);
          if (!story) throw new Error("No article available right now.");

          const text = await fetchArticleText(story.url);
          const verdicts = await checkClaims(
            { ...story, text },
            [{ id: watch.id, claim: watch.claim }],
          );
          const verdict = verdicts[0];
          if (!verdict) throw new Error("The check returned no verdict.");

          const { error: writeError } = await supabase
            .from("claim_watches")
            .update({
              ...(verdict.status === "inconclusive" ? {} : { status: verdict.status }),
              resolution: verdict.note,
              checked_at: new Date().toISOString(),
            })
            .eq("id", watch.id);

          if (writeError) throw writeError;

          return Response.json(
            {
              ok: true,
              status: verdict.status,
              note: verdict.note,
              source: story.url,
              ms: Date.now() - startedAt,
            },
            { status: 200 },
          );
        } catch (error) {
          console.error("[check-watch]", error);
          return Response.json(
            {
              message:
                error instanceof Error ? error.message : "The check could not be completed.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
