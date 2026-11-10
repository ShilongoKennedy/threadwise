import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "@/lib/threadwise/env.server";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const WEEK = /^\d{4}-W\d{2}$/;
const KIND = new Set(["falsifier", "steelman", "teach"]);

/** GET/POST/PATCH /api/drill — the account copy of the weekly drill. */
export const Route = createFileRoute("/api/drill")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ctx = await authenticate(request);
        if ("error" in ctx) return ctx.error;
        const { admin, userId } = ctx;

        const url = new URL(request.url);
        const requested = url.searchParams.get("week") ?? "";
        const { weekKey } = await import("@/lib/threadwise/practice");
        const week = WEEK.test(requested) ? requested : weekKey();

        const { data, error } = await admin
          .from("analyst_drills")
          .select("week, kind, read_token, title, reason, completed_at")
          .eq("user_id", userId)
          .order("week", { ascending: false })
          .limit(52);

        if (error) {
          console.warn("[drill] read failed:", error.message);
          return json({ ok: true, drill: null, history: [], pending: true }, 200);
        }

        const rows = data ?? [];
        const current = rows.find((row) => row.week === week);
        return json(
          {
            ok: true,
            drill: current
              ? {
                  week: current.week,
                  kind: current.kind,
                  token: current.read_token,
                  title: current.title ?? "",
                  reason: current.reason ?? "",
                  ...(current.completed_at ? { completedAt: current.completed_at } : {}),
                }
              : null,
            history: rows
              .filter((row) => row.completed_at)
              .map((row) => ({
                week: row.week,
                kind: row.kind,
                token: row.read_token,
                completedAt: row.completed_at,
              })),
            pending: false,
          },
          200,
        );
      },

      POST: async ({ request }) => {
        const ctx = await authenticate(request);
        if ("error" in ctx) return ctx.error;
        const { admin, userId } = ctx;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with the drill." }, 400);
        }
        const record = body as {
          week?: unknown;
          kind?: unknown;
          token?: unknown;
          title?: unknown;
          reason?: unknown;
        };
        if (
          typeof record.week !== "string" ||
          !WEEK.test(record.week) ||
          typeof record.kind !== "string" ||
          !KIND.has(record.kind) ||
          typeof record.token !== "string" ||
          !record.token.trim()
        ) {
          return json({ error: "That drill is not valid." }, 400);
        }

        const { error } = await admin.from("analyst_drills").upsert(
          {
            user_id: userId,
            week: record.week,
            kind: record.kind,
            read_token: record.token.trim().slice(0, 40),
            title: typeof record.title === "string" ? record.title.slice(0, 300) : "",
            reason: typeof record.reason === "string" ? record.reason.slice(0, 300) : "",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,week" },
        );

        if (error) {
          console.warn("[drill] write failed:", error.message);
          return json({ error: "Drill sync is not available yet." }, 503);
        }
        return json({ ok: true }, 200);
      },

      PATCH: async ({ request }) => {
        const ctx = await authenticate(request);
        if ("error" in ctx) return ctx.error;
        const { admin, userId } = ctx;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with the week." }, 400);
        }
        const week = (body as { week?: unknown })?.week;
        if (typeof week !== "string" || !WEEK.test(week)) {
          return json({ error: "That week is not valid." }, 400);
        }

        const { data, error } = await admin
          .from("analyst_drills")
          .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("week", week)
          .select("week");

        if (error) {
          console.warn("[drill] complete failed:", error.message);
          return json({ error: "Drill completion could not be saved." }, 503);
        }
        if (!data?.length) {
          return json({ error: "Pin the drill before completing it." }, 404);
        }
        return json({ ok: true }, 200);
      },
    },
  },
});

async function authenticate(
  request: Request,
): Promise<
  | { admin: Awaited<ReturnType<typeof createAdmin>>; userId: string }
  | { error: Response }
> {
  const { clientKey, rateLimit } = await import("@/lib/threadwise/rate-limit");
  if (!rateLimit(clientKey(request, "drill"), 120, 60 * 60 * 1000).ok) {
    return { error: json({ error: "Too many drill requests for now." }, 429) };
  }

  const jwt = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!jwt || jwt.split(".").length !== 3) {
    return { error: json({ error: "Sign in to sync the drill." }, 401) };
  }

  const url = serverEnv("SUPABASE_URL");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    return { error: json({ error: "Drill sync is not configured on the server." }, 503) };
  }

  const admin = await createAdmin(url, key);
  const { data, error } = await admin.auth.getUser(jwt);
  const userId = data?.user?.id;
  if (error || !userId) {
    return { error: json({ error: "Sign in again to sync the drill." }, 401) };
  }
  return { admin, userId };
}

async function createAdmin(url: string, key: string) {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}
