-- The agent reads a dated claim in the day's article and plants it in the
-- calendar for everyone. A suggestion has no owner until someone keeps it.
alter table public.claim_watches alter column user_id drop not null;
alter table public.claim_watches
  add column if not exists scope text not null default 'personal'
  check (scope in ('personal', 'suggested'));
alter table public.claim_watches add column if not exists origin text;

drop policy if exists "watches are private to their owner" on public.claim_watches;
drop policy if exists "watches are visible to their owner or anyone when suggested" on public.claim_watches;
drop policy if exists "watches are written by their owner" on public.claim_watches;
drop policy if exists "watches are updated by their owner" on public.claim_watches;
drop policy if exists "watches are deleted by their owner" on public.claim_watches;

create policy "watches are visible to their owner or anyone when suggested"
  on public.claim_watches for select to anon, authenticated
  using (scope = 'suggested' or user_id = auth.uid());

create policy "watches are written by their owner"
  on public.claim_watches for insert to authenticated
  with check (user_id = auth.uid());

create policy "watches are updated by their owner"
  on public.claim_watches for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "watches are deleted by their owner"
  on public.claim_watches for delete to authenticated
  using (user_id = auth.uid());

create index if not exists claim_watches_scope_idx on public.claim_watches (scope, due_date);
grant select on public.claim_watches to anon;

-- A suggestion belongs to nobody, so the owner-only policies cannot convert it.
-- This is the one controlled path from "suggested" to "yours".
create or replace function public.claim_suggested_watch(watch_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created uuid;
begin
  if auth.uid() is null then
    raise exception 'sign in to keep a suggestion';
  end if;

  insert into public.claim_watches (user_id, claim, due_date, source_url, scope, origin)
  select auth.uid(), claim, due_date, source_url, 'personal', origin
  from public.claim_watches
  where id = watch_id and scope = 'suggested'
  returning id into created;

  if created is null then
    raise exception 'no such suggestion';
  end if;

  return created;
end;
$$;

revoke all on function public.claim_suggested_watch(uuid) from public;
grant execute on function public.claim_suggested_watch(uuid) to authenticated;
