-- PREPARED ONLY. Execute in an isolated test database first; production needs GO ADMIN.
-- Requires the existing sql/reconversion_progress.sql. No personal rows are read here.
begin;
-- Refuse unexpected permissive policies: PostgreSQL OR-combines permissive policies.
do $$ begin
 if exists(select 1 from pg_policies where schemaname='public' and tablename='reconversion_progress' and policyname not in ('progress_read_self','progress_insert_self','progress_update_self')) then
  raise exception 'Unexpected progress policy: review before migration';
 end if;
end $$;
alter table public.reconversion_progress enable row level security;
revoke all on public.reconversion_progress from public, anon, authenticated;
grant select, insert, update on public.reconversion_progress to authenticated;
drop policy if exists "progress_read_self" on public.reconversion_progress;
drop policy if exists "progress_insert_self" on public.reconversion_progress;
drop policy if exists "progress_update_self" on public.reconversion_progress;
create policy "progress_read_self" on public.reconversion_progress for select to authenticated
 using ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy "progress_insert_self" on public.reconversion_progress for insert to authenticated
 with check ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy "progress_update_self" on public.reconversion_progress for update to authenticated
 using ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false')
 with check ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');

-- New writes must be bounded opaque envelopes; existing rows need explicit validation.
alter table public.reconversion_progress add constraint progress_safe_revision
 check (revision between 1 and 9007199254740990) not valid;
-- SQL CHECK accepts UNKNOWN; require a definite TRUE so JSON null cannot pass.
alter table public.reconversion_progress add constraint progress_encrypted_envelope check ((
 jsonb_typeof(payload)='object'
 and payload ?& array['v','kdf','iterations','salt','iv','ciphertext']
 and (payload - array['v','kdf','iterations','salt','iv','ciphertext'])='{}'::jsonb
 and payload->'v'='1'::jsonb and payload->>'kdf'='PBKDF2-SHA256' and payload->'iterations'='250000'::jsonb
 and jsonb_typeof(payload->'salt')='string' and (payload->>'salt') ~ '^[A-Za-z0-9+/]{22}==$'
 and jsonb_typeof(payload->'iv')='string' and (payload->>'iv') ~ '^[A-Za-z0-9+/]{16}$'
 and jsonb_typeof(payload->'ciphertext')='string' and length(payload->>'ciphertext') between 24 and 2796204
 and (payload->>'ciphertext') ~ '^[A-Za-z0-9+/]+={0,2}$'
 and octet_length(payload::text)<=2800000
) is true) not valid;

create schema if not exists rc_backup_private;
revoke all on schema rc_backup_private from public, anon, authenticated;
create table public.reconversion_progress_history (
 user_id uuid not null references auth.users(id) on delete cascade,
 revision bigint not null,
 payload jsonb not null,
 saved_at timestamptz not null default now(),
 primary key(user_id,revision)
);
alter table public.reconversion_progress_history enable row level security;
revoke all on public.reconversion_progress_history from public, anon, authenticated;
grant select on public.reconversion_progress_history to authenticated;
create policy "history_read_self" on public.reconversion_progress_history for select to authenticated
 using ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');

-- A private, non-callable trigger is the narrowly scoped privileged operation.
-- Users cannot forge/delete history through REST. It cannot write arbitrary tables.
create function rc_backup_private.capture_progress() returns trigger
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
 delete from public.reconversion_progress_history h where h.user_id=new.user_id and h.revision not in
  (select keep.revision from public.reconversion_progress_history keep where keep.user_id=new.user_id order by keep.revision desc limit 20);
 return new;
end $$;
revoke all on function rc_backup_private.capture_progress() from public, anon, authenticated;
create trigger progress_capture before insert or update on public.reconversion_progress
 for each row execute function rc_backup_private.capture_progress();
commit;
-- After inspecting existing envelope compatibility, separately run:
-- ALTER TABLE public.reconversion_progress VALIDATE CONSTRAINT progress_safe_revision;
-- ALTER TABLE public.reconversion_progress VALIDATE CONSTRAINT progress_encrypted_envelope;
-- The archive starts with the current version on its next write, not past history.
