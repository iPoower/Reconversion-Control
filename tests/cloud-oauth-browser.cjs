"use strict";
// Real app, crypto and browser storage; ALL Auth/Google/Supabase HTTP is mocked.
const assert=require("node:assert/strict"),{createHash}=require("node:crypto"),{chromium,webkit,devices}=require("playwright"),{startServer}=require("./server.cjs"),{enter}=require("./private-device.cjs");
const B={chromium,webkit}[process.env.BROWSER||"chromium"],A="11111111-1111-4111-8111-111111111111",OTHER="22222222-2222-4222-8222-222222222222",CANON="reconversion-control.snapshot.v3",CFG="reconversion-control.cloud.config.v1",PHRASE="FICTIVE-google-backup-phrase-2026";
async function run(){
 const server=await startServer(),browser=await B.launch({headless:true}),contexts=[],logs=[],errors=[],unexpected=[];let row=null,history=[],writes=0,lose=false;
 async function context(uid=A,mobile=false){
  const c=await browser.newContext({...(mobile?devices["iPhone 11 Pro Max"]:{}),serviceWorkers:"block"});contexts.push(c);
  const calls=[];c.calls=calls;let challenge=null;
  await c.route("**/*",async route=>{
   const req=route.request(),u=new URL(req.url());if(u.origin===server.origin)return route.continue();
   if(u.origin!=="https://fixture.supabase.co"){unexpected.push(u.origin+u.pathname);return route.abort();}
   calls.push({path:u.pathname,method:req.method()});
   const user={id:uid,email:uid===A?"fictional-a@example.invalid":"fictional-b@example.invalid",is_anonymous:false,identities:[{provider:"google"}]};
   const reply=(status,body)=>route.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":server.origin,"access-control-allow-methods":"GET,POST,PATCH,OPTIONS","access-control-allow-headers":"apikey,authorization,content-type,prefer"},body:JSON.stringify(body)});
   if(req.method()==="OPTIONS")return reply(200,{});
   if(u.pathname==="/auth/v1/authorize"){
    assert.equal(u.searchParams.get("provider"),"google");assert.equal(u.searchParams.get("scopes"),"openid email profile");assert.equal(u.searchParams.get("code_challenge_method"),"s256");assert.equal(u.searchParams.get("redirect_to"),server.url+"/");
    challenge=u.searchParams.get("code_challenge");
    // WebKit interception cannot fulfill a navigation with HTTP 302. A mock
    // provider page performs the same cross-origin top-level return instead.
    return route.fulfill({status:200,contentType:"text/html",body:'<!doctype html><meta http-equiv="refresh" content="0;url='+server.url+'/?code=fictional-oauth-code-123456789#privacy">'});
   }
   if(u.pathname==="/auth/v1/token"){
    if(u.searchParams.get("grant_type")==="pkce"){const body=req.postDataJSON();assert.equal(body.auth_code,"fictional-oauth-code-123456789");assert.equal(createHash("sha256").update(body.code_verifier).digest("base64url"),challenge);challenge=null;}
    return reply(200,{access_token:"OAUTH_ACCESS_CANARY",refresh_token:"OAUTH_REFRESH_CANARY",provider_token:"GOOGLE_TOKEN_CANARY",expires_in:3600,user});
   }
   if(u.pathname==="/auth/v1/user")return reply(200,user);
   if(u.pathname==="/auth/v1/logout")return reply(200,{});
   if(u.pathname==="/rest/v1/reconversion_progress_history"){
    const rows=u.searchParams.has("revision")?history.filter(r=>"eq."+r.revision===u.searchParams.get("revision")):[...history].reverse().slice(0,20);
    return reply(200,u.searchParams.get("select")==="revision"?rows.map(r=>({revision:r.revision})):rows);
   }
   if(u.pathname!=="/rest/v1/reconversion_progress"){unexpected.push(u.pathname);return route.abort();}
   if(req.method()==="GET")return reply(200,row?[u.searchParams.get("select")==="revision"?{revision:row.revision}:row]:[]);
   const data=req.postDataJSON();if(req.method()==="POST"&&row)return reply(409,{});
   if(req.method()==="PATCH"&&(!row||u.searchParams.get("revision")!=="eq."+row.revision))return reply(200,[]);
   row={revision:data.revision,payload:data.payload};history.push(row);if(history.length>20)history.shift();writes++;
   if(lose){lose=false;return route.abort("failed");}return reply(200,[row]);
  });return c;
 }
 async function page(c){const p=await c.newPage();p.on("pageerror",e=>errors.push(e.message));p.on("console",m=>logs.push(m.text()));p.on("dialog",d=>d.accept());await p.goto(server.url+"/#privacy");await enter(p);return p;}
 async function google(p){await p.locator("#rc-sync-url").fill("https://fixture.supabase.co");await p.locator("#rc-sync-key").fill("sb_publishable_fixture");await p.locator("#rc-sync-google").click();await p.locator("#rc-sync-account").waitFor();assert(!new URL(p.url()).searchParams.has("code"));}
 async function unlockGoogle(p,remember=true){await p.locator("#rc-sync-confirm-account").check();await p.locator("#rc-sync-phrase").fill(PHRASE);if(remember)await p.locator("#rc-sync-remember").check();await p.locator("#rc-sync-google-unlock").click();}
 async function snapshot(p){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),CANON);}
 async function edit(p,value){await p.locator('#nav [data-view="library"]').click();await p.locator('[data-card="dns"] [data-prog="'+value+'"]').click();await p.locator('#nav [data-view="privacy"]').click();}
 try{
  const publicContext=await context();await publicContext.addInitScript(({key})=>{
   localStorage.setItem(key,'{"private":"PUBLIC_READER_CANARY"}');
   window.__privateReads=[];const original=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(this===localStorage)window.__privateReads.push(k);return original.call(this,k);};
  },{key:CANON});
  const pub=await publicContext.newPage();await pub.goto(server.url+"/");assert(await pub.locator("#rc-private-enter").isVisible());assert.equal(await pub.locator("#rc-sync-phrase").count(),0);assert.deepEqual(await pub.evaluate(()=>window.__privateReads),[]);
  await pub.getByRole("link",{name:"Consulter les cours sans connexion",exact:true}).click();await pub.locator("[data-public-lesson]").first().waitFor();assert.equal(await pub.locator("[data-public-lesson]").count(),42);await pub.locator("[data-public-lesson]").first().click();assert(await pub.locator("#public-lesson h2").isVisible());
  for(let i=0;i<42;i++){
   await pub.locator("[data-public-lesson]").nth(i).click();
   const expected=await pub.evaluate(i=>{const l=RC_LESSONS[i];return {title:l.title,sources:l.sources.map(s=>{const id=typeof s==="string"?s:s.id,p=RC_SUPPORTS.find(p=>p.id===id)||s;return (p.title||id)+(s.pages?" · p. "+s.pages:"");})};},i);
   assert.equal(await pub.locator("#public-lesson h2").textContent(),expected.title);
   assert.deepEqual(await pub.locator("#public-lesson .public-sources li").allTextContents(),expected.sources);
  }
  await pub.goto(server.url+"/?code=UNSOLICITED_FICTIONAL_AUTH_CODE#access_token=IMPLICIT_TOKEN_CANARY");await pub.locator("#rc-private-enter").waitFor();assert(!pub.url().includes("code="));assert(!pub.url().includes("IMPLICIT_TOKEN_CANARY"));assert.equal(await pub.locator("#rc-sync-phrase").count(),0);

  assert.deepEqual(await pub.evaluate(()=>window.__privateReads),[]);assert.equal(publicContext.calls.length,0);assert(!await pub.locator("body").innerText().then(s=>s.includes("PUBLIC_READER_CANARY")));
  assert(!server.requests.some(r=>/cloud-transport|cloud-ui|\/app\.js/.test(r.path)),"Public reading must not load personal/cloud code");
  console.log("PASS Google/browser: default gate and all 42 public lessons avoid personal reads, Auth and cloud modules");
  const pcContext=await context(),pc=await page(pcContext);await edit(pc,"mastered");const initial=await snapshot(pc);await google(pc);
  assert.equal(pcContext.calls.filter(r=>r.path.startsWith("/rest/")).length,0,"OAuth alone cannot download progress");assert.equal(row,null);
  const preUnlock=await pc.evaluate(()=>JSON.stringify({...localStorage})+JSON.stringify({...sessionStorage}));assert(!/OAUTH_ACCESS_CANARY|OAUTH_REFRESH_CANARY|GOOGLE_TOKEN_CANARY/.test(preUnlock));
  await unlockGoogle(pc);await pc.locator("#rc-sync-create").waitFor();assert.equal(row,null);await pc.locator("#rc-sync-create").click();await pc.waitForFunction(()=>document.querySelector("#rc-sync-status")?.textContent.includes("confirmée"));assert.equal(row.revision,1);
  const decoded=await pc.evaluate(async({payload,phrase})=>RC_CLOUD_TRANSPORT.open(payload,phrase),{payload:row.payload,phrase:PHRASE});assert.equal(decoded.progress.dns,"mastered");assert(!JSON.stringify(row).includes("mastered"));
  console.log("PASS Google/browser: PKCE return, account confirmation, independent phrase and explicit first encrypted backup with readback");
  const phoneContext=await context(A,true),phone=await page(phoneContext);await google(phone);await unlockGoogle(phone);await phone.locator("#rc-sync-take").waitFor();await phone.locator("#rc-sync-take").click();await phone.waitForFunction(()=>JSON.parse(localStorage.getItem("reconversion-control.snapshot.v3")).main.progress.dns==="mastered");
  const restored=await snapshot(phone);assert.deepEqual(restored.main.progress,initial.main.progress);
  await phone.close();const reopened=await page(phoneContext);assert(await reopened.locator("#rc-sync-unlock").isVisible());const before=phoneContext.calls.length;
  await reopened.locator("#rc-sync-phrase").fill("wrong-fictional-phrase");await reopened.locator("#rc-sync-unlock").click();await reopened.waitForFunction(()=>document.querySelector("#rc-sync-status")?.textContent.includes("refusé"));assert.equal(phoneContext.calls.length,before);assert.deepEqual((await snapshot(reopened)).main.progress,restored.main.progress);
  await reopened.locator("#rc-sync-phrase").fill(PHRASE);await reopened.locator("#rc-sync-unlock").click();await reopened.waitForFunction(()=>document.querySelector("#rc-sync-status")?.textContent.includes("Restauration vérifiée après réouverture"));
  await phoneContext.setOffline(true);await edit(reopened,"progress");await reopened.locator("#rc-sync-now").click();assert.equal((await snapshot(reopened)).main.progress.dns,"progress");lose=true;await phoneContext.setOffline(false);await reopened.locator("#rc-sync-now").click();
  await reopened.waitForFunction(()=>/sauvegardées|À jour sur cet appareil/.test(document.querySelector("#rc-sync-status")?.textContent));await pc.locator("#rc-sync-now").click();await pc.waitForFunction(()=>JSON.parse(localStorage.getItem("reconversion-control.snapshot.v3")).main.progress.dns==="progress");assert.equal(row.revision,2);assert.equal(writes,2);
  const secrets=await reopened.evaluate(()=>JSON.stringify({...localStorage})+JSON.stringify({...sessionStorage}));assert(!secrets.includes(PHRASE));assert(!/OAUTH_ACCESS_CANARY|OAUTH_REFRESH_CANARY|GOOGLE_TOKEN_CANARY/.test(secrets));
  console.log("PASS Google/browser: second independent client, reopen/unlock, wrong phrase, offline edits and lost-response reconciliation");
  const otherContext=await context(OTHER),other=await page(otherContext);await other.evaluate(({key,id})=>{const c={url:"https://fixture.supabase.co",key:"sb_publishable_fixture",owner:id};localStorage.setItem(key,JSON.stringify(c));},{key:CFG,id:A});await other.reload();await enter(other);const stable=await other.evaluate(k=>localStorage.getItem(k),CANON);await other.locator("#rc-sync-google").click();await other.waitForFunction(()=>document.querySelector("#rc-sync-status")?.textContent.includes("compte inattendu"));assert.equal(await other.evaluate(k=>localStorage.getItem(k),CANON),stable);assert.equal(otherContext.calls.filter(r=>r.path.startsWith("/rest/")).length,0);
  console.log("PASS Google/browser: an unexpected account cannot persist its session or access another account's progress");
  await reopened.locator("#rc-sync-disconnect").click();await reopened.waitForFunction(()=>document.querySelector("#rc-sync-status")?.textContent.includes("Déconnecté"));assert.equal(await reopened.evaluate(()=>localStorage.getItem("reconversion-control.cloud.session.v1")),null);assert.equal((await snapshot(reopened)).main.progress.dns,"progress");
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);assert(!/OAUTH_ACCESS_CANARY|OAUTH_REFRESH_CANARY|GOOGLE_TOKEN_CANARY|FICTIVE-google-backup-phrase-2026/.test(logs.join("\n")));
  console.log("PASS Google/browser: explicit logout preserves V3 and no secrets appear in browser logs; provider traffic was entirely simulated");
 }finally{for(const c of contexts)await c.close();await browser.close();await server.close();}
}
const watchdog=setTimeout(()=>{throw Error("Google browser suite stalled");},240000);run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>clearTimeout(watchdog));
