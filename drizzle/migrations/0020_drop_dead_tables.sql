-- 0020 — drop the tables no page reads.
--
-- Import check before this migration (grep over src, 2026-11-10):
--   news_briefs     — no .from("news_briefs") anywhere; only the generated types.
--   canvases        — no such table: a canvas is a JSON array inside workspaces.document.
--   workshops       — the app has no workshop UI or .from("workshop_*"); only
--                     workshop-rules.test.ts imports a pure rules module.
-- The live project has news_briefs (11 rows) and six empty workshop_* tables.
-- The briefs are archived before the drop; the workshop tables were empty.

do $$
begin
  if to_regclass('public.news_briefs') is not null then
    execute 'create table if not exists public.news_briefs_archive as table public.news_briefs';
    execute 'drop table public.news_briefs';
  end if;
end $$;

-- Older projects carried these names; current ones do not.
drop table if exists public.canvases;
drop table if exists public.workshops;

-- The workshop feature is not reachable from the app. Drop its RPCs only after
-- the tables, because the policies on those tables depend on workshop_access.
drop table if exists public.workshop_signals;
drop table if exists public.workshop_presence;
drop table if exists public.workshop_votes;
drop table if exists public.workshop_ideas;
drop table if exists public.workshop_members;
drop table if exists public.workshop_sessions cascade;

drop function if exists public.cast_workshop_vote(uuid, text, integer);
drop function if exists public.join_workshop(text, text);
drop function if exists public.workshop_access(uuid) cascade;
