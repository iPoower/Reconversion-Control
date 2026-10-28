"use strict";
// Rollback/replay resistance of encrypted progress envelopes. Real cloud-transport.js
// crypto + real cloud-ui.js controller; the Supabase server is simulated in memory and
// may behave maliciously (replays an older or foreign ciphertext under a new revision).
// Every account, phrase and progression below is fictitious. No network.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),{webcrypto}=require("node:crypto");
const A="11111111-1111-4111-8111-111111111111",B="22222222-2222-4222-8222-222222222222",PHRASE="fictional-rollback-phrase-2026";
const clone=v=>JSON.parse(JSON.stringify(v));
const settle=async()=>{for(let i=0;i<40;i++)await new Promise(r=>setImmediate(r));};

function server(){
 const rows=new Map(),history=[];
 async function fetch(input,init){
  const url=new URL(input),body=init.body?JSON.parse(init.body):{},token=(init.headers.Authorization||"").slice(7);
  const reply=(status,j)=>({ok:status>=200&&status<300,status,text:async()=>JSON.stringify(j)});
  if(url.pathname==="/auth/v1/otp")return reply(200,{});
  if(url.pathname==="/auth/v1/verify"){const id=body.email.startsWith("b")?B:A;return reply(200,{access_token:id,refresh_token:"fictional-refresh",expires_in:3600,user:{id}});}
  if(url.pathname==="/auth/v1/user")return reply(200,{id:token});
  if(url.pathname==="/auth/v1/logout")return reply(204,null);
  if(url.pathname==="/rest/v1/reconversion_progress_history"){const want=url.searchParams.get("revision");return reply(200,history.filter(r=>r.user===token&&(!want||want==="eq."+r.revision)).reverse().map(r=>({revision:r.revision,payload:r.payload})));}
  if(url.pathname!=="/rest/v1/reconversion_progress")return reply(404,{});
  if(init.method==="GET"){const row=rows.get(token);return reply(200,row?[url.searchParams.get("select")==="revision"?{revision:row.revision}:clone(row)]:[]);}
  let current=rows.get(token);
  if(init.method==="POST"){if(current)return reply(409,{});current={revision:1,payload:body.payload};}
  else{if(!current||url.searchParams.get("revision")!=="eq."+current.revision)return reply(200,[]);current={revision:current.revision+1,payload:body.payload};}
  rows.set(token,current);history.push({user:token,...clone(current)});return reply(200,[clone(current)]);
 }
 return {rows,history,fetch,
  // Malicious server: serve `payload` as the next revision of `user` (no client write).
  replay(user,payload){const head=rows.get(user);rows.set(user,{revision:head.revision+1,payload:clone(payload)});}};
}

// sources: optional {transport, ui} source text (used to replay older client versions).
function device(srv,mail="a@example.invalid",store=new Map(),sources){
 let state={version:2,progress:{dns:"initial-fixture"}},timeout=null;const preserved=[];const nodes=new Map(),listeners={};
 const node=s=>{if(!nodes.has(s))nodes.set(s,{value:"",innerHTML:"",textContent:"",checked:false});return nodes.get(s);};
 for(const [id,value] of Object.entries({url:"https://fixture.supabase.co",key:"sb_publishable_fixture",email:mail,otp:"123456",phrase:PHRASE}))node("#rc-sync-"+id).value=value;
 const sandbox={URL,crypto:webcrypto,TextEncoder,TextDecoder,fetch:srv.fetch,Date,
  btoa:s=>Buffer.from(s,"binary").toString("base64"),atob:s=>Buffer.from(s,"base64").toString("binary"),
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  navigator:{onLine:true},confirm:()=>true,
  document:{querySelector:node,addEventListener:(t,f)=>{listeners[t]=f;}},window:{addEventListener:(t,f)=>{listeners[t]=f;}},
  setInterval:()=>1,clearInterval:()=>{},setTimeout:fn=>{timeout=fn;return 2;},clearTimeout:()=>{timeout=null;}};
 vm.createContext(sandbox);
 const root=path.join(__dirname,"..");
 const src=sources||{transport:fs.readFileSync(path.join(root,"cloud-transport.js"),"utf8"),ui:fs.readFileSync(path.join(root,"cloud-ui.js"),"utf8")};
 vm.runInContext(src.transport+"\n"+src.ui+"\nglobalThis.T=RC_CLOUD_TRANSPORT;globalThis.UI=RC_CLOUD_UI;",sandbox);
 const api=sandbox.UI.attach({escape:s=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;"),snapshot:()=>clone(state),restore:d=>{state=clone(d);},preserve:d=>{preserved.push(clone(d));}});
 api.bind();
 const click=async id=>{await node("#rc-sync-"+id).onclick();await settle();};
 return {T:sandbox.T,store,preserved,
  async login(){await click("request");await click("verify");},
  create:()=>click("create"),take:()=>click("take"),push:()=>click("push"),now:()=>click("now"),
  async edit(v){state.progress.dns=v;api.changed();assert(timeout,"a local edit must schedule an upload");const run=timeout;timeout=null;await run();await settle();},
  get local(){return state.progress.dns;},get html(){return node("#rc-sync").innerHTML;},
  get meta(){for(const [k,v] of store)if(k.startsWith("reconversion-control.cloud.sync.v1:"))return JSON.parse(v);return null;}};
}
const open=(T,payload)=>T.open(payload,PHRASE);

async function run(){
 let passed=0;const failures=[];
 async function check(name,fn){try{await fn();passed++;console.log("PASS rollback: "+name);}catch(e){failures.push(e);console.error("FAIL rollback: "+name+": "+e.message);}}
 async function acknowledged(){ // device A: rev1 = "A1", rev2 = "A2"; both acknowledged here.
  const srv=server(),a=device(srv);await a.login();await a.create();await a.edit("A2");
  assert.equal(srv.rows.get(A).revision,2);assert.equal(a.meta.ack.revision,2);return {srv,a};
 }
 await check("an older ciphertext replayed under a higher revision is refused and never applied",async()=>{
  const {srv,a}=await acknowledged();srv.replay(A,srv.history.find(r=>r.revision===1).payload);
  await a.now();assert.equal(a.local,"A2","a replayed older snapshot must not replace local progress");
  assert.equal(a.meta.ack.revision,2,"a replay must never advance the acknowledgement");
  assert.doesNotMatch(a.html,/À jour sur cet appareil et dans le cloud/);assert.match(a.html,/refus|impossible/i);
 });
 await check("the current ciphertext replayed under the next revision is refused (no 'touch' rollback)",async()=>{
  const {srv,a}=await acknowledged();await a.edit("A3");srv.replay(A,srv.rows.get(A).payload);
  await a.now();assert.equal(a.local,"A3");assert.equal(a.meta.ack.revision,3);
 });
 await check("another account's ciphertext (same phrase) is refused for this account",async()=>{
  const {srv,a}=await acknowledged(),b=device(srv,"b@example.invalid");await b.login();await b.create();
  srv.replay(A,srv.rows.get(B).payload);await a.now();assert.equal(a.local,"A2");assert.equal(a.meta.ack.revision,2);
 });
 await check("legitimate next revision from another up-to-date device is applied",async()=>{
  const {srv,a}=await acknowledged(),pc=device(srv);await pc.login();await pc.take();assert.equal(pc.local,"A2");
  await pc.edit("PC3");assert.equal(srv.rows.get(A).revision,3);await a.now();assert.equal(a.local,"PC3");assert.equal(a.meta.ack.revision,3);
 });
 await check("legacy constant-AAD envelopes remain readable on a device that never acknowledged a bound one",async()=>{
  const srv=server(),seed=device(srv);const legacy=await seed.T.seal({version:2,progress:{dns:"legacy-cloud"}},PHRASE);
  srv.rows.set(A,{revision:4,payload:legacy});const a=device(srv);await a.login();assert.match(a.html,/Choisis/);
  await a.take();assert.equal(a.local,"legacy-cloud");assert.equal(a.meta.ack.revision,4);assert.notEqual(a.meta.bound,true);
  srv.replay(A,await a.T.seal({version:2,progress:{dns:"legacy-old-client-5"}},PHRASE));await a.now();
  assert.equal(a.local,"legacy-old-client-5","an old client's legacy write is still accepted during the transition");
 });
 await check("sticky: after the first bound acknowledgement, legacy envelopes for this account are refused",async()=>{
  const {srv,a}=await acknowledged();
  srv.replay(A,await a.T.seal({version:2,progress:{dns:"legacy-after-bound"}},PHRASE));
  await a.now();assert.equal(a.local,"A2","legacy (unbound) envelope must be refused once a bound one was acknowledged");
  assert.equal(a.meta.ack.revision,2);
  // The refusal survives a full restart: the flag lives in the durable per-user journal.
  const again=device(srv,"a@example.invalid",a.store);await again.login();assert.equal(again.meta.ack.revision,2);assert.notEqual(again.local,"legacy-after-bound");
 });
 await check("explicit push never blindly overwrites a head it cannot open as this account/revision",async()=>{
  const {srv,a}=await acknowledged();srv.replay(A,srv.history.find(r=>r.revision===1).payload);
  await a.now();const head=clone(srv.rows.get(A));await a.push();
  assert.deepEqual(srv.rows.get(A),head,"no write over an unverifiable head");assert.equal(a.local,"A2");
 });
 await check("sticky legacy refusal still lets the user explicitly keep this device, preserving the legacy copy first",async()=>{
  const {srv,a}=await acknowledged();srv.replay(A,await a.T.seal({version:2,progress:{dns:"legacy-old-client"}},PHRASE));
  await a.now();assert.equal(a.local,"A2");const before=srv.rows.get(A).revision;await a.push();
  assert.equal(srv.rows.get(A).revision,before+1);assert(a.preserved.some(d=>d.progress.dns==="legacy-old-client"),"replaced legacy copy preserved locally");
  assert.equal(a.meta.ack.revision,before+1);assert.equal(a.meta.bound,true);
 });
 await check("fresh device limitation: no external root of trust, so a legacy envelope under any revision cannot be proven fresh",async()=>{
  // Documented, not a guarantee: a device with no acknowledgement has nothing to compare against.
  // It never auto-applies (explicit choice is required), but it cannot detect a stale legacy copy.
  const srv=server(),seed=device(srv);srv.rows.set(A,{revision:9,payload:await seed.T.seal({version:2,progress:{dns:"possibly-stale"}},PHRASE)});
  const fresh=device(srv);await fresh.login();assert.match(fresh.html,/Choisis/);assert.equal(fresh.local,"initial-fixture");
 });
 console.log("Rollback/replay resistance: "+passed+"/"+(passed+failures.length)+" passed; simulated server only, fictitious data.");
 if(failures.length)throw new AggregateError(failures,failures.length+" rollback cases failed");
}
module.exports={server,device,A,B,PHRASE};
if(require.main===module){
 const watchdog=setTimeout(()=>{throw Error("Rollback suite stalled");},120000);
 run().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>clearTimeout(watchdog));
}
