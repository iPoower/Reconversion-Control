"use strict";
const assert = require("node:assert/strict");
const {chromium, devices} = require("playwright");
const {startServer} = require("./server.cjs");
let checks = 0;
function passed(name) { checks++; console.log("PASS " + name); }
async function main() {
  // Playwright exposes actual service worker control in Chromium. WebKit's
  // application and iPhone interactions are covered by mobile.spec.cjs.
  const server = await startServer({basePath:"/Reconversion-Control/"});
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({...devices["iPhone 11 Pro Max"], serviceWorkers:"allow"});
  const errors = [];
  try {
    const control = await context.newPage();
    await control.goto(server.url + "/__test_control.html");
    const staleScript = "window.__staleReconversionScript = true;";
    server.responseOverrides.set("/Reconversion-Control/app.js", {
      body: staleScript,
      headers: {"Cache-Control":"public, max-age=3600"}
    });
    assert.equal(await control.evaluate(async () => (await fetch("./app.js")).text()), staleScript);
    server.responseOverrides.delete("/Reconversion-Control/app.js");
    const cachedRequestCount = server.requests.filter(r => r.path === "/Reconversion-Control/app.js" && !r.query).length;
    assert.equal(await control.evaluate(async () => (await fetch("./app.js", {cache:"force-cache"})).text()), staleScript);
    assert.equal(server.requests.filter(r => r.path === "/Reconversion-Control/app.js" && !r.query).length, cachedRequestCount, "the old file must really remain fresh in the HTTP cache");
    await control.evaluate(async () => {
      await (await caches.open("reconversion-control-v2")).put("./old-cache-marker", new Response("old"));
      await (await caches.open("race-control-private-cache")).put("/Race-Control/protected-marker", new Response("preserved"));
      await (await caches.open("another-app-cache")).put("/Other/protected-marker", new Response("also preserved"));
    });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(server.url + "/?v=2");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, {once:true}));
    });
    const keys = await page.evaluate(() => caches.keys());
    assert(!keys.includes("reconversion-control-v2"));
    assert(keys.includes("reconversion-control-v3"));
    assert(keys.includes("race-control-private-cache")); assert(keys.includes("another-app-cache"));
    assert.equal(await page.evaluate(async () => (await caches.match("/Race-Control/protected-marker")).text()), "preserved");
    passed("v3 activates, purges its v2 cache and preserves other applications’ caches");
    const entryPaths = await page.evaluate(async () => (await (await caches.open("reconversion-control-v3")).keys()).map(request => new URL(request.url).pathname));
    for (const file of ["index.html","app.js","data.js","style.css","manifest.webmanifest","assets/icon-192.png","assets/icon-512.png"]) assert(entryPaths.includes("/Reconversion-Control/" + file));
    passed("first installation precaches every file needed by the app");

    const installedScript = await page.evaluate(async () => (await (await (await caches.open("reconversion-control-v3")).match("./app.js")).text()));
    assert(!installedScript.includes("__staleReconversionScript"), "installation must replace a fresh HTTP-cached v2 script");
    await page.reload();
    assert.equal(await page.locator("#app h2").first().textContent(), "Knowledge Health");
    assert.equal(await page.evaluate(() => !!window.__staleReconversionScript), false);
    await page.locator('#nav [data-view="library"]').tap();
    assert.equal(await page.locator("#cards .card").count(), 42);
    await page.locator('#nav [data-view="cockpit"]').tap();
    passed("installation bypasses a still-fresh old HTTP script and the reloaded app retains all 42 fiches");

    await context.setOffline(true);
    await page.goto(server.url + "/?v=2");
    assert.equal(await page.locator("#app h2").first().textContent(), "Knowledge Health");
    await page.locator('#nav [data-view="library"]').tap();
    await page.locator("#search").fill("DNS");
    await page.locator('[data-open="dns"]').tap();
    assert.equal(await page.locator("#detail h2").textContent(), "DNS");
    await page.locator('[data-dprog="mastered"]').tap();
    await page.locator("#close").tap();
    await page.reload();
    assert(await page.locator('[data-card="dns"] [data-prog="mastered"]').evaluate(el => el.classList.contains("on")));
    passed("offline navigation with ?v=2 still supports fiche search, detail and saved progression");

    const aliases = await page.evaluate(async () => {
      const files = ["app.js?v=99","data.js?v=2","style.css?v=99","manifest.webmanifest?v=2","assets/icon-192.png?v=99"];
      return Promise.all(files.map(async file => {const response=await fetch(file);return {file,status:response.status,type:response.headers.get("content-type"),body:(await response.text()).slice(0,80)};}));
    });
    for (const alias of aliases) { assert.equal(alias.status,200); assert(!/^\s*<!doctype html/i.test(alias.body), "assets must never receive HTML fallback"); }
    assert.match(aliases[0].type,/javascript/); assert.match(aliases[2].type,/css/);
    passed("versioned assets reuse cached originals offline without receiving HTML");

    const unknownOffline = await page.evaluate(async () => {try{const r=await fetch("missing-script.js?v=2");return {ok:r.ok,body:await r.text()};}catch{return {failed:true};}});
    assert(unknownOffline.failed || (!unknownOffline.ok && !/^\s*<!doctype html/i.test(unknownOffline.body)));
    passed("an unknown offline script fails instead of returning the app HTML");

    await context.setOffline(false);
    server.failures.set("/Reconversion-Control/",503);
    await page.goto(server.url + "/?v=2");
    assert.equal(await page.locator("#app h2").first().textContent(), "Bibliothèque essentielle");
    assert(await page.locator('[data-card="dns"] [data-prog="mastered"]').evaluate(el => el.classList.contains("on")));
    passed("a 503 navigation uses the existing offline app and preserves local progress");
    server.failures.clear();
    const cacheBefore = await page.evaluate(async () => (await (await caches.open("reconversion-control-v3")).keys()).map(r=>r.url).sort());
    const outsideScope = await page.evaluate(async () => {const r=await fetch("/Other/unknown-script.js");return {status:r.status,type:r.headers.get("content-type"),body:await r.text()};});
    assert.equal(outsideScope.status,404); assert(!/^\s*<!doctype html/i.test(outsideScope.body));
    const missing = await page.evaluate(async () => {const r=await fetch("missing-script.js");return {status:r.status,type:r.headers.get("content-type"),body:await r.text()};});
    assert.equal(missing.status,404); assert(!/^\s*<!doctype html/i.test(missing.body));
    const cacheAfter = await page.evaluate(async () => (await (await caches.open("reconversion-control-v3")).keys()).map(r=>r.url).sort());
    assert.deepEqual(cacheAfter,cacheBefore);
    passed("out-of-scope requests and unknown assets are not intercepted or cached");
    assert.deepEqual(errors,[]);
    passed("real service worker operation causes no JavaScript errors");
    console.log("chromium service worker: " + checks + "/" + checks + " groups passed");
  } finally {
    await context.close(); await browser.close(); await server.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
