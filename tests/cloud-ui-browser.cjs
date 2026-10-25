"use strict";
const assert = require("node:assert/strict");
const PHRASE = "fictional-browser-test-phrase";
const KEY = "reconversion-control.state.v1";
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return {promise, resolve}; };

// Real application, DOM, persistence and AES-GCM; provider requests stay inside
// Playwright routes. No account, email delivery or external service is used.
async function run(browser, server) {
  for (const kind of ["first", "automatic", "choice"]) {
    const context = await browser.newContext({serviceWorkers: "block"});
    let row = null, gate = null, writes = 0;
    const unexpected = [], errors = [];
    try {
      if (kind === "first") await context.addInitScript(key => localStorage.setItem(key, JSON.stringify({version: 2, progress: {dns: "progress"}})), KEY);
      await context.route("**/*", async route => {
        const req = route.request(), url = new URL(req.url());
        if (url.origin === server.origin) return route.continue();
        if (url.origin !== "https://fixture.supabase.co") { unexpected.push(req.url()); return route.abort(); }
        const reply = (status, body) => route.fulfill({status, contentType: "application/json", headers: {"access-control-allow-origin": server.origin, "access-control-allow-methods": "GET,POST,PATCH,OPTIONS", "access-control-allow-headers": "apikey,authorization,content-type,prefer"}, body: JSON.stringify(body)});
        if (req.method() === "OPTIONS") return reply(200, {});
        if (url.pathname === "/auth/v1/otp") return reply(200, {});
        if (url.pathname === "/auth/v1/verify") return reply(200, {access_token: "fixture-token", refresh_token: "fixture-refresh", expires_in: 3600, user: {id: "00000000-0000-4000-8000-000000000001"}});
        if (url.pathname !== "/rest/v1/reconversion_progress") { unexpected.push(req.url()); return route.abort(); }
        if (req.method() === "GET") return reply(200, row ? [url.searchParams.get("select")==="revision"?{revision:row.revision}:row] : []);
        if (req.method() === "POST" || req.method() === "PATCH") {
          const body = req.postDataJSON(), initial = req.method() === "POST";
          if ((initial && row) || (!initial && (!row || url.searchParams.get("revision") !== "eq." + row.revision))) return reply(409, {});
          if (gate) { const held = gate; gate = null; held.started.resolve(); await held.release.promise; }
          row = {revision: initial ? 1 : row.revision + 1, payload: body.payload}; writes++;
          return reply(200, [row]);
        }
        unexpected.push(req.url()); return route.abort();
      });
      const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message));
      await page.goto(server.url + "/#privacy");await require("./private-device.cjs").enter(page);
      await require("./private-device.cjs").legacyEmail(page);
      await page.locator("#rc-sync-url").fill("https://fixture.supabase.co");
      await page.locator("#rc-sync-key").fill("sb_publishable_fixture");
      await page.locator("#rc-sync-email").fill("fixture@example.invalid");
      await page.locator("#rc-sync-request").click();
      await page.locator("#rc-sync-otp").fill("123456");
      await page.locator("#rc-sync-phrase").fill(PHRASE);
      const edit = async value => {
        await page.locator('#nav [data-view="library"]').click();
        await page.locator('[data-id="dns"][data-prog="' + value + '"]').click();
        await page.locator('#nav [data-view="privacy"]').click();
      };
      const open = payload => page.evaluate(({payload, phrase}) => RC_CLOUD_TRANSPORT.open(payload, phrase), {payload, phrase: PHRASE});
      if (kind === "choice") row = {revision: 4, payload: await page.evaluate(phrase => RC_CLOUD_TRANSPORT.seal({version: 2, progress: {dns: "learn"}, review: {}, labs: {}, proofs: {}, labChecks: {}, dailyFive: {days:{}}, career: RC_PROJECT_PLAN.empty()}, phrase), PHRASE)};
      await page.evaluate(() => document.querySelector("#rc-sync-verify").onclick());
      if(kind === "automatic") { page.once("dialog", dialog => dialog.accept()); await page.evaluate(() => document.querySelector("#rc-sync-create").onclick()); }
      if (kind !== "first") await edit("progress");
      const held = {started: deferred(), release: deferred()}; gate = held;
      const selector = "#rc-sync-" + (kind === "first" ? "create" : kind === "choice" ? "push" : "now");
      page.on("dialog", dialog => dialog.accept());
      const sending = page.evaluate(selector => document.querySelector(selector).onclick(), selector);
      let deadline;
      try { await Promise.race([held.started.promise, new Promise((_, reject) => { deadline = setTimeout(() => reject(Error("Upload did not reach the mocked provider")), 15000); })]); }
      finally { clearTimeout(deadline); }
      await edit("mastered"); held.release.resolve(); await sending;
      assert.equal((await open(row.payload)).progress.dns, "progress", kind + ": sent snapshot stays fixed");
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).progress.dns, KEY), "mastered");
      assert.match(await page.locator("#rc-sync-status").textContent(), /restent à synchroniser/);
      if (kind === "automatic") {
        const incoming = await page.evaluate(async ({phrase, payload}) => { const data = await RC_CLOUD_TRANSPORT.open(payload, phrase); data.progress.dns = "learn"; return RC_CLOUD_TRANSPORT.seal(data, phrase); }, {phrase: PHRASE, payload: row.payload});
        row = {revision: row.revision + 1, payload: incoming};
        await page.evaluate(() => document.querySelector("#rc-sync-now").onclick());
        assert.match(await page.locator("#rc-sync-status").textContent(), /Conflit détecté/);
        assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).progress.dns, KEY), "mastered");
        await page.evaluate(() => document.querySelector("#rc-sync-push").onclick());
      } else {
        const previous = writes;
        await page.waitForFunction(() => document.querySelector("#rc-sync-status").textContent.includes("Modifications locales sauvegardées"), null, {timeout: 10000});
        assert.equal(writes, previous + 1, kind + ": pending edit is automatically retried");
      }
      assert.equal((await open(row.payload)).progress.dns, "mastered");
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).progress.dns, KEY), "mastered");
      await page.evaluate(() => document.querySelector("#rc-sync-now").onclick());
      assert.match(await page.locator("#rc-sync-status").textContent(), /À jour sur cet appareil et dans le cloud/);
      assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
      console.log("PASS N03 browser " + kind + ": real crypto, concurrent edit, preserved persistence and subsequent synchronization (mock provider)");
    } finally {
      if (gate) gate.release.resolve();
      await context.close();
    }
  }
}
module.exports = {run};
