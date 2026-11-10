-- The weekly drill: one row per reader per ISO week.
-- This is the cross-device copy of the pin and the completion; localStorage
-- remains the offline cache. History is simply the completed rows.
create table if not exists public.analyst_drills (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week text not null,
  kind text not null check (kind in ('falsifier', 'steelman', 'teach')),
  read_token text not null,
  title text,
  reason text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

create index if not exists analyst_drills_owner_idx
  on public.analyst_drills (user_id, week desc);

alter table public.analyst_drills enable row level security;

drop policy if exists "drills are private to their owner" on public.analyst_drills;
create policy "drills are private to their owner"
  on public.analyst_drills for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.analyst_drills to authenticated;
