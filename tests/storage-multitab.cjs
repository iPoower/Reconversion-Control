"use strict";
const assert = require("node:assert/strict");
const {chromium,webkit} = require("playwright");
const {startServer} = require("./server.cjs");
const B = {chromium,webkit}[process.env.BROWSER || "chromium"];
const A="reconversion-control.snapshot.v3";
const fixture={version:2,progress:{dns:"progress"},review:{},labs:{},proofs:{},labChecks:{},dailyFive:{days:{"2026-10-23":{missionDone:true}}}};
const file={name:"synthetic-multitab.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(fixture))};
const snapshot=page=>page.evaluate(k=>localStorage.getItem(k),A);
async function nav(page,view){await page.locator('#nav [data-view="'+view+'"]').click();}
async function writer(page){await page.waitForFunction(async()=>{const q=await navigator.locks.query();return q.held.some(l=>l.name==="reconversion-control-writer-v3");});}
async function run(){
 const server=await startServer(),browser=await B.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:"block",acceptDownloads:true});
 const first=await context.newPage(),second=await context.newPage(),dialogs=[];
 second.on("dialog",async d=>{dialogs.push(d.message());await d.accept();});
 first.on("dialog",async d=>{await d.accept();});
 try{
  await first.goto(server.url);await writer(first);await nav(first,"privacy");
  await first.locator("#importer").setInputFiles(file);
  await first.waitForFunction(()=>document.querySelector("#importer").value==="");
  const before=await snapshot(first);assert.equal(JSON.parse(before).main.progress.dns,"progress");
  assert.deepEqual(JSON.parse(before).daily,fixture.dailyFive);
  await second.goto(server.url);await nav(second,"privacy");
  await second.locator("#storage-notice").waitFor({state:"visible"});
  assert.equal(await snapshot(second),before,"opening a second tab must not rewrite the source");
  const replacement={...fixture,progress:{dns:"mastered"},dailyFive:{days:{}}};
  await second.locator("#importer").setInputFiles({...file,buffer:Buffer.from(JSON.stringify(replacement))});
  await second.waitForFunction(()=>document.querySelector("#importer").value==="");
  assert(dialogs.some(x=>/Import refusé/.test(x)),"secondary-tab restoration must refuse before commit");
  assert.equal(await snapshot(second),before,"entire main and Daily Five remain unchanged");
  await nav(first,"library");await nav(second,"library");
  await Promise.all([
   first.locator('[data-card="dns"] [data-prog="mastered"]').click(),
   second.locator('[data-card="dns"] [data-prog="learn"]').click()
  ]);
  const committed=JSON.parse(await snapshot(first));assert.equal(committed.main.progress.dns,"mastered");
  assert.deepEqual(committed.daily,fixture.dailyFive);
  const downloadPromise=second.waitForEvent("download");await nav(second,"privacy");await second.locator("#export").click();
  const download=await downloadPromise;const stream=await download.createReadStream(),chunks=[];for await(const c of stream)chunks.push(c);
  const memory=JSON.parse(Buffer.concat(chunks).toString());assert.equal(memory.progress.dns,"learn","refused memory changes remain exportable");
  assert.equal(JSON.parse(await snapshot(first)).main.progress.dns,"mastered");
  await first.close();await second.close();
  const reopened=await context.newPage();await reopened.goto(server.url);await writer(reopened);
  const after=JSON.parse(await snapshot(reopened));
  // Navigation can differ; every durable business field must be structurally identical.
  for(const key of ["progress","review","labs","proofs","labChecks","career"])assert.deepEqual(after.main[key],committed.main[key],key);
  assert.deepEqual(after.daily,committed.daily);await reopened.close();
  console.log("PASS multi-tab: exclusive native Web Lock, rejected restore, concurrent actions, exportable unsaved work and full business/Daily Five persistence after closure");
  for(const corrupt of [
   {version:3,main:{progress:"corrupt",review:{}},daily:{days:{}}},
   {version:3,main:{progress:{dns:"invalid"},review:{}},daily:{days:{}}},
   {version:3,main:{progress:{},review:{}},daily:{days:{"2026-10-23":{completed:true}}}}
  ]){
   const c=await browser.newContext({serviceWorkers:"block"}),p=await c.newPage();
   const raw=JSON.stringify(corrupt);await c.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:A,raw});
   await p.goto(server.url);await writer(p);await nav(p,"library");
   await p.locator('[data-card="dns"] [data-prog="mastered"]').click();
   assert.equal(await snapshot(p),raw,"corrupt authoritative bytes must never be overwritten by defaults");
   await p.locator("#storage-notice").waitFor({state:"visible"});await c.close();
  }
  console.log("PASS corrupted canonical data: malformed progression, invalid status and incomplete Daily Five preserve every original byte");

  const legacyContext=await browser.newContext({serviceWorkers:"block"}),legacyPage=await legacyContext.newPage();
  const legacyKey="reconversion-control.state.v1",legacyRaw=JSON.stringify({progress:{retiredTopic:"mastered"},review:{}});
  await legacyContext.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:legacyKey,raw:legacyRaw});
  await legacyPage.goto(server.url);await writer(legacyPage);await nav(legacyPage,"library");
  await legacyPage.locator('[data-card="dns"] [data-prog="mastered"]').click();
  assert.equal(await legacyPage.evaluate(k=>localStorage.getItem(k),legacyKey),legacyRaw,"unsupported historical bytes remain untouched");
  assert.equal(await snapshot(legacyPage),null,"no authoritative replacement may hide unsupported history");
  await legacyPage.locator("#storage-notice").waitFor({state:"visible"});await legacyContext.close();
  console.log("PASS historical unsupported progression: original bytes preserved, no default-valued migration");
 }finally{await context.close();await browser.close();await server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
