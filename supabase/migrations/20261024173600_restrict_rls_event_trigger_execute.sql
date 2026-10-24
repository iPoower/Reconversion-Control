-- Schema hardening only. Keep Supabase's automatic RLS event trigger intact.
-- Some projects have no such helper; do not install a parallel implementation.
begin;
do $restrict$ declare target regprocedure:=to_regprocedure('public.rls_auto_enable()');
begin
 if target is null then return; end if;
 if not exists(select 1 from pg_proc p where p.oid=target
  and p.prorettype='pg_catalog.event_trigger'::regtype and p.prosecdef
  and pg_get_userbyid(p.proowner)='postgres') then
  raise exception 'Unexpected rls_auto_enable function: inspect before changing privileges';
 end if;
 revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
 if has_function_privilege('anon',target,'EXECUTE') or has_function_privilege('authenticated',target,'EXECUTE') then
  raise exception 'Inherited client EXECUTE remains: review role membership';
 end if;
end $restrict$;
commit;
