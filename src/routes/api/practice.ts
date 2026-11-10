import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "@/lib/threadwise/env.server";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** GET/POST /api/practice — the signed-in copy of the practice record. */
export const Route = createFileRoute("/api/practice")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ctx = await authenticate(request);
        if ("error" in ctx) return ctx.error;
        const { admin, userId } = ctx;

        const { data, error } = await admin
          .from("analyst_practice")
          .select("read_token, kind, passed, total, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) {
          // The migration may not be applied yet; local practice still works.
          console.warn("[practice] read failed:", error.message);
          return json({ ok: true, attempts: [], pending: true }, 200);
        }

        return json(
          {
            ok: true,
            attempts: (data ?? []).map((row) => ({
              token: row.read_token ?? "",
              kind: row.kind,
              passed: row.passed,
              total: row.total,
              at: row.created_at,
            })),
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
          return json({ error: "Send JSON with the practice attempt." }, 400);
        }

        const record = body as {
          token?: unknown;
          kind?: unknown;
          passed?: unknown;
          total?: unknown;
          at?: unknown;
        };
        const kind =
          record.kind === "falsifier" || record.kind === "steelman" || record.kind === "teach"
            ? record.kind
            : "";
        const passed = typeof record.passed === "number" ? record.passed : -1;
        const total = typeof record.total === "number" ? record.total : -1;
        if (!kind || !Number.isInteger(passed) || !Number.isInteger(total) || total <= 0 || passed < 0 || passed > total) {
          return json({ error: "That practice attempt is not valid." }, 400);
        }

        const at =
          typeof record.at === "string" && !Number.isNaN(new Date(record.at).valueOf())
            ? new Date(record.at).toISOString()
            : new Date().toISOString();
        const token =
          typeof record.token === "string" ? record.token.trim().slice(0, 40) : "";

        const { error } = await admin.from("analyst_practice").insert({
          user_id: userId,
          read_token: token || null,
          kind,
          passed,
          total,
          created_at: at,
        });

        if (error) {
          console.warn("[practice] write failed:", error.message);
          return json({ error: "Practice sync is not available yet." }, 503);
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
  if (!rateLimit(clientKey(request, "practice"), 120, 60 * 60 * 1000).ok) {
    return { error: json({ error: "Too many practice requests for now." }, 429) };
  }

  const jwt = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!jwt || jwt.split(".").length !== 3) {
    return { error: json({ error: "Sign in to sync your practice record." }, 401) };
  }

  const url = serverEnv("SUPABASE_URL");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    return { error: json({ error: "Practice sync is not configured on the server." }, 503) };
  }

  const admin = await createAdmin(url, key);
  const { data, error } = await admin.auth.getUser(jwt);
  const userId = data?.user?.id;
  if (error || !userId) {
    return { error: json({ error: "Sign in again to sync your practice." }, 401) };
  }
  return { admin, userId };
}

async function createAdmin(url: string, key: string) {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}
