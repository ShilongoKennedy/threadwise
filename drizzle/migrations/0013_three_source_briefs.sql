-- A brief now compares accounts of the same event across outlets.
alter table public.news_briefs add column if not exists sources jsonb not null default '[]'::jsonb;
alter table public.news_briefs add column if not exists gap text;
