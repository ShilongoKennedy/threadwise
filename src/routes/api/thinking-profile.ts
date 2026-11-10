import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "@/lib/threadwise/env.server";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** GET /api/thinking-profile — the signed-in reader's own reasoning record. */
export const Route = createFileRoute("/api/thinking-profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "thinking-profile"), 60, 60 * 60 * 1000).ok) {
          return json({ error: "Too many profile reads for now." }, 429);
        }

        const jwt = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
        if (!jwt || jwt.split(".").length !== 3) {
          return json({ error: "Sign in to see your thinking profile." }, 401);
        }

        const url = serverEnv("SUPABASE_URL");
        const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!url || !key) {
          return json({ error: "The profile is not configured on the server." }, 503);
        }

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const admin = createClient(url, key, { auth: { persistSession: false } });
          const { data: userData, error: userError } = await admin.auth.getUser(jwt);
          const userId = userData?.user?.id;
          if (userError || !userId) {
            return json({ error: "Sign in again to see your profile." }, 401);
          }

          const [reads, questions, findings, watches] = await Promise.all([
            admin
              .from("analyst_reads")
              .select("token, report, created_at")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(100),
            admin
              .from("analyst_questions")
              .select("id, question, status, created_at")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(200),
            admin
              .from("analyst_findings")
              .select("question_id, stance, created_at")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(500),
            admin
              .from("claim_watches")
              .select("status, origin, due_date")
              .eq("user_id", userId)
              .limit(400),
          ]);

          if (reads.error || questions.error || findings.error || watches.error) {
            console.error("[thinking-profile] read failed:", {
              reads: reads.error?.message,
              questions: questions.error?.message,
              findings: findings.error?.message,
              watches: watches.error?.message,
            });
            return json({ error: "The profile could not be read just now." }, 502);
          }

          const { buildThinkingProfile } = await import("@/lib/threadwise/thinking-profile");
          return json(
            {
              ok: true,
              profile: buildThinkingProfile({
                reads: (reads.data ?? []) as never,
                questions: (questions.data ?? []) as never,
                findings: (findings.data ?? []) as never,
                watches: (watches.data ?? []) as never,
              }),
            },
            200,
          );
        } catch (error) {
          console.error("[thinking-profile] failed:", error);
          return json({ error: "The profile could not be read just now." }, 502);
        }
      },
    },
  },
});
