import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "@/lib/threadwise/env.server";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST /api/ask-record — answer from the signed-in reader's own record. */
export const Route = createFileRoute("/api/ask-record")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
        if (!rateLimit(clientKey(request, "ask-record"), 20, 60 * 60 * 1000).ok) {
          return json({ error: "That is a lot of questions for now. Try again later." }, 429);
        }

        const jwt = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
        if (!jwt || jwt.split(".").length !== 3) {
          return json({ error: "Sign in to ask your record." }, 401);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with a `question` field." }, 400);
        }
        const question = (body as { question?: unknown })?.question;
        if (typeof question !== "string" || question.trim().length < 5) {
          return json({ error: "Ask a real question, not a fragment." }, 400);
        }
        if (question.length > 600) {
          return json({ error: "Keep the question under 600 characters." }, 413);
        }

        const url = serverEnv("SUPABASE_URL");
        const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!url || !key) {
          return json({ error: "The record is not configured on the server." }, 503);
        }

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const admin = createClient(url, key, { auth: { persistSession: false } });
          const { data: userData, error: userError } = await admin.auth.getUser(jwt);
          const userId = userData?.user?.id;
          if (userError || !userId) {
            return json({ error: "Sign in again to ask your record." }, 401);
          }

          const [reads, questions, findings, watches] = await Promise.all([
            admin
              .from("analyst_reads")
              .select("token, input, subject, report, created_at")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(24),
            admin
              .from("analyst_questions")
              .select("id, question, status")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(50),
            admin
              .from("analyst_findings")
              .select("question_id, stance, note")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(200),
            admin
              .from("claim_watches")
              .select("claim, status, due_date, origin")
              .eq("user_id", userId)
              .limit(100),
          ]);

          if (reads.error || questions.error || findings.error || watches.error) {
            console.error("[ask-record] read failed:", {
              reads: reads.error?.message,
              questions: questions.error?.message,
              findings: findings.error?.message,
              watches: watches.error?.message,
            });
            return json({ error: "The record could not be read just now." }, 502);
          }

          const questionRows = (questions.data ?? []) as {
            id: string;
            question: string;
            status: string;
          }[];
          const findingRows = (findings.data ?? []) as {
            question_id: string;
            stance: string;
            note: string;
          }[];
          const recordQuestions = questionRows.map((row) => ({
            question: row.question,
            status: row.status,
            findings: findingRows
              .filter((finding) => finding.question_id === row.id)
              .map((finding) => ({ stance: finding.stance, note: finding.note })),
          }));

          const readRows = (reads.data ?? []) as {
            token: string;
            input: string;
            subject: string | null;
            report: unknown;
            created_at: string;
          }[];
          const recordReads = readRows.map((row) => ({
            token: row.token,
            input: row.input,
            subject: row.subject,
            at: row.created_at,
            report: row.report as never,
          }));

          const { askRecord } = await import("@/lib/threadwise/analyst");
          const answer = await askRecord(
            recordReads,
            recordQuestions,
            (watches.data ?? []) as never,
            question.trim(),
          );

          return json(
            {
              ok: true,
              answer,
              sources: readRows.map((row) => ({
                token: row.token,
                input: row.input.slice(0, 180),
                at: row.created_at,
              })),
            },
            200,
          );
        } catch (error) {
          console.error("[ask-record] failed:", error);
          return json({ error: "The record could not answer that just now." }, 502);
        }
      },
    },
  },
});
