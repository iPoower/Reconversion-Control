-- PREPARED ONLY. Do NOT apply to a hosted project without explicit GO ADMIN.
-- Execute first in an isolated test database (see tests/cloud-history.cjs).
-- Requires 20261024112625_encrypted_cloud_history.sql. Reads/changes no personal rows itself.
--
-- History retention: keep the last 20 revisions PLUS the latest revision of each of the
-- last 30 UTC calendar days (today included), per user. Previously only the last 20 were
-- kept, so 25 quick edits in one session evicted every earlier day.
--
-- Only the eviction rule of the existing private trigger function changes. Unchanged:
-- table, RLS policies, grants (history stays SELECT-only for authenticated owners), envelope
-- CHECK, revision +1 rule, ownership checks. Idempotent: safe to run more than once.
begin;
do $$ begin
 if to_regclass('public.reconversion_progress_history') is null
  or to_regprocedure('rc_backup_private.capture_progress()') is null
  or not exists(select 1 from pg_trigger where tgname='progress_capture' and tgrelid='public.reconversion_progress'::regclass and not tgisinternal) then
  raise exception 'Base history migration missing: apply 20261024112625_encrypted_cloud_history.sql first';
 end if;
end $$;

create or replace function rc_backup_private.capture_progress() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid()<>new.user_id or coalesce(auth.jwt()->>'is_anonymous','false')<>'false' then
  raise exception 'Authenticated owner required' using errcode='42501';
 end if;
 if tg_op='INSERT' then
  if new.revision<>1 then raise exception 'Initial revision must be 1' using errcode='23514'; end if;
 else
  if new.user_id<>old.user_id or new.revision<>old.revision+1 then
   raise exception 'Revision must advance exactly once' using errcode='23514';
  end if;
  insert into public.reconversion_progress_history(user_id,revision,payload) values(old.user_id,old.revision,old.payload)
   on conflict(user_id,revision) do nothing;
 end if;
 new.updated_at=now();
 insert into public.reconversion_progress_history(user_id,revision,payload) values(new.user_id,new.revision,new.payload);
 delete from public.reconversion_progress_history h
  where h.user_id=new.user_id
   and h.revision not in
    (select keep.revision from public.reconversion_progress_history keep
      where keep.user_id=new.user_id order by keep.revision desc limit 20)
   and h.revision not in
    (select distinct on ((daily.saved_at at time zone 'UTC')::date) daily.revision
      from public.reconversion_progress_history daily
      where daily.user_id=new.user_id
       and (daily.saved_at at time zone 'UTC')::date >= (now() at time zone 'UTC')::date - 29
      order by (daily.saved_at at time zone 'UTC')::date, daily.revision desc);
 return new;
end $$;
-- Re-assert (idempotent): never callable by API roles; only the trigger runs it.
revoke all on function rc_backup_private.capture_progress() from public, anon, authenticated;
commit;
-- Rollback path: re-run the function body from 20261024112625_encrypted_cloud_history.sql
-- (last-20 rule) with CREATE OR REPLACE. Rows already kept stay until the next write evicts them.
