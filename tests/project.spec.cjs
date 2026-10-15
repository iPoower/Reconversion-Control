"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs/promises"),path=require("node:path");
const {chromium,webkit,devices}=require("playwright"),{startServer}=require("./server.cjs");
const KEY="reconversion-control.state.v1",DAILY="reconversion-control.daily-five.v1";
async function geometry(page){
 const g=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,short:[...document.querySelectorAll("button,input:not([type=file]),select,summary,a.btn")].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height;}).filter(el=>{const r=el.getBoundingClientRect();return r.width<43.5||r.height<43.5;}).map(el=>el.outerHTML.slice(0,100))}));
 assert(g.sw<=g.w+1,JSON.stringify(g));assert.deepEqual(g.short,[]);
}
async function main(){
 const server=await startServer(),browser=await ({chromium,webkit}[process.env.BROWSER||"chromium"]).launch();
 const context=await browser.newContext({...devices["iPhone 11 Pro Max"],serviceWorkers:"block",acceptDownloads:true});
 const page=await context.newPage(),errors=[],external=[];
 page.on("pageerror",e=>errors.push(e.message));page.on("request",r=>{if(!r.url().startsWith(server.url))external.push(r.url());});
 const dailySeed={days:{"2026-10-01":{sessionId:"d01",reason:"Rotation",missionDone:true}}};
 const seed={view:"cockpit",section:"all",search:"",status:"all",progress:{dns:"mastered","rc-02":"progress"},review:{dns:{step:0,due:"2099-01-01"}},labs:{"lab-01":"progress"},proofs:{"rc-25":{status:"progress",evidence:"Preuve historique"}},labChecks:{}};
 try{
  await context.addInitScript(({KEY,DAILY,seed,dailySeed})=>{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(seed));if(!localStorage.getItem(DAILY))localStorage.setItem(DAILY,JSON.stringify(dailySeed));},{KEY,DAILY,seed,dailySeed});
  await page.goto(server.url+"/#project");
  assert.equal(await page.locator("#app h2").first().textContent(),"Mon projet de reconversion");
  assert.equal(await page.locator("[data-project-answer]").count(),16);
  assert.equal(await page.locator("[data-project-drill]").count(),8);
  assert.match(await page.locator("#project-sources").textContent(),/28\/02\/2027/);
  const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  let state=await read();assert.deepEqual(state.progress,seed.progress);assert.deepEqual(state.proofs,seed.proofs);
  const profile={diploma:"Bac fictif",budgetMin:12000,budgetMax:13000,durationMonths:18,maxMonths:24,startMonth:"2027-03",history:'Histoire privée de test <img src=x onerror="alert(1)">'};
  const upload={name:"profile.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify({format:"reconversion-control.project.v1",profile}))};
  await page.locator("#project-profile-file").setInputFiles(upload);
  await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).career.profile.diploma==="Bac fictif",KEY);
  assert.equal(await page.locator("#project-profile img").count(),0);
  state=await read();assert.deepEqual(state.progress,seed.progress);assert.deepEqual(state.labs,seed.labs);assert.deepEqual(state.proofs,seed.proofs);
  console.log("PASS private profile import preserves all prior knowledge, labs and evidence; HTML stays inert");
  let form=page.locator('[data-project-answer="jedha:title"]');
  await form.locator("select").selectOption("verified");await form.locator("button").click();
  assert.match(await form.locator('[role="status"]').textContent(),/preuve et une date/);
  assert.equal((await read()).career.schools.jedha.answers.title,undefined);
  const otherDraft=page.locator('[data-project-answer="eni:title"] textarea');
  await otherDraft.fill("Brouillon ENI non encore enregistré");
  await form.locator("textarea").fill("Courriel test anonymisé");await form.locator('[type="date"]').fill("2026-10-15");await form.locator("button").click();
  assert.equal((await read()).career.schools.jedha.answers.title.status,"verified");
  assert.equal(await otherDraft.inputValue(),"Brouillon ENI non encore enregistré","saving one school must retain unsaved text in the other school");
  let drill=page.locator('[data-project-drill="linux"]');await drill.locator("select").selectOption("demonstrated");await drill.locator("button").click();
  assert.match(await drill.locator('[role="status"]').textContent(),/preuve et une date/);
  await drill.locator("textarea").fill("Manipulation expliquée sans aide");await drill.locator('[type="date"]').fill("2026-10-15");await drill.locator("button").click();
  state=await read();assert.equal(state.career.drills.linux.status,"demonstrated");assert.deepEqual(state.progress,seed.progress);
  const cost=page.locator('[data-project-cost="jedha"]');
  await cost.locator('[name="tuition"]').fill("11000");await cost.locator('[name="exam"]').fill("300");await cost.locator('[name="equipment"]').fill("500");await cost.locator('[name="travel"]').fill("200");await cost.locator("button").click();
  assert.match(await cost.locator(".project-budget-result").textContent(),/12\s000 €.*1\s000 €/);
  console.log("PASS school/drill evidence requires a date; budgets include all explicit costs, separate from financing");
  await page.locator('[data-project-task="quotes"]').selectOption("doing");await page.reload();
  assert.equal((await read()).career.tasks.quotes,"doing");
  await page.locator('[data-view="privacy"]').first().click();
  const downloaded=page.waitForEvent("download");await page.locator("#export").click();const download=await downloaded;
  const saved=JSON.parse(await fs.readFile(await download.path(),"utf8"));assert(saved.career.profile.history.includes("Histoire privée"));assert.equal(saved.career.schools.jedha.answers.title.status,"verified");
  page.on("dialog",d=>d.accept());
  const legacy={version:2,progress:seed.progress,review:seed.review,labs:seed.labs,proofs:seed.proofs,labChecks:{}};
  await page.locator("#importer").setInputFiles({name:"legacy.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(legacy))});
  await page.waitForTimeout(200);assert.deepEqual((await read()).career,saved.career,"legacy import must keep the new dossier");
  const before=await read();const malformed={...saved,progress:{dns:"learn"},career:{drills:{linux:{status:"demonstrated",date:"",evidence:""}}}};
  await page.locator("#importer").setInputFiles({name:"invalid.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(malformed))});
  await page.waitForTimeout(200);assert.deepEqual((await read()).progress,before.progress,"invalid dossier must reject the entire import atomically");
  await page.locator("#importer").setInputFiles({name:"new.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(saved))});
  await page.waitForTimeout(200);assert.deepEqual((await read()).career,saved.career);
  console.log("PASS new dossier round-trips through export/import; legacy import preserves it; invalid import is atomic");
  await page.goto(server.url+"/#project");
  for(const width of [320,414,1280]){
   await page.setViewportSize({width,height:900});await geometry(page);
   if(process.env.RC_SCREENSHOT_DIR){await fs.mkdir(process.env.RC_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.RC_SCREENSHOT_DIR,width+"-project-2027.png"),fullPage:false});}
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),DAILY),dailySeed,"project work must not change Daily Five");
  console.log("PASS project routes, touch targets, no overflow at 320/414/1280px, no unsolicited external requests");
 }finally{await context.close();await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
