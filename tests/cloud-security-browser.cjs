"use strict";
// Actual CSP and crypto in an isolated browser; no provider connection.
const assert=require("node:assert/strict"),{chromium,webkit}=require("playwright"),{startServer}=require("./server.cjs");
const B={chromium,webkit}[process.env.BROWSER||"chromium"],CANON="reconversion-control.snapshot.v3";
async function run(){
 const server=await startServer(),browser=await B.launch({headless:true}),context=await browser.newContext({serviceWorkers:"block"});
 const unexpected=[],errors=[];
 try{
  await context.route("**/*",route=>{if(new URL(route.request().url()).origin===server.origin)return route.continue();unexpected.push(route.request().url());return route.abort();});
  const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));await page.goto(server.url+"/#privacy");await require("./private-device.cjs").enter(page);
  await page.waitForFunction(k=>!!localStorage.getItem(k),CANON);
  const before=await page.evaluate(k=>localStorage.getItem(k),CANON);
  const policy=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  assert.equal(policy.split(";").map(s=>s.trim()).find(s=>s.startsWith("script-src ")),"script-src 'self'");
  const refused=await page.evaluate(async()=>{
   const phrase="FICTIVE-security-browser-phrase-2026",T=RC_CLOUD_TRANSPORT,p=await T.seal({fixture:"security-only"},phrase);
   let n=0;for(const field of ["v","kdf","iterations","salt","iv","ciphertext"]){try{await T.open({...p,[field]:null},phrase);}catch{n++;}}
   try{await T.openSession(p,phrase);}catch{n++;}
   return n;
  });
  assert.equal(refused,7);assert.equal(await page.evaluate(k=>localStorage.getItem(k),CANON),before);
  const originalBase=await page.evaluate(()=>document.baseURI);
  await page.evaluate(()=>{
   window.__noesisCspEvents=[];document.addEventListener("securitypolicyviolation",e=>window.__noesisCspEvents.push(e.effectiveDirective));
   const inline=document.createElement("script");inline.textContent="window.__noesisInlineExecuted=true;";document.body.append(inline);
   const external=document.createElement("script");external.src="https://untrusted.example.invalid/blocked.js";document.body.append(external);
   const base=document.createElement("base");base.href="https://untrusted.example.invalid/";document.head.append(base);
  });
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.evaluate(()=>window.__noesisInlineExecuted===true),false);
  assert.equal(await page.evaluate(()=>document.baseURI),originalBase);
  assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),CANON),before);
  console.log("PASS browser security: inline/external script injection and foreign base blocked; null crypto fields and cross-domain decryption refused; local snapshot unchanged.");
 }finally{await context.close();await browser.close();await server.close();}
}
const watchdog=setTimeout(()=>{throw Error("Security browser suite stalled");},60000);
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>clearTimeout(watchdog));
