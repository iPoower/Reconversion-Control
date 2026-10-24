"use strict";
const assert = require("node:assert/strict");
const {chromium,webkit} = require("playwright");
const {startServer} = require("./server.cjs");
const B = {chromium,webkit}[process.env.BROWSER || "chromium"];
if(!B)throw Error("Set BROWSER to chromium or webkit");
const CANON = "reconversion-control.snapshot.v3", LEGACY = "reconversion-control.state.v1";
const fixture = {version:2,progress:{dns:"mastered"},review:{},labs:{},proofs:{},labChecks:{},dailyFive:{days:{}}};
const buffer = {name:"synthetic-atomic-restore.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(fixture))};
async function run(){
 const server=await startServer(),browser=await B.launch({headless:true});
 const page=await browser.newPage();
 const dialogs=[]; page.on("dialog",async d=>{dialogs.push(d.message());await d.accept();});
 try {
  await page.goto(server.url + "/?noesis=fixture");
  await page.locator('#nav [data-view="library"]').click();
  await page.locator('[data-card="dns"] [data-prog="progress"]').click();
  await page.locator('#nav [data-view="privacy"]').click();
  const before=await page.evaluate(key=>localStorage.getItem(key),CANON);
  assert(before && JSON.parse(before).main.progress.dns==="progress","seeded V3 must exist");
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException("synthetic quota","QuotaExceededError");return original.call(this,k,v);};
    window.noesisRestore=()=>{Storage.prototype.setItem=original;};
  },CANON);
  await page.locator("#importer").setInputFiles(buffer);
  await page.waitForFunction(()=>document.querySelector("#importer").value==="");
  assert(dialogs.some(x=>/Import refusé/.test(x)),"quota must visibly refuse import");
  assert(!dialogs.some(x=>/instantané complet vérifié/.test(x)),"failed quota import must never announce a verified snapshot");
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),CANON),before,"failed commit cannot replace V3");
  await page.reload();
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).main.progress.dns,CANON),"progress","old state must survive restart");
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).daily.days&&typeof JSON.parse(localStorage.getItem(k)).daily.days,CANON),"object");
  console.log("PASS NOESIS-RCC-001 "+(process.env.BROWSER||"chromium")+" failed manual import does not acknowledge/quota erase V3, including reload");
  await page.locator('#nav [data-view="privacy"]').click();
  await page.locator("#importer").setInputFiles(buffer);
  await page.waitForFunction(()=>document.querySelector("#importer").value==="");
  assert(dialogs.some(x=>/instantané complet vérifié/.test(x)),"successful import must be acknowledged");
  await page.reload();
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).main.progress.dns,CANON),"mastered");
  console.log("PASS NOESIS-RCC-001 "+(process.env.BROWSER||"chromium")+" successful import survives restart");
  await page.locator('#nav [data-view="privacy"]').click();
  const rollbackBefore=await page.evaluate(k=>localStorage.getItem(k),CANON);
  await page.evaluate(key=>{
    const set=Storage.prototype.setItem,get=Storage.prototype.getItem;let writes=0,fail=false;
    Storage.prototype.setItem=function(k,v){const r=set.call(this,k,v);if(k===key&&++writes===2)fail=true;return r;};
    Storage.prototype.getItem=function(k){if(k===key&&fail){fail=false;throw Error("synthetic lost readback");}return get.call(this,k);};
  },CANON);
  const rollbackDialogs=dialogs.length;
  await page.locator("#importer").setInputFiles({...buffer,buffer:Buffer.from(JSON.stringify({...fixture,progress:{dns:"learn"}}))});
  await page.waitForFunction(()=>document.querySelector("#importer").value==="");
  assert(dialogs.slice(rollbackDialogs).some(x=>/Import refusé/.test(x)),"lost readback must refuse success");
  assert(!dialogs.slice(rollbackDialogs).some(x=>/instantané complet vérifié/.test(x)),"failed readback must never announce a verified snapshot");
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),CANON),rollbackBefore,"rollback restores every previous byte");
  await page.reload();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),CANON),rollbackBefore,"confirmed rollback survives reload");
  console.log("PASS NOESIS-RCC-001 "+(process.env.BROWSER||"chromium")+" lost readback restores complete prior state and rejects success");
  await page.locator('#nav [data-view="privacy"]').click();
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException("synthetic legacy quota","QuotaExceededError");return original.call(this,k,v);};
  },LEGACY);
  const beforeLegacyDialogs=dialogs.length;
  const fixture2={...fixture,progress:{dns:"learn"}};
  await page.locator("#importer").setInputFiles({...buffer,buffer:Buffer.from(JSON.stringify(fixture2))});
  await page.waitForFunction(()=>document.querySelector("#importer").value==="");
  assert(dialogs.slice(beforeLegacyDialogs).some(x=>/instantané complet vérifié/.test(x)),"legacy mirror failure must not undermine canonical write");
  await page.reload();
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).main.progress.dns,CANON),"learn");
  console.log("PASS NOESIS-RCC-001 "+(process.env.BROWSER||"chromium")+" legacy mirror failure cannot split authoritative state");
 }finally{await browser.close();await server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
