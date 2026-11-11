-- A finding is evidence for or against a question. Keep the exact claim it
-- rests on, plus the source and confidence from the read, so the question page
-- can show the receipt rather than only a prose note.
alter table public.analyst_findings
  add column if not exists claim text,
  add column if not exists source text,
  add column if not exists confidence text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'analyst_findings_confidence_check'
  ) then
    alter table public.analyst_findings
      add constraint analyst_findings_confidence_check
      check (confidence in ('high', 'medium', 'low') or confidence is null);
  end if;
end $$;
