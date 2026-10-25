"use strict";
// Offline measurements only. No Supabase URL, key, account or personal fixture.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const z=require("node:zlib"),{webcrypto}=require("node:crypto"),{PGlite}=require("@electric-sql/pglite");
const root=path.resolve(__dirname,".."),read=n=>fs.readFileSync(path.join(root,n),"utf8");
const UID="11111111-1111-4111-8111-111111111111",PHRASE="FICTIVE-storage-benchmark-only-2026",MAX=2097136;
const clone=x=>JSON.parse(JSON.stringify(x)),bytes=x=>Buffer.byteLength(x),sandbox={URL,TextEncoder,TextDecoder,crypto:webcrypto,btoa:s=>Buffer.from(s,"binary").toString("base64"),atob:s=>Buffer.from(s,"base64").toString("binary")};
vm.createContext(sandbox);
for(const name of ["data.js","course-foundations.js","course-race.js","course-operations.js","learning.js","english.js","drive-learning.js","deep-dives.js","evidence-checks.js","daily-five.js","cloud-transport.js","project-plan.js"])vm.runInContext(read(name),sandbox,{filename:name});
const app=read("app.js");
function sourceFunction(name){
 const start=app.indexOf("function "+name+"(");assert(start>=0,name);
 const next=app.indexOf("\nfunction ",start+10);assert(next>start,name);
 return app.slice(start,next);
}
const proofStart=app.indexOf("var RC_PORTFOLIO_PROOFS="),proofEnd=app.indexOf("\nvar RC_CAREER_STAGES=",proofStart);
assert(proofStart>=0&&proofEnd>proofStart);
vm.runInContext(app.slice(proofStart,proofEnd),sandbox);
vm.runInContext("var topic=id=>RC_TOPICS.find(t=>t.id===id),statuses=['learn','progress','mastered'],reviewRatings=['again','hard','good','easy'],dailyReasons=['Révision due','Erreur récente','Domaine faible','Rotation'];",sandbox);
for(const name of ["plainObject","validDate","progression","labStateSanitize","proofStateSanitize","dailyById","legacyDailySession","dailySanitize","labChecksSanitize","assertSnapshotFields","cloudValidate"])vm.runInContext(sourceFunction(name),sandbox);
vm.runInContext("globalThis.B={T:RC_CLOUD_TRANSPORT,P:RC_PROJECT_PLAN,topics:RC_TOPICS,labs:RC_LABS,daily:RC_DAILY_FIVE,proofs:RC_PORTFOLIO_PROOFS,validate:cloudValidate};",sandbox);
const {T,P}=sandbox.B,catalog=clone({topics:sandbox.B.topics,labs:sandbox.B.labs,daily:sandbox.B.daily,proofs:sandbox.B.proofs});
function fixture(days){
 const p={version:2,progress:{},review:{},labs:{},proofs:{},labChecks:{},dailyFive:{days:{}},career:clone(P.empty())};
 if(days){
  for(const t of catalog.topics){p.progress[t.id]="mastered";p.review[t.id]={step:2,due:"2026-10-25",lapses:1,lastRating:"good"};}
  for(const lab of catalog.labs)p.labs[lab.id]="progress";
  for(const proof of catalog.proofs)p.proofs[proof.lesson]={status:"progress",evidence:"Preuve entièrement fictive pour mesure isolée, sans donnée personnelle."};
  p.labChecks["lab-02"]={sha256:"a".repeat(64),at:"2026-10-24T06:00:00Z"};
  p.career.profile={diploma:"Bac fictif",history:"Dossier synthétique de mesure uniquement."};p.career.schools.jedha.costs={tuition:12000};
 }
 for(let i=0;i<days;i++){
  const d=new Date(Date.UTC(2026,9,24)-(days-1-i)*86400000).toISOString().slice(0,10),s=catalog.daily[i%catalog.daily.length];
  p.dailyFive.days[d]={sessionId:s.id,reason:"Rotation",quizChoice:s.quiz.answer,quizCorrect:true,missionDone:true,englishChoice:s.english.answer,englishCorrect:true,completed:true,xp:140};
 }
 assert.equal(T.serialize(sandbox.B.validate(p)),T.serialize(p),"The production validator must preserve the complete fixture");
 return p;
}
function compress(raw,encoding){return encoding==="gzip"?z.gzipSync(raw,{level:6}):z.brotliCompressSync(raw,{params:{[z.constants.BROTLI_PARAM_QUALITY]:4}});}
function studyWrapper(raw,encoding){return {version:"compression-study-only",encoding,jsonBytes:raw.length,body:compress(raw,encoding).toString("base64")};}
function unpack(w){
 assert.equal(w.version,"compression-study-only");assert(["gzip","brotli"].includes(w.encoding));
 assert(Number.isSafeInteger(w.jsonBytes)&&w.jsonBytes>0&&w.jsonBytes<=MAX);
 assert(typeof w.body==="string"&&w.body.length<=4*Math.ceil(MAX/3));
 const compressed=Buffer.from(w.body,"base64");assert.equal(compressed.toString("base64"),w.body);
 const raw=w.encoding==="gzip"?z.gunzipSync(compressed,{maxOutputLength:w.jsonBytes}):z.brotliDecompressSync(compressed,{maxOutputLength:w.jsonBytes});
 assert.equal(raw.length,w.jsonBytes);return raw;
}
async function database(){
 const db=new PGlite();
 await db.exec("create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); grant usage on schema public,auth to anon,authenticated; create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$; create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;");
 await db.exec(read("sql/reconversion_progress.sql"));
 for(const n of fs.readdirSync(path.join(root,"supabase/migrations")).filter(n=>n.endsWith(".sql")).sort())await db.exec(read("supabase/migrations/"+n));
 await db.exec("alter table public.reconversion_progress validate constraint progress_safe_revision; alter table public.reconversion_progress validate constraint progress_encrypted_envelope;");
 await db.query("insert into auth.users(id) values($1)",[UID]);
 await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:UID,is_anonymous:false})]);await db.exec("set role authenticated");
 return db;
}
async function sizes(db){
 return (await db.query("select c.relname,pg_relation_size(c.oid)::int heap_bytes,pg_indexes_size(c.oid)::int index_bytes,pg_total_relation_size(c.oid)::int total_bytes from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('reconversion_progress','reconversion_progress_history') order by c.relname")).rows;
}
async function measure(base,encoding){
 const db=await database(),ivs=new Set(),salts=new Set();let last,raw,wrapped;
 try{
  for(let revision=1;revision<=21;revision++){
   const p=clone(base);p.career.profile.history="Mesure FICTIVE hors ligne, révision "+revision+".";sandbox.B.validate(p);
   raw=Buffer.from(T.serialize(p));assert(raw.length<=MAX);
   wrapped=encoding==="none"?p:studyWrapper(raw,encoding);
   if(encoding!=="none"){assert.throws(()=>sandbox.B.validate(wrapped));assert.equal(unpack(wrapped).toString(),raw.toString());}
   last=await T.seal(wrapped,PHRASE);assert(!ivs.has(last.iv)&&!salts.has(last.salt));ivs.add(last.iv);salts.add(last.salt);
   const opened=clone(await T.open(last,PHRASE)),restored=encoding==="none"?opened:JSON.parse(unpack(opened));
   assert.equal(T.serialize(sandbox.B.validate(restored)),raw.toString());
   if(revision===1)await db.query("insert into public.reconversion_progress(user_id,revision,payload) values($1,1,$2)",[UID,last]);
   else{const changed=await db.query("update public.reconversion_progress set revision=$1,payload=$2 where user_id=$3 and revision=$4 returning revision",[revision,last,UID,revision-1]);assert.equal(changed.rows.length,1);}
  }
  assert.equal((await db.query("select count(*)::int n from public.reconversion_progress_history")).rows[0].n,20);
  const recovered=(await db.query("select payload from public.reconversion_progress_history where revision=2")).rows[0].payload;
  const old=clone(await T.open(recovered,PHRASE));sandbox.B.validate(encoding==="none"?old:JSON.parse(unpack(old)));
  await db.exec("reset role");
  const afterWrites=await sizes(db);
  await db.exec("vacuum full analyze public.reconversion_progress");
  await db.exec("vacuum full analyze public.reconversion_progress_history");
  const compacted=await sizes(db),readBody=JSON.stringify([{revision:21,payload:last}]),headBody=JSON.stringify([{revision:21}]);
  const fullPolls=30*5*3600/30,integrityReads=30*5*3600/600;
  return {encoding,studyOnly:encoding!=="none",dailyDays:Object.keys(base.dailyFive.days).length,jsonBytes:raw.length,compressedBytes:encoding==="none"?raw.length:Buffer.from(wrapped.body,"base64").length,ciphertextBytes:Buffer.from(last.ciphertext,"base64").length,envelopeJsonBytes:bytes(JSON.stringify(last)),uploadBodyBytes:bytes(JSON.stringify({revision:21,payload:last})),readBodyBytes:bytes(readBody),revisionBodyBytes:bytes(headBody),historyRows:20,mainRows:1,distinctVersions:20,currentCiphertextStoredTwice:true,postgresAfter21Writes:afterWrites,postgresCompacted:compacted,postgresTotalBytes:compacted.reduce((s,x)=>s+x.total_bytes,0),monthlyReadBodyBytesExample:{deviceHoursPerDay:5,days:30,unchangedFullEvery30s:fullPolls*bytes(readBody),revisionEvery30sAndFullEvery10min:(fullPolls-integrityReads)*bytes(headBody)+integrityReads*bytes(readBody)},headersTlsAuthAndChangesExcluded:true};
 }finally{await db.close();}
}
async function run(){
 const large=Buffer.alloc(65536,65),bomb=studyWrapper(large,"gzip");bomb.jsonBytes=1024;assert.throws(()=>unpack(bomb));
 const brBomb=studyWrapper(large,"brotli");brBomb.jsonBytes=1024;assert.throws(()=>unpack(brBomb));
 const bad=studyWrapper(Buffer.from("fictitious"),"gzip"),corrupt=Buffer.from(bad.body,"base64");corrupt[0]^=255;bad.body=corrupt.toString("base64");assert.throws(()=>unpack(bad));
 const results=[];
 for(const days of [0,365,1825]){const p=fixture(days);for(const encoding of ["none","gzip","brotli"])results.push(await measure(p,encoding));}
 for(const r of results){const baseline=results.find(x=>x.dailyDays===r.dailyDays&&x.encoding==="none");r.envelopeSavingsPct=100*(1-r.envelopeJsonBytes/baseline.envelopeJsonBytes);r.postgresSavingsPct=100*(1-r.postgresTotalBytes/baseline.postgresTotalBytes);}
 const report={fictitious:true,offline:true,engine:"PGlite 0.5.11, real PostgreSQL WASM; mock Auth",node:process.version,productionCompressionEnabled:false,studyFormatNotAcceptedByCurrentApp:true,boundedDecompressionAndRoundtripPassed:true,results};
 const json=JSON.stringify(report,null,2);
 if(process.env.RC_STORAGE_REPORT){fs.mkdirSync(path.dirname(process.env.RC_STORAGE_REPORT),{recursive:true});fs.writeFileSync(process.env.RC_STORAGE_REPORT,json+"\n");}
 console.log(json);
}
run().catch(e=>{console.error(e);process.exitCode=1;});
