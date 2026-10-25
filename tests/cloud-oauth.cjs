"use strict";
// Real WebCrypto, fake HTTP and identities. Never contacts Supabase or Google.
const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),{webcrypto,createHash}=require("node:crypto");
const A="11111111-1111-4111-8111-111111111111",B="22222222-2222-4222-8222-222222222222",CALLBACK="http://127.0.0.1:12345/",PROJECT="https://fixture.supabase.co",CODE="fixture-code-1234567890";
function setup(options={}){
 const values=new Map(),events=[],saved=[];let uid=options.uid||A;
 const user=()=>({id:uid,email:"fixture@example.invalid",is_anonymous:false,identities:[{provider:"google"}]});
 const storage={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const sandbox={URL,TextEncoder,TextDecoder,crypto:webcrypto,AbortController,setTimeout,clearTimeout,btoa:s=>Buffer.from(s,"binary").toString("base64"),atob:s=>Buffer.from(s,"base64").toString("binary"),fetch:async(url,init)=>{
  const u=new URL(url);events.push({path:u.pathname,query:u.search,init});
  if(options.fetch)return options.fetch(url,init);
  if(u.pathname==="/auth/v1/token")return response({...userSession(),user:user(),provider_token:"GOOGLE_PROVIDER_CANARY",provider_refresh_token:"GOOGLE_REFRESH_CANARY"});
  if(u.pathname==="/auth/v1/user")return response(options.liveUser||user());
  if(u.pathname==="/auth/v1/logout")return response(null);
  if(u.pathname==="/rest/v1/reconversion_progress")return response([]);
  throw Error("Unexpected fixture HTTP");
 }};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require("node:path").join(__dirname,"../cloud-transport.js"),"utf8")+"\nglobalThis.T=RC_CLOUD_TRANSPORT;",sandbox);
 const client=sandbox.T.create({url:PROJECT,key:"sb_publishable_fixture",...(options.owner?{owner:options.owner}:{})},{oauthStorage:storage,sessionChanged:async s=>saved.push(JSON.parse(JSON.stringify(s)))});
 return{client,values,events,saved,storage,setUID:id=>{uid=id;}};
}
function userSession(){return{access_token:"ACCESS_OAUTH_CANARY",refresh_token:"REFRESH_OAUTH_CANARY",expires_in:3600};}
function response(j,status=200){return {ok:status>=200&&status<300,status,text:async()=>j===null?"":JSON.stringify(j)};}
async function run(){
 {
  const f=setup(),u=new URL(await f.client.beginOAuth(CALLBACK)),pending=JSON.parse([...f.values.values()][0]);
  assert.equal(u.origin,PROJECT);assert.equal(u.pathname,"/auth/v1/authorize");assert.equal(u.searchParams.get("scopes"),"openid email profile");assert.equal(u.searchParams.get("prompt"),"select_account");assert.equal(u.searchParams.get("code_challenge_method"),"s256");
  assert.equal(u.searchParams.get("code_challenge"),createHash("sha256").update(pending.verifier).digest("base64url"));assert(!u.href.includes(pending.verifier));assert(!u.searchParams.has("state"),"Supabase owns the signed provider state");
  const next=new URL(await f.client.beginOAuth(CALLBACK));assert.notEqual(next.searchParams.get("code_challenge"),u.searchParams.get("code_challenge"));
  const identity=await f.client.completeOAuth(CODE,CALLBACK);assert.equal(identity.id,A);assert.equal(f.values.size,0);assert.equal(f.events.length,2);assert.equal(f.events[1].path,"/auth/v1/user");
  assert.equal(f.events[0].init.credentials,"omit");assert.equal(f.events[0].init.cache,"no-store");assert.equal(f.events[0].init.redirect,"error");
  assert(!JSON.stringify(f.saved).includes("GOOGLE_PROVIDER_CANARY"));assert(!JSON.stringify(f.saved).includes("GOOGLE_REFRESH_CANARY"));assert.equal(f.saved[0].user,A);
  await assert.rejects(f.client.completeOAuth(CODE,CALLBACK));assert.equal(f.events.length,2,"A replay without its verifier must not make a request");
  console.log("PASS OAuth: S256, minimal scopes, fresh verifier, checked server identity, consumed attempt and no provider tokens persisted");
 }
 {
  for(const callback of ["https://evil.example/","https://ipoower.github.io/other-app/","https://ipoower.github.io/Reconversion-Control/?next=evil","https://user@ipoower.github.io/Reconversion-Control/","http://localhost.evil.example/"]){const f=setup();await assert.rejects(f.client.beginOAuth(callback));assert.equal(f.values.size,0);assert.equal(f.events.length,0);}
  for(const mutate of [p=>({...p,created:0}),p=>({...p,created:Date.now()+60000}),p=>({...p,project:"https://other.supabase.co"}),p=>({...p,provider:"github"}),p=>({...p,callback:"https://evil.example/"}),p=>({...p,verifier:"short"}),()=>null]){
   const f=setup();await f.client.beginOAuth(CALLBACK);const [key,raw]=[...f.values.entries()][0];f.values.set(key,JSON.stringify(mutate(JSON.parse(raw))));await assert.rejects(f.client.completeOAuth(CODE,CALLBACK));assert.equal(f.events.length,0);assert.equal(f.saved.length,0);
  }
  const f=setup();await assert.rejects(f.client.completeOAuth(CODE,CALLBACK));assert.equal(f.events.length,0);
  console.log("PASS OAuth: redirect injection, unsolicited/expired/cross-project attempts and clock rollback fail closed before HTTP");
 }
 {
  for(const liveUser of [{id:B,is_anonymous:false,identities:[{provider:"google"}]},{id:A,is_anonymous:true,identities:[{provider:"google"}]},{id:A,is_anonymous:false,identities:[{provider:"github"}]}]){
   const f=setup({liveUser});await f.client.beginOAuth(CALLBACK);await assert.rejects(f.client.completeOAuth(CODE,CALLBACK));assert.equal(f.saved.length,0);assert(f.events.every(e=>!e.path.startsWith("/rest/")));
  }
  const f=setup({owner:A,uid:B});await f.client.beginOAuth(CALLBACK);await assert.rejects(f.client.completeOAuth(CODE,CALLBACK),/compte inattendu/);assert.equal(f.saved.length,0);
  console.log("PASS OAuth: wrong, anonymous, non-Google and unexpected owner identities cannot adopt a session or read progress");
 }
 {
  const f=setup({fetch:async()=>response({access_token:"sensitive-never-log"},400)});await f.client.beginOAuth(CALLBACK);await assert.rejects(f.client.completeOAuth(CODE,CALLBACK),e=>!e.message.includes("sensitive-never-log"));assert.equal(f.values.size,0);assert.equal(f.saved.length,0);
  const g=setup();await g.client.beginOAuth(CALLBACK);await g.client.logout();await assert.rejects(g.client.completeOAuth(CODE,CALLBACK));assert.equal(g.events.length,0);
  console.log("PASS OAuth: Auth failure and explicit logout preserve fail-closed behavior without leaking response bodies");
 }
 {
  const f=setup({owner:A});await f.client.beginOAuth(CALLBACK);await f.client.completeOAuth(CODE,CALLBACK);await f.client.read();assert.equal(f.events.at(-1).init.headers.Authorization,"Bearer ACCESS_OAUTH_CANARY");
  await f.client.rememberSession();assert.equal(f.saved.length,2);await f.client.logout();assert.match(f.events.at(-1).query,/scope=local/);
  console.log("PASS OAuth: verified Supabase session reuses the existing REST, persistence callback and local revocation paths");
 }
 {
  const f=setup(),pending=f.client.beginOAuth(CALLBACK);await f.client.logout();await assert.rejects(pending,/annulée/);assert.equal(f.values.size,0);assert.equal(f.events.length,0);
  const g=setup(),cancelled=g.client.beginOAuth(CALLBACK);g.client.cancelOAuth();await assert.rejects(cancelled,/annulée/);assert.equal(g.values.size,0);
  let release;const waiting=new Promise(r=>{release=r;});
  const h=setup({fetch:async(url)=>{await waiting;return response({...userSession(),user:{id:A,is_anonymous:false}});}});
  await h.client.beginOAuth(CALLBACK);const exchange=h.client.completeOAuth(CODE,CALLBACK);await h.client.logout();release();await assert.rejects(exchange);assert.equal(h.saved.length,0);assert(h.events.every(e=>!e.path.startsWith("/rest/")));
  console.log("PASS OAuth: logout and cancellation during asynchronous PKCE preparation/exchange cannot resurrect a session or pending attempt");
 }
 {
  const expired={project:PROJECT,access_token:"OLD_ACCESS",refresh_token:"OLD_REFRESH",expires_at:0,user:A};
  const f=setup({owner:A});await f.client.resume(expired);assert.match(f.events[0].query,/grant_type=refresh_token/);assert.equal(JSON.parse(f.events[0].init.body).refresh_token,"OLD_REFRESH");assert.equal(f.events[1].init.headers.Authorization,"Bearer ACCESS_OAUTH_CANARY");
  const g=setup({fetch:async()=>response({message:"REFRESH_SECRET_CANARY"},401)});await assert.rejects(g.client.resume(expired),/expirée ou révoquée/);await assert.rejects(g.client.read(),/Non connecté/);assert.equal(g.saved.length,0);
  console.log("PASS OAuth: expired Supabase sessions refresh through the existing path; revoked refresh credentials fail closed without progress access");
 }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
