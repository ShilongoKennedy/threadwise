-- A saved read: the Analyst's output becomes a document you can return to.
create table if not exists public.analyst_reads (
  token text primary key,
  input text not null,
  report jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.analyst_reads enable row level security;

-- Rows are written and read only through server routes with the service role;
-- the token is the capability, so no policies are granted to anon.
