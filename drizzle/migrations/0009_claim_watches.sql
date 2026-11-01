-- A watch is a dated claim: "the treaty is expected to be signed on 20 Dec".
-- The calendar shows it; the news agent checks it when the date arrives.
create table if not exists public.claim_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  claim text not null,
  due_date date not null,
  source_url text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'contradicted', 'inconclusive')),
  resolution text,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists claim_watches_due_idx on public.claim_watches (user_id, due_date);
create index if not exists claim_watches_status_idx on public.claim_watches (status, due_date);

alter table public.claim_watches enable row level security;

drop policy if exists "watches are private to their owner" on public.claim_watches;
create policy "watches are private to their owner"
  on public.claim_watches
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.claim_watches to authenticated;
