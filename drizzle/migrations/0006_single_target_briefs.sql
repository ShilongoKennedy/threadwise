-- Single-target dossier: one article, four analytical sections.
-- Safe to run whether or not 0005_news_briefs.sql was applied.

create table if not exists public.news_briefs (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  bluf text not null,
  framing text not null,
  omission text not null,
  historical_echo text not null,
  source_url text not null,
  model text,
  created_at timestamptz not null default now()
);

-- Upgrade path for the original three-source design (nullable so old rows survive).
alter table public.news_briefs
  add column if not exists bluf text,
  add column if not exists framing text,
  add column if not exists omission text,
  add column if not exists historical_echo text,
  add column if not exists source_url text;

alter table public.news_briefs
  drop column if exists summary,
  drop column if exists sources,
  drop column if exists analysis,
  drop column if exists tags,
  drop column if exists story_count;

create index if not exists news_briefs_created_at_idx
  on public.news_briefs (created_at desc);

alter table public.news_briefs enable row level security;

-- Signed-in readers may list dossiers. No insert/update/delete policy: the cron
-- writer uses the service role, which bypasses RLS.
drop policy if exists "news briefs are readable by signed-in readers" on public.news_briefs;
create policy "news briefs are readable by signed-in readers"
  on public.news_briefs
  for select
  to authenticated
  using (true);

grant select on public.news_briefs to authenticated;
