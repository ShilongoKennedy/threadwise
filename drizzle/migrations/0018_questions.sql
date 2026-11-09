-- Standing questions: the decisions a reader is trying to close. Reads file
-- findings against them, for and against, with the evidence kept.
create table if not exists public.analyst_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question text not null,
  status text not null default 'open' check (status in ('open', 'answered', 'dropped')),
  created_at timestamptz not null default now()
);

create table if not exists public.analyst_findings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id uuid not null references public.analyst_questions(id) on delete cascade,
  read_token text,
  stance text not null check (stance in ('for', 'against')),
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists analyst_questions_owner_idx on public.analyst_questions (user_id, status);
create index if not exists analyst_findings_question_idx on public.analyst_findings (question_id, stance);

alter table public.analyst_questions enable row level security;
alter table public.analyst_findings enable row level security;

drop policy if exists "questions are private to their owner" on public.analyst_questions;
create policy "questions are private to their owner"
  on public.analyst_questions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "findings are private to their owner" on public.analyst_findings;
create policy "findings are private to their owner"
  on public.analyst_findings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.analyst_questions to authenticated;
grant select, insert, update, delete on public.analyst_findings to authenticated;
