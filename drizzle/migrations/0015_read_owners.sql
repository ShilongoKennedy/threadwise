-- A read made while signed in belongs to its reader, so it can be listed again.
alter table public.analyst_reads add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists analyst_reads_owner_idx on public.analyst_reads (user_id, created_at desc);
