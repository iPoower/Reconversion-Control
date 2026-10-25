"use strict";
// Real application/crypto/Storage in TWO isolated profiles; all provider HTTP intercepted.
const fs=require("node:fs/promises"),assert=require("node:assert/strict"),{chromium,webkit,devices}=require("playwright"),{startServer}=require("./server.cjs");
const B={chromium,webkit}[process.env.BROWSER||"chromium"],CANON="reconversion-control.snapshot.v3",PHRASE="fictional-end-to-end-phrase-2026",USER="11111111-1111-4111-8111-111111111111";
const pause=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
async function run(){
 const server=await startServer(),browser=await B.launch({headless:true}),contexts=[],errors=[],unexpected=[];
 let row=null,history=[],lose=false,failReads=false,writeGate=null,writes=0,revisionReads=0,fullReads=0;
 const methods=[],browserLogs=[];
 async function context(mobile=false){
  const c=await browser.newContext({...(mobile?devices["iPhone 11 Pro Max"]:{}),serviceWorkers:"block",acceptDownloads:true});contexts.push(c);
  await c.addInitScript(()=>{const original=window.setInterval;window.setInterval=(fn,delay,...args)=>{if(delay===30000)window.__cloudPeriodic=fn;return original(fn,delay,...args);};});
  await c.route("**/*",async route=>{
   const req=route.request(),url=new URL(req.url());if(url.origin===server.origin)return route.continue();
   if(url.origin!=="https://fixture.supabase.co"){unexpected.push(req.url());return route.abort();}
   const reply=(code,data)=>route.fulfill({status:code,contentType:"application/json",headers:{"access-control-allow-origin":server.origin,"access-control-allow-methods":"GET,POST,PATCH,OPTIONS","access-control-allow-headers":"apikey,authorization,content-type,prefer"},body:JSON.stringify(data)});
   if(req.method()==="OPTIONS")return reply(200,{});methods.push(url.pathname+" "+req.method());
   if(url.pathname==="/auth/v1/otp")return reply(200,{});
   if(url.pathname==="/auth/v1/verify"||url.pathname==="/auth/v1/token")return reply(200,{access_token:"test-access",refresh_token:"test-refresh",expires_in:3600,user:{id:USER}});
   if(url.pathname==="/auth/v1/user")return reply(200,{id:USER});
   if(url.pathname==="/auth/v1/logout")return reply(200,{});
   if(url.pathname==="/rest/v1/reconversion_progress_history"){const versions=url.searchParams.has("revision")?history.filter(r=>"eq."+r.revision===url.searchParams.get("revision")):[...history].reverse().slice(0,20);return reply(200,url.searchParams.get("select")==="revision"?versions.map(r=>({revision:r.revision})):versions);}
   if(url.pathname!=="/rest/v1/reconversion_progress"){unexpected.push(req.url());return route.abort();}
   if(req.method()==="GET"){if(failReads)return route.abort("failed");const small=url.searchParams.get("select")==="revision";if(small)revisionReads++;else fullReads++;return reply(200,row?[small?{revision:row.revision}:row]:[]);}
   const data=req.postDataJSON(),first=req.method()==="POST";
   if(first&&row||!first&&(!row||url.searchParams.get("revision")!=="eq."+row.revision))return reply(409,{});
   if(writeGate){const held=writeGate;writeGate=null;held.started.resolve();await held.release.promise;}
   row={revision:first?1:row.revision+1,payload:data.payload};history.push(row);writes++;
   if(lose){lose=false;return route.abort("failed");}return reply(200,[row]);
  });
  return c;
 }
 async function page(c){const p=await c.newPage();p.on("pageerror",e=>errors.push(e.message));p.on("console",m=>browserLogs.push(m.text()));p.on("dialog",d=>d.accept());await p.goto(server.url+"/#privacy");await require("./private-device.cjs").enter(p);await p.waitForFunction(k=>!!localStorage.getItem(k),CANON);return p;}
 async function click(p,id){await p.evaluate(id=>document.querySelector("#rc-sync-"+id).onclick(),id);}
 async function connect(p,remember=true){await require("./private-device.cjs").legacyEmail(p);await p.locator("#rc-sync-url").fill("https://fixture.supabase.co");await p.locator("#rc-sync-key").fill("sb_publishable_fixture");await p.locator("#rc-sync-email").fill("test@example.invalid");if(remember)await p.locator("#rc-sync-remember").check();await click(p,"request");await p.locator("#rc-sync-otp").fill("123456");await p.locator("#rc-sync-phrase").fill(PHRASE);await click(p,"verify");}
 async function unlock(p){await p.locator("#rc-sync-phrase").fill(PHRASE);await click(p,"unlock");}
 async function read(p){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),CANON);}
 async function snapshot(p){return p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));return {version:2,progress:s.main.progress,review:s.main.review,labs:s.main.labs,proofs:s.main.proofs,labChecks:s.main.labChecks,dailyFive:s.daily,career:s.main.career};},CANON);}
 async function edit(p,value){await p.locator('#nav [data-view="library"]').click();await p.locator('[data-card="dns"] [data-prog="'+value+'"]').click();await p.locator('#nav [data-view="privacy"]').click();}
 async function clearDebounce(p){await p.evaluate(()=>{const old=window.setTimeout;window.__restoreTimeout=()=>{window.setTimeout=old;};window.setTimeout=(fn,delay,...args)=>delay>=2000&&delay<=60000?old(()=>{},delay):old(fn,delay,...args);});}
 try{
  const pc=await page(await context());
  // A complete, fictitious business export; real validator supplies durable V3.
  const seed=await pc.evaluate(()=>{
   const career=RC_PROJECT_PLAN.empty();career.profile={diploma:"Bac fictif",history:"Dossier de test sans données personnelles"};career.schools.jedha.costs={tuition:12000};
   const day=RC_DAILY_FIVE[0];
   return {version:2,progress:{dns:"mastered","rc-09":"progress"},review:{dns:{step:2,due:"2026-10-25",lapses:1,lastRating:"good"}},labs:{[RC_LABS[0].id]:"progress"},proofs:{"rc-09":{status:"mastered",evidence:"preuve fictive"}},labChecks:{"lab-02":{sha256:"a".repeat(64),at:"2026-10-24T06:00:00Z"}},dailyFive:{days:{"2026-10-23":{sessionId:day.id,reason:"Rotation",quizChoice:day.quiz.answer,quizCorrect:true,missionDone:true,englishChoice:day.english.answer,englishCorrect:true,completed:true,xp:140}}},career};
  });
  // Obtain valid lab/proof IDs from the existing public teaching catalog.
  await pc.locator("#importer").setInputFiles({name:"fictional-progression.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(seed))});
  await pc.waitForFunction(()=>document.querySelector("#importer").value==="");
  const initial=await snapshot(pc);assert.equal(initial.progress.dns,"mastered");
  await connect(pc);assert.equal(row,null,"OTP/unlock alone must not upload a first real snapshot");
  await click(pc,"create");assert.equal(row.revision,1);assert(!JSON.stringify(row).includes("mastered"));
  const firstWrites=writes;await click(pc,"now");await click(pc,"now");assert.equal(writes,firstWrites);assert.equal(row.revision,1);
  const remote=await pc.evaluate(async({p,phrase})=>RC_CLOUD_TRANSPORT.open(p,phrase),{p:row.payload,phrase:PHRASE});assert.deepEqual(remote,initial);
  console.log("PASS browser cloud: explicit first source; complete atomic V3 business snapshot encrypted before send");
  const beforeProbe={revisionReads,fullReads,writes},receiptBefore=await pc.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith("reconversion-control.cloud.sync.v1:")).map(k=>localStorage.getItem(k)).join("\n"));
  await pc.evaluate(()=>window.__cloudPeriodic());assert.equal(revisionReads,beforeProbe.revisionReads+1);assert.equal(fullReads,beforeProbe.fullReads);assert.equal(writes,beforeProbe.writes);
  assert.equal(await pc.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith("reconversion-control.cloud.sync.v1:")).map(k=>localStorage.getItem(k)).join("\n")),receiptBefore);
  console.log("PASS browser cloud: idle periodic check transfers only a revision and preserves the confirmed receipt");
  const phone=await page(await context(true));await connect(phone);assert(await phone.locator("#rc-sync-take").isVisible());assert.notEqual((await read(phone)).main.progress.dns,"mastered");
  await click(phone,"take");assert.deepEqual(await snapshot(phone),initial);
  // Actual page close/reopen discards memory/keys and retains browser Storage.
  const phoneContext=phone.context();await phone.close();const reopened=await page(phoneContext),beforeOTP=methods.filter(x=>x.includes("/verify")).length;
  assert(await reopened.locator("#rc-sync-unlock").isVisible());
  const noNetworkBefore=methods.length;await reopened.locator("#rc-sync-phrase").fill("wrong-fictional-passphrase");await click(reopened,"unlock");assert.match(await reopened.locator("#rc-sync-status").textContent(),/refusé/);assert.equal(methods.length,noNetworkBefore);assert.deepEqual(await snapshot(reopened),initial);
  await unlock(reopened);assert.equal(methods.filter(x=>x.includes("/verify")).length,beforeOTP);
  assert.match(await reopened.locator("#rc-sync-status").textContent(),/Restauration vérifiée après réouverture/);assert.deepEqual(await snapshot(reopened),initial);
  const persistent=await reopened.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes("cloud")).map(k=>localStorage.getItem(k)).join("\n"));
  assert(!persistent.includes(PHRASE));assert(!persistent.includes("test-access"));assert(!persistent.includes("test-refresh"));
  console.log("PASS browser cloud: second device complete restore; page close/reopen; encrypted session resumes without OTP, phrase still required");
  await edit(reopened,"progress");await click(reopened,"now");await click(pc,"now");assert.deepEqual(await snapshot(pc),await snapshot(reopened));
  console.log("PASS browser cloud: reverse phone-to-PC synchronization through independent profiles");
  const offlineWrites=writes;await reopened.context().setOffline(true);await edit(reopened,"mastered");await click(reopened,"now");
  assert.match(await reopened.locator("#rc-sync-status").textContent(),/Hors connexion/);assert.equal(writes,offlineWrites);assert.equal((await read(reopened)).main.progress.dns,"mastered");
  await reopened.context().setOffline(false);await click(reopened,"now");
  await reopened.waitForFunction(()=>/Modifications locales sauvegardées|À jour sur cet appareil/.test(document.querySelector("#rc-sync-status").textContent));
  await click(pc,"now");assert.deepEqual(await snapshot(pc),await snapshot(reopened));
  console.log("PASS browser cloud: offline edits remain local and synchronize on reconnect");
  // Lost mutation response AND failed reconciliation. Outbox must survive a restart.
  await clearDebounce(pc);await edit(pc,"learn");lose=true;failReads=false;
  // Intercept only read-after-mutation by setting failReads when write reaches its gate.
  const held={started:pause(),release:pause()};writeGate=held;
  const sending=click(pc,"now");await held.started.promise;failReads=true;held.release.resolve();await sending;
  assert.match(await pc.locator("#rc-sync-status").textContent(),/en attente/);assert.equal((await read(pc)).main.progress.dns,"learn");const committed=row.revision;
  await pc.reload();await require("./private-device.cjs").enter(pc);failReads=false;await unlock(pc);assert.equal(row.revision,committed,"uncertain upload retry must be idempotent");
  assert.equal((await snapshot(pc)).progress.dns,"learn");
  console.log("PASS browser cloud: response lost after server commit + failed readback; durable outbox reconciles after reload without a duplicate revision");
  await click(reopened,"now");
  // Both devices diverge; no field-level last-write-wins or silent replacement.
  await clearDebounce(pc);await clearDebounce(reopened);await edit(pc,"progress");await edit(reopened,"mastered");await click(pc,"now");await click(reopened,"now");
  assert.match(await reopened.locator("#rc-sync-status").textContent(),/Conflit détecté/);assert.equal((await read(reopened)).main.progress.dns,"mastered");assert.equal((await read(pc)).main.progress.dns,"progress");
  await click(reopened,"push");await click(pc,"now");assert.equal((await read(pc)).main.progress.dns,"mastered");
  assert(await reopened.evaluate(()=>JSON.parse(localStorage.getItem("reconversion-control.cloud.recovery.v1")).copies.length>=1));
  console.log("PASS browser cloud: concurrent device divergence requires choice; replaced version preserved before write");
  // Local write failure cannot manufacture a confirmed upload or discard V3.
  const saved=await pc.evaluate(k=>localStorage.getItem(k),CANON),previousWrites=writes;
  await pc.evaluate(k=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,v){if(key===k)throw new DOMException("synthetic quota","QuotaExceededError");return original.call(this,key,v);};},CANON);
  await edit(pc,"learn");await click(pc,"now");assert.equal(writes,previousWrites);assert.equal(await pc.evaluate(k=>localStorage.getItem(k),CANON),saved);
  assert.match(await pc.locator("#rc-sync-status").textContent(),/non confirmée|non enregistrées/);
  await pc.reload();await require("./private-device.cjs").enter(pc);await unlock(pc);assert.equal((await read(pc)).main.progress.dns,"mastered");
  console.log("PASS browser cloud: failed local write blocks transmission and preserves last confirmed progress across reload");
  const beforeJournal=writes;await pc.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,v){if(key.startsWith("reconversion-control.cloud.sync.v1:"))throw new DOMException("synthetic journal quota","QuotaExceededError");return original.call(this,key,v);};});
  await edit(pc,"progress");await click(pc,"now");assert.equal(writes,beforeJournal);assert.match(await pc.locator("#rc-sync-status").textContent(),/en attente/);
  await pc.reload();await require("./private-device.cjs").enter(pc);await unlock(pc);await click(pc,"now");await pc.waitForFunction(()=>/sauvegardées|À jour sur cet appareil/.test(document.querySelector("#rc-sync-status").textContent));
  assert.equal((await read(pc)).main.progress.dns,"progress");
  console.log("PASS browser cloud: durable journal failure blocks upload; saved local edit resumes after reload");
  // Valid but empty higher revision still requires an explicit source decision.
  const beforeEmpty=await snapshot(pc);
  row={revision:row.revision+1,payload:await pc.evaluate(async phrase=>RC_CLOUD_TRANSPORT.seal({version:2,progress:{},review:{},labs:{},proofs:{},labChecks:{},dailyFive:{days:{}},career:RC_PROJECT_PLAN.empty()},phrase),PHRASE)};
  await click(pc,"now");assert.deepEqual(await snapshot(pc),beforeEmpty);assert.match(await pc.locator("#rc-sync-status").textContent(),/vide nécessite une sélection explicite/);
  await click(pc,"push");
  console.log("PASS browser cloud: an empty higher revision cannot silently replace a complete local snapshot");
  // Future remote format is rejected without writes, including a new client.
  const stable=await snapshot(pc);row={revision:row.revision+1,payload:await pc.evaluate(async phrase=>RC_CLOUD_TRANSPORT.seal({version:99,progress:{}},phrase),PHRASE)};
  await click(pc,"now");assert.deepEqual(await snapshot(pc),stable);assert.match(await pc.locator("#rc-sync-status").textContent(),/incompatible/);
  // Recover an older valid cloud version through the existing transport, explicitly.
  await click(pc,"history");await pc.evaluate(()=>document.querySelector("[data-sync-history]").onclick());assert.equal((await read(pc)).main.progress.dns,stable.progress.dns);assert.match(await pc.locator("#rc-sync-status").textContent(),/Ancienne révision/);
  console.log("PASS browser cloud: future/corrupt head cannot erase local progress; bounded previous cloud version is explicitly recoverable");
  const expectedRecovery=await pc.evaluate(()=>JSON.parse(localStorage.getItem("reconversion-control.cloud.recovery.v1")).copies[0].data);
  const downloading=pc.waitForEvent("download");await pc.locator("#export-recovery").click();const download=await downloading;assert.deepEqual(JSON.parse(await fs.readFile(await download.path(),"utf8")),expectedRecovery);
  console.log("PASS browser cloud: independent recovery export downloads every preserved business field");
  await click(pc,"disconnect");assert.equal(await pc.evaluate(()=>localStorage.getItem("reconversion-control.cloud.session.v1")),null);assert.deepEqual(await snapshot(pc),stable);
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  for(const secret of [PHRASE,"test-access","test-refresh"])assert(!browserLogs.some(line=>line.includes(secret)),"browser logs must not contain authentication or encryption secrets");
  console.log("PASS browser cloud: explicit logout deletes remembered secrets and preserves local progress; no unmocked provider requests");
 }finally{if(writeGate)writeGate.release.resolve();for(const c of contexts)await c.close();await browser.close();await server.close();}
}
const watchdog=setTimeout(()=>{throw Error("Final-mile browser suite stalled");},180000);run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>clearTimeout(watchdog));
