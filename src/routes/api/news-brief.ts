import { createFileRoute } from "@tanstack/react-router";
import type { StoryText } from "@/lib/threadwise/news-agent";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Without these the router falls through to the SPA and answers 200 with HTML. */
const methodNotAllowed = () => json({ error: "Method not allowed. Use POST." }, 405);

/**
 * POST /api/news-brief
 *
 * Called by a Supabase pg_cron job, not by the browser. The shared secret is the
 * only thing standing between the internet and a paid DeepSeek run, so it fails
 * closed when unset. Service-role credentials are used because cron writes rows
 * that RLS deliberately blocks for ordinary sessions.
 */
export const Route = createFileRoute("/api/news-brief")({
  server: {
    handlers: {
      GET: methodNotAllowed,
      PUT: methodNotAllowed,
      PATCH: methodNotAllowed,
      DELETE: methodNotAllowed,
      POST: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        if (!secret) return json({ error: "CRON_SECRET is not configured on the server." }, 503);

        const presented = request.headers.get("x-cron-secret");
        if (!presented || presented !== secret) return json({ error: "Unauthorized." }, 401);

        const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
        const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!supabaseUrl || !serviceKey)
          return json({ error: "Supabase service credentials are not configured." }, 503);

        const startedAt = Date.now();
        let stage: "collect" | "read" | "generate" | "save" = "collect";

        try {
          const [{ fetchTopStories, fetchArticleText, generateBrief }, { createClient }] =
            await Promise.all([
              import("@/lib/threadwise/news-agent"),
              import("@supabase/supabase-js"),
            ]);

          const stories = await fetchTopStories(3);
          if (!stories.length) return json({ error: "No stories were found in the feeds." }, 502);

          stage = "read";
          const readable = (
            await Promise.all(
              stories.map(async (story) => {
                try {
                  return { ...story, text: await fetchArticleText(story.url) } satisfies StoryText;
                } catch (error) {
                  console.warn(`[news-brief] could not read ${story.url}:`, error);
                  return null;
                }
              }),
            )
          ).filter((story): story is StoryText => story !== null);

          if (!readable.length)
            return json({ error: "No article text could be retrieved." }, 502);

          stage = "generate";
          const brief = await generateBrief(readable);

          stage = "save";
          const supabase = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data, error } = await supabase
            .from("news_briefs")
            .insert({
              headline: brief.headline,
              summary: brief.summary,
              sources: brief.sources,
              analysis: brief.analysis,
              tags: brief.tags,
              model: process.env["DEEPSEEK_MODEL"] ?? "deepseek-chat",
              story_count: readable.length,
            })
            .select("id")
            .single();
          if (error) throw error;

          return json(
            {
              ok: true,
              id: data.id,
              stories: readable.length,
              sources: brief.sources,
              ms: Date.now() - startedAt,
            },
            200,
          );
        } catch (error) {
          // Details go to the server log; the caller only learns which stage broke.
          console.error(`[news-brief] failed during ${stage}:`, error);
          return json({ error: "The brief could not be generated.", stage }, 500);
        }
      },
    },
  },
});
