-- The daily brief is a public artifact: it is linked from the landing page and
-- shared as a read-only dossier, so anonymous readers may select it.
drop policy if exists "news briefs are readable by anyone" on public.news_briefs;
create policy "news briefs are readable by anyone"
  on public.news_briefs
  for select
  to anon, authenticated
  using (true);

grant select on public.news_briefs to anon;
