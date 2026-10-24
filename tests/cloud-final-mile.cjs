"use strict";
// Isolated Supabase HTTP simulation, actual production crypto/transport. No credentials.
const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),{webcrypto}=require("node:crypto");
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222",phrase="isolated-fictional-phrase-2026";
const clone=v=>JSON.parse(JSON.stringify(v)),response=(status,j)=>({ok:status>=200&&status<300,status,text:async()=>JSON.stringify(j)});
let passed=0;
async function check(name,fn){await fn();passed++;console.log("PASS cloud final mile: "+name);}
function fixture(){
 const rows=new Map(),calls=[];let lost=false,failRead=false,empty=false,expired=false,refreshes=0,revoke=false,anon=false,clock=0;
 async function fetch(input,init){
  const url=new URL(input),body=init.body?JSON.parse(init.body):{},token=init.headers.Authorization;
  assert.equal(url.origin,"https://fixture.supabase.co");calls.push({path:url.pathname,method:init.method});
  if(url.pathname==="/auth/v1/verify")return response(200,{access_token:body.email.startsWith("b")?b:a,refresh_token:"refresh-fixture",expires_in:expired?1:3600,user:{id:body.email.startsWith("b")?b:a,is_anonymous:anon}});
  if(url.pathname==="/auth/v1/token"){
   refreshes++;await Promise.resolve();
   if(revoke)return response(400,{});
   return response(200,{access_token:a,refresh_token:"rotated-fixture",expires_in:3600,user:{id:a}});
  }
  if(url.pathname==="/auth/v1/user")return response(200,{id:token.slice(7)});
  if(url.pathname==="/auth/v1/logout")return response(204,null);
  if(url.pathname!=="/rest/v1/reconversion_progress")return response(404,{});
  const uid=token&&token.slice(7),target=url.searchParams.get("user_id");
  if(![a,b].includes(uid)||target&&target!=="eq."+uid)return response(403,{});
  if(init.method==="GET"){if(failRead)throw Error("synthetic offline read");return response(200,rows.has(uid)?[rows.get(uid)]:[]);}
  let current=rows.get(uid);
  if(init.method==="POST"){
   if(body.user_id!==uid)return response(403,{});if(current)return response(409,{});current={revision:1,payload:body.payload};
  }else{
   if(!current||url.searchParams.get("revision")!=="eq."+current.revision)return response(200,[]);
   current={revision:current.revision+1,payload:body.payload};
  }
  rows.set(uid,current);
  if(lost){lost=false;throw Error("synthetic lost response AFTER commit");}
  return response(200,empty?[]:[current]);
 }
 const sandbox={URL,crypto:webcrypto,TextEncoder,TextDecoder,fetch,Date:class extends Date{static now(){return Date.now()+clock;}},btoa:s=>Buffer.from(s,"binary").toString("base64"),atob:s=>Buffer.from(s,"base64").toString("binary")};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require("node:path").join(__dirname,"../cloud-transport.js"),"utf8")+"\nglobalThis.T=RC_CLOUD_TRANSPORT",sandbox);
 const T=sandbox.T,cfg={url:"https://fixture.supabase.co",key:"sb_publishable_fixture"};
 return {T,cfg,rows,calls,client:options=>T.create(cfg,options),lose:()=>{lost=true;},offline:v=>{failRead=v;},empty:()=>{empty=true;},expire:()=>{expired=true;},advance:()=>{clock+=3600001;},revoke:()=>{revoke=true;},anonymous:()=>{anon=true;},get refreshes(){return refreshes;}};
}
async function run(){
 await check("legacy AES-256-GCM envelope, independent IV/salt and tamper refusal",async()=>{
  const {T}=fixture(),data={version:2,progress:{dns:"mastered"},dailyFive:{days:{"2026-10-24":{marker:"synthetic"}}}};
  const x=await T.seal(data,phrase),y=await T.seal(data,phrase);assert.notEqual(x.iv,y.iv);assert.notEqual(x.salt,y.salt);assert.deepEqual(clone(await T.open(x,phrase)),data);
  await assert.rejects(T.open(x,"wrong-fictional-phrase"));
  for(const field of ["iv","salt","ciphertext"]){const changed={...x,[field]:(x[field][0]==="A"?"B":"A")+x[field].slice(1)};await assert.rejects(T.open(changed,phrase));}
  await assert.rejects(T.open({...x,v:2},phrase));await assert.rejects(T.open({...x,unknown:true},phrase));await assert.rejects(T.open({...x,ciphertext:"A".repeat(3000000)},phrase));
 });
 await check("serialization freezes before KDF and supports large histories without spread overflow",async()=>{
  const {T}=fixture(),data={version:2,progress:{dns:"progress"},history:"x".repeat(300000)};
  const pending=T.seal(data,phrase);data.progress.dns="mastered";const sealed=await pending;
  assert.equal((await T.open(sealed,phrase)).progress.dns,"progress");await assert.rejects(T.seal({large:"x".repeat(2100000)},phrase));
  await assert.rejects(T.seal(JSON.parse('{"__proto__":{"polluted":true}}'),phrase));
 });
 await check("lost upload response is reconciled by exact ciphertext and revision",async()=>{
  const f=fixture(),c=f.client();await c.verifyCode("a@example.invalid","123456");const payload=await f.T.seal({marker:"A"},phrase);
  f.lose();assert.equal(await c.write(payload,null),1);assert.equal(f.rows.get(a).revision,1);
  assert.equal(await c.write(payload,null),1);assert.equal(f.rows.get(a).revision,1,"idempotent retry must not add a revision");
 });
 await check("uncertain commit stays retryable after read failure and complete client restart",async()=>{
  const f=fixture(),c=f.client();await c.verifyCode("a@example.invalid","123456");const payload=await f.T.seal({marker:"restart"},phrase);
  f.lose();f.offline(true);await assert.rejects(c.write(payload,null));assert.equal(f.rows.get(a).revision,1);
  const reboot=f.client();await reboot.verifyCode("a@example.invalid","123456");f.offline(false);assert.equal(await reboot.write(payload,null),1);assert.equal(f.rows.get(a).revision,1);
 });
 await check("empty mutation response is accepted only after confirmed exact readback",async()=>{
  const f=fixture(),c=f.client();await c.verifyCode("a@example.invalid","123456");const p=await f.T.seal({marker:"only-readback"},phrase);f.empty();assert.equal(await c.write(p,null),1);
 });
 await check("two independent users and simultaneous clients preserve conflict copies",async()=>{
  const f=fixture(),x=f.client(),y=f.client(),other=f.client();await x.verifyCode("a@example.invalid","123456");await y.verifyCode("a@example.invalid","123456");await other.verifyCode("b@example.invalid","123456");
  const p=await f.T.seal({marker:"first"},phrase),q=await f.T.seal({marker:"second"},phrase);await x.write(p,null);
  assert.equal(await other.read(),null);await other.write(q,null);assert.equal((await x.read()).payload.ciphertext,p.ciphertext);
  const attempts=await Promise.allSettled([x.write(q,1),y.write(p,1)]);assert.equal(attempts.filter(r=>r.status==="fulfilled").length,1);assert.equal(f.rows.get(a).revision,2);assert.equal(f.rows.get(b).revision,1);
 });
 await check("refresh is single-flight, encrypted remembered session resumes without OTP",async()=>{
  const f=fixture();let saved;const x=f.client({sessionChanged:async session=>{saved=await f.T.sealSession(session,phrase);}});
  await x.verifyCode("a@example.invalid","123456");assert(!JSON.stringify(saved).includes("refresh-fixture"));
  await assert.rejects(f.T.open(saved,phrase),/Déchiffrement/);await assert.rejects(f.T.openSession(saved,"wrong-fictional-phrase"));
  const session=await f.T.openSession(saved,phrase),before=f.calls.length,y=f.client();await y.resume(session);
  assert(!f.calls.slice(before).some(c=>c.path==="/auth/v1/verify"));f.advance();await Promise.all([y.read(),y.read()]);assert.equal(f.refreshes,1);
 });
 await check("revoked session and anonymous sign-in cannot write",async()=>{
  const f=fixture(),x=f.client();f.expire();await x.verifyCode("a@example.invalid","123456");f.revoke();await assert.rejects(x.read(),/expirée|révoquée/);assert.equal(f.rows.size,0);
  const g=fixture();g.anonymous();await assert.rejects(g.client().verifyCode("a@example.invalid","123456"),/Authentification/);
 });
 await check("failed rotated-session persistence blocks requests until durable retry succeeds",async()=>{
  const f=fixture();let fail=false,saves=0;
  const c=f.client({sessionChanged:async()=>{saves++;if(fail)throw Error("synthetic session storage quota");}});
  await c.verifyCode("a@example.invalid","123456");f.advance();fail=true;
  await assert.rejects(c.read(),/storage quota/);await assert.rejects(c.read(),/storage quota/);
  assert.equal(f.calls.filter(x=>x.path==="/rest/v1/reconversion_progress").length,0);
  fail=false;assert.equal(await c.read(),null);assert.equal(f.refreshes,1);assert(saves>=4);
 });
 await check("logout while authentication yields cancels a not-yet-sent data request",async()=>{
  const f=fixture(),c=f.client();await c.verifyCode("a@example.invalid","123456");const reading=c.read();await c.logout();await assert.rejects(reading,/annulée|Non connecté/);
  assert.equal(f.calls.filter(x=>x.path==="/rest/v1/reconversion_progress").length,0);
 });
 await check("explicit logout clears client; unsafe revisions and secret keys rejected",async()=>{
  const f=fixture(),c=f.client();await c.verifyCode("a@example.invalid","123456");await c.logout();await assert.rejects(c.read(),/Non connecté/);
  await c.verifyCode("a@example.invalid","123456");for(const revision of [-1,0,1.2,"1",Number.MAX_SAFE_INTEGER])await assert.rejects(c.write({},revision),/Révision/);
  assert.throws(()=>f.T.config(f.cfg.url,"sb_secret_do_not_use"));assert.throws(()=>f.T.config(f.cfg.url+"/other",f.cfg.key));
 });
 console.log("Cloud final-mile transport/crypto: "+passed+" groups passed; simulated HTTP only (not hosted RLS).");
}
const watchdog=setTimeout(()=>{throw Error("Final-mile transport suite stalled");},60000);run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>clearTimeout(watchdog));
