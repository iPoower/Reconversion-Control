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
  await db.query("insert into auth.users values ($1),($2)",[a,b]);
  await db.exec(fs.readFileSync(path.join(root,"sql/reconversion_progress.sql"),"utf8"));
  const migrations=fs.readdirSync(path.join(root,"supabase/migrations")).filter(n=>n.endsWith("_encrypted_cloud_history.sql"));assert.equal(migrations.length,1);
  await db.exec(fs.readFileSync(path.join(root,"supabase/migrations",migrations[0]),"utf8"));
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
  console.log("Isolated PostgreSQL/RLS: "+count+" groups passed. Mock auth.uid()/JWT only; hosted Supabase integration remains separate.");
 }finally{await db.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
