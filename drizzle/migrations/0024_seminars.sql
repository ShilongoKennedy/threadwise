-- A seminar is a permanent record of a quote wrestled with: the two
-- steelmanned theories, the crux, the reader's stand, and whether the
-- provisional verdict was opened.
create table if not exists public.analyst_seminars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  quote_text text not null,
  context text,
  question text not null,
  seminar jsonb not null,
  stand text,
  verdict_shown boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'analyst_seminars_stand_check'
  ) then
    alter table public.analyst_seminars
      add constraint analyst_seminars_stand_check
      check (stand in ('A', 'B', 'undecided') or stand is null);
  end if;
end $$;

alter table public.analyst_seminars enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'analyst_seminars'
      and policyname = 'Own seminars'
  ) then
    create policy "Own seminars"
      on public.analyst_seminars
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists analyst_seminars_user_created_idx
  on public.analyst_seminars (user_id, created_at desc);

grant select, insert, update, delete on public.analyst_seminars to authenticated;
