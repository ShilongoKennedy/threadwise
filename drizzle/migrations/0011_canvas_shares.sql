-- A share is a frozen snapshot of one canvas: publishing copies the graph so the
-- link keeps working after the canvas changes or is deleted.
create table if not exists public.canvas_shares (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(9), 'hex'),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists canvas_shares_token_idx on public.canvas_shares (token);
create index if not exists canvas_shares_owner_idx on public.canvas_shares (owner_id);

alter table public.canvas_shares enable row level security;

drop policy if exists "shares are readable by anyone" on public.canvas_shares;
drop policy if exists "shares are published by their owner" on public.canvas_shares;
drop policy if exists "shares are revoked by their owner" on public.canvas_shares;

create policy "shares are readable by anyone"
  on public.canvas_shares for select to anon, authenticated using (true);

create policy "shares are published by their owner"
  on public.canvas_shares for insert to authenticated
  with check (owner_id = auth.uid());

create policy "shares are revoked by their owner"
  on public.canvas_shares for delete to authenticated
  using (owner_id = auth.uid());

grant select on public.canvas_shares to anon;
grant select, insert, delete on public.canvas_shares to authenticated;
