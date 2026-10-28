"use strict";
// Real PostgreSQL engine compiled to WASM; mock auth schema, no Supabase endpoint.
const {PGlite}=require("@electric-sql/pglite"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
const payload={v:1,kdf:"PBKDF2-SHA256",iterations:250000,salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",ciphertext:"AAAAAAAAAAAAAAAAAAAAAA=="};
async function run(){
 const db=new PGlite();let count=0;
 const check=async(name,fn)=>{await fn();count++;console.log("PASS isolated SQL: "+name);};
 async function owner(id,anonymous=false){await db.exec("reset role");await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id,is_anonymous:anonymous})]);await db.exec("set role authenticated");}
 try{
  await db.exec("create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); grant usage on schema public,auth to anon,authenticated; create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$; create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;");
  // Reproduce the hosted auto-RLS helper, including PostgreSQL's PUBLIC EXECUTE default.
  await db.exec("create function public.rls_auto_enable() returns event_trigger language plpgsql security definer set search_path=pg_catalog as $$ declare cmd record; begin for cmd in select * from pg_event_trigger_ddl_commands() where command_tag='CREATE TABLE' and object_type='table' and schema_name='public' loop execute format('alter table %s enable row level security',cmd.object_identity); end loop; end $$; create event trigger ensure_rls on ddl_command_end when tag in ('CREATE TABLE') execute function public.rls_auto_enable();");
  assert.equal((await db.query("select has_function_privilege('anon','public.rls_auto_enable()','EXECUTE') allowed")).rows[0].allowed,true);
  await db.query("insert into auth.users values ($1),($2)",[a,b]);
  await db.exec(fs.readFileSync(path.join(root,"sql/reconversion_progress.sql"),"utf8"));
  const migrations=fs.readdirSync(path.join(root,"supabase/migrations")).filter(n=>n.endsWith("_encrypted_cloud_history.sql"));assert.equal(migrations.length,1);
  await db.exec(fs.readFileSync(path.join(root,"supabase/migrations",migrations[0]),"utf8"));
  const hardening=fs.readFileSync(path.join(root,"supabase/migrations/20261024173600_restrict_rls_event_trigger_execute.sql"),"utf8");
  await db.exec(hardening);await db.exec(hardening); // Restriction is safely repeatable.
  await check("auto-RLS remains active while its privileged helper is inaccessible to clients",async()=>{
   for(const role of ["anon","authenticated"]){
    assert.equal((await db.query("select has_function_privilege($1,'public.rls_auto_enable()','EXECUTE') allowed",[role])).rows[0].allowed,false);
    await db.exec("set role "+role);await assert.rejects(db.query("select public.rls_auto_enable()"),e=>e.code==="42501");await db.exec("reset role");
   }
   await db.exec("begin; create table public.rc_rls_auto_probe(id int);");
   assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.rc_rls_auto_probe'::regclass")).rows[0].relrowsecurity,true);
   await db.exec("rollback");assert.equal((await db.query("select to_regclass('public.rc_rls_auto_probe') n")).rows[0].n,null);
  });
  await check("authenticated owner can create and read encrypted progress",async()=>{await owner(a);await db.query("insert into public.reconversion_progress(user_id,payload) values($1,$2)",[a,payload]);assert.equal((await db.query("select * from public.reconversion_progress")).rows.length,1);});
  await check("malformed encrypted envelopes (including kdf:null) fail closed",async()=>{
   await owner(a);
   const failures=[
    ...["kdf","v","iterations","salt","iv","ciphertext"].map(k=>({...payload,[k]:null})),
    {...payload,kdf:"PBKDF2-SHA1"},
    {...payload,ciphertext:""},
    {...payload,unexpected:true},
   ];
   for(const malformed of failures){
    await assert.rejects(
     db.query("update public.reconversion_progress set revision=2,payload=$1 where user_id=$2",[malformed,a]),
     e=>e.code==="23514",
     "An invalid envelope must never pass the SQL constraint"
    );
   }
   const head=await db.query("select revision,payload from public.reconversion_progress where user_id=$1",[a]);
   assert.equal(head.rows[0].revision,1);
   assert.deepEqual(head.rows[0].payload,payload);
   const history=await db.query("select revision from public.reconversion_progress_history where user_id=$1",[a]);
   assert.deepEqual(history.rows.map(x=>x.revision),[1]);
  });
  await check("second user cannot see or change first user's progress/history",async()=>{
   await owner(b);assert.equal((await db.query("select * from public.reconversion_progress")).rows.length,0);assert.equal((await db.query("select * from public.reconversion_progress_history")).rows.length,0);
   assert.equal((await db.query("update public.reconversion_progress set revision=2 returning *")).rows.length,0);
   await assert.rejects(db.query("insert into public.reconversion_progress(user_id,payload) values($1,$2)",[a,payload]),e=>e.code==="42501");
   await db.query("insert into public.reconversion_progress(user_id,payload) values($1,$2)",[b,payload]);
  });
  await check("anonymous and anonymous-auth sessions have no private access",async()=>{
   await db.exec("reset role; set role anon");await assert.rejects(db.query("select * from public.reconversion_progress"),e=>e.code==="42501");await assert.rejects(db.query("select * from public.reconversion_progress_history"),e=>e.code==="42501");
   await owner(a,true);assert.equal((await db.query("select * from public.reconversion_progress")).rows.length,0);assert.equal((await db.query("select * from public.reconversion_progress_history")).rows.length,0);
   await assert.rejects(db.query("insert into public.reconversion_progress(user_id,payload) values($1,$2)",[a,payload]),e=>e.code==="42501");
  });
  await check("server rejects revision jumps, ownership changes and plaintext payloads",async()=>{
   await owner(a);await assert.rejects(db.query("update public.reconversion_progress set revision=3 where user_id=$1",[a]),e=>e.code==="23514");
   await assert.rejects(db.query("update public.reconversion_progress set user_id=$1,revision=2 where user_id=$2",[b,a]));
   await assert.rejects(db.query("update public.reconversion_progress set revision=2,payload=$1 where user_id=$2",[{progress:{dns:"mastered"}},a]),e=>e.code==="23514");
   assert.equal((await db.query("select revision from public.reconversion_progress")).rows[0].revision,1);
  });
  await check("conditional stale update returns zero rows; history is immutable to clients",async()=>{
   await db.query("update public.reconversion_progress set revision=2 where user_id=$1 and revision=1",[a]);
   assert.equal((await db.query("update public.reconversion_progress set revision=2 where user_id=$1 and revision=1 returning *",[a])).rows.length,0);
   for(const query of ["delete from public.reconversion_progress_history","update public.reconversion_progress_history set revision=99","insert into public.reconversion_progress_history(user_id,revision,payload) select user_id,99,payload from public.reconversion_progress"])
    await assert.rejects(db.query(query),e=>e.code==="42501");
   await assert.rejects(db.query("select rc_backup_private.capture_progress()"),e=>e.code==="42501");
  });
  await check("history keeps exactly 20 coherent versions per user and rolls back failed writes",async()=>{
   for(let n=3;n<=24;n++)await db.query("update public.reconversion_progress set revision=$1 where user_id=$2 and revision=$3",[n,a,n-1]);
   const history=(await db.query("select revision from public.reconversion_progress_history order by revision")).rows.map(x=>x.revision);assert.deepEqual(history,Array.from({length:20},(_,i)=>i+5));
   await assert.rejects(db.query("update public.reconversion_progress set revision=25,payload='{}'::jsonb where user_id=$1",[a]));
   assert.equal((await db.query("select max(revision) n from public.reconversion_progress_history")).rows[0].n,24);
   await owner(b);assert.equal((await db.query("select count(*)::int n from public.reconversion_progress_history")).rows[0].n,1);
  });
  // Daily retention migration (prepared only). Applied AFTER the base checks above.
  const c="33333333-3333-4333-8333-333333333333";
  await db.exec("reset role");await db.query("insert into auth.users values ($1)",[c]);
  const security=async()=>{await db.exec("reset role");return JSON.stringify([
   (await db.query("select tablename,policyname,permissive,roles::text,cmd,qual,with_check from pg_policies where schemaname='public' order by 1,2")).rows,
   (await db.query("select relname,relrowsecurity,relforcerowsecurity from pg_class where relname in ('reconversion_progress','reconversion_progress_history') order by 1")).rows,
   (await db.query("select grantee,table_name,privilege_type from information_schema.role_table_grants where table_schema='public' and table_name like 'reconversion_progress%' order by 1,2,3")).rows,
   (await db.query("select r.rolname,has_function_privilege(r.rolname,'rc_backup_private.capture_progress()','EXECUTE') x from pg_roles r where r.rolname in ('anon','authenticated') order by 1")).rows]);};
  const before=await security();
  const retention=fs.readdirSync(path.join(root,"supabase/migrations")).filter(n=>n.endsWith("_history_daily_retention.sql"));
  for(const name of retention){const sql=fs.readFileSync(path.join(root,"supabase/migrations",name),"utf8");await db.exec(sql);await db.exec(sql);} // idempotent re-run
  await check("retention migration leaves RLS policies, grants and function privileges unchanged",async()=>{assert.equal(await security(),before);});
  await check("25 quick edits keep the last 20 revisions AND the latest revision of each earlier day (30 days)",async()=>{
   await owner(c);await db.query("insert into public.reconversion_progress(user_id,payload) values($1,$2)",[c,payload]);
   for(let n=2;n<=5;n++)await db.query("update public.reconversion_progress set revision=$1 where user_id=$2 and revision=$3",[n,c,n-1]);
   // Test-only clock: age the archived rows as superuser (clients can never write saved_at).
   await db.exec("reset role");
   for(const [rev,days] of [[1,40],[2,3],[3,3],[4,1],[5,0]])await db.query("update public.reconversion_progress_history set saved_at=now()-make_interval(days=>$1) where user_id=$2 and revision=$3",[days,c,rev]);
   await owner(c);
   for(let n=6;n<=30;n++)await db.query("update public.reconversion_progress set revision=$1 where user_id=$2 and revision=$3",[n,c,n-1]);
   await db.exec("reset role");
   const kept=(await db.query("select revision from public.reconversion_progress_history where user_id=$1 order by revision",[c])).rows.map(x=>x.revision);
   assert.deepEqual(kept,[3,4,...Array.from({length:20},(_,i)=>i+11)],"day-3 latest (3) and day-1 latest (4) survive; 40-day-old revision 1 is evicted");
   assert.equal((await db.query("select count(*)::int n from public.reconversion_progress_history where user_id=$1",[b])).rows[0].n,1,"other users untouched");
  });
  await check("after retention migration, clients still cannot delete, update, insert or call the capture function",async()=>{
   await owner(c);
   for(const query of ["delete from public.reconversion_progress_history","update public.reconversion_progress_history set saved_at=now()-interval '1 day'","insert into public.reconversion_progress_history(user_id,revision,payload) select user_id,99,payload from public.reconversion_progress"])
    await assert.rejects(db.query(query),e=>e.code==="42501");
   await assert.rejects(db.query("select rc_backup_private.capture_progress()"),e=>e.code==="42501");
   await owner(a);assert.equal((await db.query("select count(*)::int n from public.reconversion_progress_history where user_id=$1",[c])).rows[0].n,0,"history stays private to its owner");
   await db.exec("reset role");assert(retention.length===1,"exactly one prepared retention migration");
  });
  console.log("Isolated PostgreSQL/RLS: "+count+" groups passed. Mock auth.uid()/JWT only; hosted Supabase integration remains separate.");
 }finally{await db.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
