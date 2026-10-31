-- Tactical dossier: framing and omission become bullet arrays, plus a threat level.
-- Idempotent whether or not 0005 / 0006 were applied.

create table if not exists public.news_briefs (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  bluf text not null,
  framing text[] not null default '{}',
  omission text[] not null default '{}',
  historical_echo text not null,
  threat_level text not null default 'MODERATE',
  source_url text not null,
  model text,
  created_at timestamptz not null default now()
);

alter table public.news_briefs
  add column if not exists threat_level text not null default 'MODERATE';

-- text -> text[]: existing single paragraphs become one-bullet arrays.
alter table public.news_briefs
  alter column framing type text[] using array[coalesce(framing::text, '')],
  alter column omission type text[] using array[coalesce(omission::text, '')];

alter table public.news_briefs drop constraint if exists news_briefs_threat_level_check;
alter table public.news_briefs
  add constraint news_briefs_threat_level_check
  check (threat_level in ('LOW', 'MODERATE', 'ELEVATED', 'CRITICAL'));

create index if not exists news_briefs_created_at_idx
  on public.news_briefs (created_at desc);

alter table public.news_briefs enable row level security;

drop policy if exists "news briefs are readable by signed-in readers" on public.news_briefs;
create policy "news briefs are readable by signed-in readers"
  on public.news_briefs
  for select
  to authenticated
  using (true);

grant select on public.news_briefs to authenticated;
