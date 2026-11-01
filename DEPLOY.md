# Deploying Threadwise

The short version, for the days between sessions.

## 1. Environment

Vercel → Project → Settings → Environment Variables:

| Name | Used by | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | browser | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | anon/publishable key |
| `SUPABASE_URL` | server routes | same project |
| `SUPABASE_SERVICE_ROLE_KEY` | server routes | **never** expose to the browser |
| `DEEPSEEK_API_KEY` | AI routes | primary model |
| `GEMINI_API_KEY` | AI routes | fallback |
| `CRON_SECRET` | `/api/news-brief` | any long random string |

`CRON_SECRET` is required. Without it the brief endpoint returns `503` by design — it is not meant to be callable anonymously.

## 2. Database migrations

Run these in the Supabase SQL editor, in order. They are idempotent.

| File | What it does | Needed for |
|---|---|---|
| `0005_news_briefs.sql` | brief table | archive |
| `0006_single_target_briefs.sql` | single-target columns | dossiers |
| `0007_tactical_dossier.sql` | framing / omission / echo | dossiers |
| `0008_public_briefs.sql` | public read on briefs | signed-out archive + landing CTA |
| `0009_claim_watches.sql` | dated claims, owner-scoped | calendar + the record |

If `0008` is missing, signed-out visitors see an empty state instead of the brief.
If `0009` is missing, the calendar shows no watches and the digest is empty.

## 3. Scheduled brief

The agent runs at `/api/news-brief` (POST only). Schedule it once a day with
`pg_cron` and `pg_net`, or any external scheduler:

```sql
select cron.schedule(
  'threadwise-news-brief',
  '0 5 * * *',
  $$
    select net.http_post(
      url := 'https://<your-domain>/api/news-brief',
      headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET>', 'content-type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
```

Each run also settles any **watches** that have come due, in one batched model
call. A verdict of *inconclusive* records the note and leaves the watch pending,
so it is retried the next day.

## 4. Ship

```bash
npm run build && npx vitest run
git add . && git commit -m "…" && git push origin main
vercel --prod --force
```

Do not amend or force-push history — the project is connected to Lovable and
rewriting shared history breaks its sync.

## 5. Verify after a deploy

- `/` renders with a title and OG tags.
- `/briefs` lists briefs (needs `0008`).
- `/briefing` shows today's dossier.
- `/digest` shows the record (needs `0009`).
- `/app` opens the workspace; the single bar shows breadcrumb, sync dot, account, `···`, layout menu, search and the brief.
- The dock opens Studio, Calendar and the workspace-controls toggle.
- `/digest` shows filed vs settled and a hit rate.
