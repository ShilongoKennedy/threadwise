-- The agent names the place and its coordinates when it writes the brief, so the
-- map never has to guess from prose again.
alter table public.news_briefs add column if not exists place text;
alter table public.news_briefs add column if not exists lat double precision;
alter table public.news_briefs add column if not exists lon double precision;
