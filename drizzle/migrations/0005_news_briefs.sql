-- Daily autonomous briefs, written by POST /api/news-brief via the service role.
-- Apply in the Supabase SQL editor (this file is hand-run, not drizzle-managed).

create table if not exists public.news_briefs (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  summary text not null,
  sources jsonb not null default '[]'::jsonb,
  analysis jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  model text,
  story_count integer,
  created_at timestamptz not null default now()
);

create index if not exists news_briefs_created_at_idx
  on public.news_briefs (created_at desc);

alter table public.news_briefs enable row level security;

-- Signed-in readers may list briefs. There is deliberately no insert/update/delete
-- policy: the cron writer uses the service role, which bypasses RLS.
drop policy if exists "news briefs are readable by signed-in readers" on public.news_briefs;
create policy "news briefs are readable by signed-in readers"
  on public.news_briefs
  for select
  to authenticated
  using (true);

grant select on public.news_briefs to authenticated;
