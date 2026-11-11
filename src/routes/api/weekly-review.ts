import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "@/lib/threadwise/env.server";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** GET /api/weekly-review — a deterministic close of the last seven days. */
export const Route = createFileRoute("/api/weekly-review")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "weekly-review"), 60, 60 * 60 * 1000).ok) {
          return json({ error: "Too many reviews for now." }, 429);
        }

        const jwt = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
        if (!jwt || jwt.split(".").length !== 3) {
          return json({ error: "Sign in to read the week." }, 401);
        }

        const url = serverEnv("SUPABASE_URL");
        const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!url || !key) {
          return json({ error: "The review is not configured on the server." }, 503);
        }

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const admin = createClient(url, key, { auth: { persistSession: false } });
          const { data: userData, error: userError } = await admin.auth.getUser(jwt);
          const userId = userData?.user?.id;
          if (userError || !userId) {
            return json({ error: "Sign in again to read the week." }, 401);
          }

          const from = new Date(Date.now() - 7 * 86_400_000).toISOString();
          const [reads, questions, findings, watches, practice] = await Promise.all([
            admin
              .from("analyst_reads")
              .select("token, input, report, created_at")
              .eq("user_id", userId)
              .gte("created_at", from)
              .order("created_at", { ascending: false })
              .limit(60),
            admin
              .from("analyst_questions")
              .select("id, question, status, created_at")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(100),
            admin
              .from("analyst_findings")
              .select("question_id, stance, created_at")
              .eq("user_id", userId)
              .limit(500),
            admin
              .from("claim_watches")
              .select("claim, status, due_date, checked_at, origin")
              .eq("user_id", userId)
              .limit(200),
            admin
              .from("analyst_practice")
              .select("passed, total, created_at")
              .eq("user_id", userId)
              .gte("created_at", from)
              .limit(200),
          ]);

          if (reads.error || questions.error || findings.error || watches.error) {
            console.error("[weekly-review] read failed:", {
              reads: reads.error?.message,
              questions: questions.error?.message,
              findings: findings.error?.message,
              watches: watches.error?.message,
              practice: practice.error?.message,
            });
            return json({ error: "The week could not be read just now." }, 502);
          }

          const { buildWeeklyReview } = await import("@/lib/threadwise/weekly-review");
          const review = buildWeeklyReview({
            reads: (reads.data ?? []).map((row) => ({
              token: row.token as string,
              input: row.input as string,
              at: row.created_at as string,
              report: row.report as never,
            })),
            questions: (questions.data ?? []) as never,
            findings: (findings.data ?? []) as never,
            watches: (watches.data ?? []) as never,
            practice: (practice.data ?? []) as never,
          });

          return json({ ok: true, review }, 200);
        } catch (error) {
          console.error("[weekly-review] failed:", error);
          return json({ error: "The week could not be read just now." }, 502);
        }
      },
    },
  },
});
