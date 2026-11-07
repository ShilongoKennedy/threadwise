import type {} from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Scores the dated claims whose day has come. No model call at all when nothing
 * is due, so a quiet day costs one COUNT query.
 *
 * Shared by /api/check-watches and the legacy /api/news-brief path, so an
 * existing scheduled job keeps working without being reconfigured.
 */
export async function runWatchCheck(request: Request): Promise<Response> {
const started = Date.now();
const secret = process.env["CRON_SECRET"];
if (!secret) return json({ error: "CRON_SECRET is not configured on the server." }, 503);
if (request.headers.get("x-cron-secret") !== secret) return json({ error: "Unauthorized." }, 401);

const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
if (!supabaseUrl || !serviceKey) return json({ error: "Supabase service credentials are missing." }, 503);

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const today = new Date().toISOString().slice(0, 10);
const { data: due, error: dueError } = await supabase
  .from("claim_watches")
  .select("id, claim")
  .eq("status", "pending")
  .lte("due_date", today)
  .order("due_date", { ascending: true })
  .limit(20);

if (dueError) return json({ error: dueError.message }, 502);
if (!due?.length) return json({ ok: true, watches_due: 0, ms: Date.now() - started }, 200);

try {
  const { fetchEventCluster, fetchArticleText, checkClaims } = await import("@/lib/threadwise/news-agent");
  const [lead] = await fetchEventCluster();
  if (!lead) return json({ ok: true, watches_due: due.length, checked: 0, note: "No article to check against." }, 200);

  let text = "";
  try {
    text = await fetchArticleText(lead.url);
  } catch (error) {
    console.warn("[check-watches] could not read the article:", error);
  }
  if (!text) return json({ ok: true, watches_due: due.length, checked: 0, note: "Article text unavailable." }, 200);

  const verdicts = await checkClaims(
    { ...lead, text },
    due as { id: string; claim: string }[],
  );
  let checked = 0;
  for (const verdict of verdicts) {
    await supabase
      .from("claim_watches")
      .update({
        ...(verdict.status === "inconclusive" ? {} : { status: verdict.status }),
        resolution: verdict.note,
        checked_at: new Date().toISOString(),
      })
      .eq("id", verdict.id);
    if (verdict.status !== "inconclusive") checked += 1;
  }
  return json({ ok: true, watches_due: due.length, checked, ms: Date.now() - started }, 200);
} catch (error) {
  console.error("[check-watches] failed:", error);
  return json({ error: error instanceof Error ? error.message : "Watch check failed." }, 502);
}
}
