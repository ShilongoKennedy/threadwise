-- Every read names the case it belongs to, so reads accumulate instead of scattering.
alter table public.analyst_reads add column if not exists subject text;
create index if not exists analyst_reads_subject_idx on public.analyst_reads (subject, created_at desc);
