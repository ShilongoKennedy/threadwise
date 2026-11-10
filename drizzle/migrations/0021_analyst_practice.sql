-- Practice attempts: the structural score of a falsifier, steelman or teach-back.
-- Local storage remains the offline fallback; this table is the cross-device copy.
create table if not exists public.analyst_practice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  read_token text,
  kind text not null check (kind in ('falsifier', 'steelman', 'teach')),
  passed integer not null check (passed >= 0),
  total integer not null check (total > 0),
  created_at timestamptz not null default now(),
  check (passed <= total)
);

create index if not exists analyst_practice_owner_idx
  on public.analyst_practice (user_id, created_at desc);

alter table public.analyst_practice enable row level security;

drop policy if exists "practice is private to its owner" on public.analyst_practice;
create policy "practice is private to its owner"
  on public.analyst_practice for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on public.analyst_practice to authenticated;
