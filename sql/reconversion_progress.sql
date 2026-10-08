-- Execute in YOUR private Supabase project SQL editor.
-- No secret tokens, passwords or sample personal progress in this repository.
create table if not exists public.reconversion_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.reconversion_progress enable row level security;
revoke all on public.reconversion_progress from anon;
revoke all on public.reconversion_progress from authenticated;
grant select, insert, update on public.reconversion_progress to authenticated;
create policy "progress_read_self" on public.reconversion_progress
  for select to authenticated using ((select auth.uid())=user_id);
create policy "progress_insert_self" on public.reconversion_progress
  for insert to authenticated with check ((select auth.uid())=user_id);
create policy "progress_update_self" on public.reconversion_progress
  for update to authenticated using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);
-- Enforce monotonic optimistic revision increment in the database.
-- UPDATE through REST uses user_id + previous revision as filter.
-- For stronger adversarial guarantees, use an RPC with expected revision.
-- This table has NO anonymous read/write policy and NO delete grant.
