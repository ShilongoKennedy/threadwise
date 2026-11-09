-- A read can be published deliberately; only published reads appear on the index.
alter table public.analyst_reads add column if not exists is_public boolean not null default false;
create index if not exists analyst_reads_public_idx on public.analyst_reads (is_public, created_at desc);
