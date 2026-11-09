-- Publishing is an owner action: a read can only be made public by the reader who made it.
alter table public.analyst_reads add column if not exists published_by uuid references auth.users(id) on delete set null;
