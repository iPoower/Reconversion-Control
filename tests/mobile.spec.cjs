"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const {chromium, webkit, devices} = require("playwright");
const {startServer} = require("./server.cjs");
const KEY = "reconversion-control.state.v1";
const browserName = process.env.BROWSER || "chromium";
const browserType = {chromium, webkit}[browserName];
assert(browserType, "BROWSER must be chromium or webkit");
const profile = {...devices["iPhone 11 Pro Max"], serviceWorkers: "block", acceptDownloads: true};
let checks = 0;
function passed(name) { checks++; console.log("PASS " + name); }
async function visibleIds(page) { return page.locator("#cards .card:visible").evaluateAll(cards => cards.map(c => c.dataset.card).sort()); }
async function nav(page, view) { await page.locator('#nav [data-view="' + view + '"]').tap(); }
async function geometry(page, label) {
  const result = await page.evaluate(() => {
    const visible = el => { const r = el.getBoundingClientRect(); return r.width && r.height && getComputedStyle(el).display !== "none" && !el.closest("[hidden]"); };
    const controls = [...document.querySelectorAll("button, input:not([type=file]), select")].filter(visible);
    return {
      width: innerWidth, overflow: document.documentElement.scrollWidth,
      short: controls.map(el => ({label: el.textContent || el.id, rect: el.getBoundingClientRect().toJSON()})).filter(x => x.rect.height < 43.5 || x.rect.width < 43.5)
    };
  });
  assert(result.overflow <= result.width + 1, label + " must not overflow: " + JSON.stringify(result));
  assert.deepEqual(result.short, [], label + " touch controls must be at least 44 × 44 px");
}
async function main() {
  const server = await startServer();
  const browser = await browserType.launch({headless: true});
  const errors = [], external = [];
  const contexts = [];
  async function open(seed, options) {
    const context = await browser.newContext({...profile, ...options});
    contexts.push(context);
    if (seed) await context.addInitScript(({key, value}) => {if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));}, {key: KEY, value: seed});
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    page.on("request", request => { if (!request.url().startsWith(server.url + "/")) external.push(request.url()); });
    await page.goto(server.url + "/?v=2");
    return {context, page};
  }
  try {
    const {page} = await open();
    const headings = {cockpit: "🎯 Mission du jour", path: "Parcours recommandé", library: "Bibliothèque essentielle", review: "À revoir aujourd’hui", course: "Parcours de révision", labs: "🧪 Lab Mode", privacy: "Sources pédagogiques"};
    for (const [view, heading] of Object.entries(headings)) {
      await nav(page, view);
      assert.equal(await page.locator("#app h2").first().textContent(), heading);
      assert.equal(await page.locator('#nav [data-view="' + view + '"]').getAttribute("aria-current"), "page");
    }
    await nav(page, "cockpit");
    assert.equal(await page.locator(".mission-card").count(),3);
    assert.equal(await page.locator(".session-recipe span").count(),3);
    assert.equal(await page.locator(".portfolio-proofs .proof-card").count(),7);
    assert.equal(await page.locator(".interview-lab").count(),1);
    assert.equal(await page.locator(".study-pulse .pulse").count(),4);
    assert.match(await page.locator(".mission-card.english").textContent(),/English challenge/);
    await page.locator(".mission-card.primary [data-open]").tap();
    assert.equal(await page.locator("#detail .lesson-detail").getAttribute("data-lesson-id"),"rc-01");
    await page.locator("#close").tap();
    passed("cockpit turns progress into a three-action daily mission, interview lab and portfolio proofs");
    await page.locator('#app [data-view="path"]').tap();
    assert.equal(await page.locator(".career-track .career-stage").count(),6);
    assert.match(await page.locator(".career-track").textContent(),/Cloud \+ DevSecOps/);
    assert.equal(await page.locator("#app h2").first().textContent(), headings.path);
    passed("all seven navigation tabs and cockpit’s Voir le parcours work by touch");

    await nav(page, "labs");
    assert.equal(await page.locator(".lab-card").count(),15);
    assert.equal(await page.locator(".source-book").count(),10);
    assert.deepEqual(await page.evaluate(()=>({labs:RC_LABS.length,sources:RC_DRIVE_SOURCES.length})),{labs:15,sources:10});
    assert.equal(await page.locator('[data-lab-level="beginner"] .lab-card').count(),6);
    assert.equal(await page.locator('[data-lab-level="intermediate"] .lab-card').count(),6);
    assert.equal(await page.locator('[data-lab-level="pro"] .lab-card').count(),3);
    await page.locator("[data-lab-jump]").tap();
    assert.equal(await page.locator('[data-lab="lab-01"] details').evaluate(el=>el.open),true);
    assert.match(await page.locator('[data-lab="lab-01"]').textContent(),/Python Crash Course/);
    assert.match(await page.locator('[data-lab="lab-01"]').textContent(),/Explain it in English/);
    await page.locator('[data-lab="lab-01"] [data-prog="progress"]').tap();
    assert.match(await page.locator('[data-lab="lab-01"] .lab-status').textContent(),/EN COURS/);
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).progress.programming,KEY),"progress");
    const publicLabText=await page.locator(".drive-shelf").textContent();
    assert(!/drive\.google\.com|docs\.google\.com|[A-Za-z0-9_-]{25,}/.test(publicLabText),"public source shelf must not expose Drive URLs or IDs");
    passed("Drive-backed Lab Mode exposes 15 practical labs and 10 curated references without private Drive links");

    await nav(page, "library");
    const topics = await page.evaluate(() => RC_TOPICS.map(t => ({id:t.id, section:t.section, title:t.title})));
    assert.equal(topics.length, 74);
    assert.equal(topics.filter(t => !/^rc-\d{2}$/.test(t.id)).length, 42, "the original 42 topics stay available");
    const sections = await page.evaluate(() => RC_SECTIONS.map(s => s.id));
    assert.equal(sections.length, 9);
    for (const section of sections) {
      await page.locator('[data-section="' + section + '"]').tap();
      assert.deepEqual(await visibleIds(page), topics.filter(t => t.section === section).map(t => t.id).sort());
    }
    await page.locator('[data-section="all"]').tap();
    assert.equal((await visibleIds(page)).length, 74);
    passed("all nine domain tabs and Tout filter the actual cards");

    const search = page.locator("#search");
    await search.tap();
    await search.evaluate(el => {window.originalSearch = el;});
    await search.pressSequentially("reseau", {delay: 30});
    assert(await page.evaluate(() => document.querySelector("#search") === window.originalSearch && document.activeElement === window.originalSearch && window.originalSearch.selectionStart === 6));
    assert((await visibleIds(page)).includes("linux-net"), "accent-free query must match Réseau sous Linux");
    await search.fill("enumeration");
    assert((await visibleIds(page)).includes("recon"), "accent-free query must match énumération in its title");
    await search.fill("zzzz-no-such-topic");
    assert.equal((await visibleIds(page)).length, 0);
    assert.match(await page.locator("#cards").textContent(), /Aucune fiche/);
    await search.fill("");
    await search.pressSequentially("DNS", {delay: 20});
    assert((await visibleIds(page)).includes("dns"));
    assert(await page.evaluate(() => document.querySelector("#search") === window.originalSearch && document.activeElement === window.originalSearch));
    assert((await search.evaluate(el => parseFloat(getComputedStyle(el).fontSize))) >= 16, "search must not trigger iPhone focus zoom");
    passed("typing keeps one focused search input and matches accents without iPhone focus zoom");

    await search.fill("");
    for (const t of topics) {
      await page.locator('#cards [data-open="' + t.id + '"]').tap();
      assert.equal(await page.locator("#dlg").evaluate(el => el.open), true, "dialog should open for " + t.id + " · errors: " + errors.join(" | "));
      assert.equal(await page.locator("#detail h2").textContent(), t.title);
      assert.match(await page.locator("#detail").textContent(), /Question d’entretien/);
      await page.locator("#close").tap();
      assert.equal(await page.locator("#dlg").evaluate(el => el.open), false);
    }
    passed("all 74 fiche dialogs open the right content and close on iPhone");
    await page.locator('#cards [data-open="dns"]').tap();
    await page.locator('[data-dprog="mastered"]').tap();
    assert.equal(await page.locator("#dlg").evaluate(el => el.open), true);
    assert(await page.locator('[data-dprog="mastered"]').evaluate(el => el.classList.contains("on")));
    await page.locator("#close").tap();
    await page.reload();
    assert(await page.locator('#cards [data-card="dns"] [data-prog="mastered"]').evaluate(el => el.classList.contains("on")));
    passed("changing progress inside an open dialog keeps it usable and persists after reload");

    const seeded = await open({view:"library", section:"all", search:"", status:"all", progress:{"linux-fs":"progress", "linux-perms":"mastered", "dns":"progress"}, review:{"linux-perms":{step:0,due:"2099-01-01"}}});
    const filters = seeded.page;
    await filters.locator("#status").selectOption("progress");
    assert.deepEqual(await visibleIds(filters), ["dns", "linux-fs"]);
    await filters.locator("#search").fill("find");
    assert.deepEqual(await visibleIds(filters), ["linux-fs"]);
    await filters.locator('[data-section="linux"]').tap();
    assert.deepEqual(await visibleIds(filters), ["linux-fs"]);
    assert.equal(await filters.locator("#status").inputValue(), "progress");
    await filters.locator("#status").selectOption("mastered");
    assert.deepEqual(await visibleIds(filters), []);
    await filters.locator("#search").fill("");
    assert.deepEqual(await visibleIds(filters), ["linux-perms"]);
    await filters.locator('[data-card="linux-perms"] [data-prog="progress"]').tap();
    assert.deepEqual(await visibleIds(filters), []);
    await filters.reload();
    assert.equal(await filters.locator("#status").inputValue(), "mastered");
    assert.equal(await filters.locator('[data-section="linux"]').getAttribute("aria-pressed"), "true");
    assert.deepEqual(await visibleIds(filters), []);
    await filters.locator("#status").selectOption("progress");
    assert.deepEqual(await visibleIds(filters), ["linux-fs", "linux-perms"]);
    await nav(filters, "cockpit"); await nav(filters, "library");
    assert.deepEqual(await visibleIds(filters), ["linux-fs", "linux-perms"]);
    passed("query + domain + status compose, survive progress changes, reload and tab navigation");

    const stored = await filters.evaluate(key => localStorage.getItem(key), KEY);
    await nav(filters, "privacy");
    const alerts = [];
    filters.on("dialog", async dialog => {alerts.push(dialog.message()); await dialog.accept();});
    const invalid = [
      "not-json", JSON.stringify({version:2,progress:{},review:{}}),
      JSON.stringify({version:1,progress:{unknown:"mastered"},review:{}}),
      JSON.stringify({version:1,progress:{dns:"hacked"},review:{}}),
      JSON.stringify({version:1,progress:{dns:"mastered"},review:{dns:{step:0,due:"2026-02-31"}}}),
      JSON.stringify({version:1,progress:{dns:"mastered"},review:{dns:{step:9,due:"2026-10-04"}}}),
      JSON.stringify({version:1,progress:[],review:{}}),
      " ".repeat(1024 * 1024) + JSON.stringify({version:1,progress:{},review:{}})
    ];
    const beforeImport = await filters.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    for (const content of invalid) {
      const beforeCount = alerts.length;
      await filters.locator("#importer").setInputFiles({name:"invalid.json",mimeType:"application/json",buffer:Buffer.from(content)});
      await filters.waitForFunction(count => window.__unused || document.querySelector("#importer").value === "", beforeCount);
      assert(alerts.length > beforeCount && /invalide/i.test(alerts.at(-1)));
      const after = await filters.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      assert.deepEqual(after.progress, beforeImport.progress);
      assert.deepEqual(after.review, beforeImport.review);
    }
    passed("invalid or oversized imports cannot corrupt local progress");
    const valid = {version:1,progress:{dns:"mastered","linux-fs":"progress"},review:{dns:{step:2,due:"2099-10-04"}}};
    const [chooser] = await Promise.all([filters.waitForEvent("filechooser"), filters.locator("#import").tap()]);
    await chooser.setFiles({name:"progress.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(valid))});
    await filters.waitForFunction(() => document.querySelector("#importer").value === "");
    const imported = await filters.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    assert.deepEqual(imported.progress, valid.progress);
    assert.deepEqual(imported.review, valid.review);
    const [download] = await Promise.all([filters.waitForEvent("download"), filters.locator("#export").tap()]);
    const exported = JSON.parse(await fs.readFile(await download.path(), "utf8"));
    assert.equal(download.suggestedFilename(), "reconversion-control-progression.json");
    assert.equal(exported.version, 1);
    assert.deepEqual(exported.progress, valid.progress); assert.deepEqual(exported.review, valid.review);
    passed("Importer opens the file chooser; valid v1 import and export retain the same progression");

    const fileFallback = await browser.newContext(profile); contexts.push(fileFallback);
    await fileFallback.addInitScript(() => {File.prototype.text = undefined;});
    const filePage = await fileFallback.newPage(); filePage.on("pageerror", e => errors.push(e.message));
    filePage.on("dialog", dialog => dialog.accept());
    await filePage.goto(server.url + "/"); await nav(filePage,"privacy");
    const legacyImport = {progress:{dns:"mastered"},review:{dns:{step:1,due:"2099-01-01"}}};
    await filePage.locator("#importer").setInputFiles({name:"legacy.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(legacyImport))});
    await filePage.waitForFunction(() => document.querySelector("#importer").value === "");
    const viaReader = await filePage.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
    assert.deepEqual(viaReader.progress,legacyImport.progress); assert.deepEqual(viaReader.review,legacyImport.review);
    passed("legacy JSON imports through FileReader when File.text is unavailable");

    const blocked = await browser.newContext(profile); contexts.push(blocked);
    await blocked.addInitScript(() => {
      for (const method of ["getItem", "setItem", "removeItem"]) Storage.prototype[method] = function(){throw new DOMException("Storage blocked", "SecurityError");};
    });
    const blockedPage = await blocked.newPage(); blockedPage.on("pageerror", e => errors.push(e.message));
    await blockedPage.goto(server.url + "/?v=2");
    for (const view of Object.keys(headings)) {await nav(blockedPage, view); assert.equal(await blockedPage.locator("#app h2").first().textContent(), headings[view]);}
    await nav(blockedPage,"library"); await blockedPage.locator("#search").fill("DNS");
    await blockedPage.locator('[data-card="dns"] [data-prog="progress"]').tap();
    assert(await blockedPage.locator('[data-card="dns"] [data-prog="progress"]').evaluate(el => el.classList.contains("on")));
    await blockedPage.locator("#theme").tap();
    assert.equal(await blockedPage.locator("html").getAttribute("data-theme"), "light");
    assert(await blockedPage.locator("#storage-notice").isVisible());
    passed("blocked storage keeps navigation, search, progress and theme functional with a visible notice");

    const unreadable = await browser.newContext(profile); contexts.push(unreadable);
    const previousProgress = JSON.stringify({view:"library",section:"all",search:"",progress:{dns:"mastered"},review:{dns:{step:2,due:"2099-01-01"}}});
    await unreadable.addInitScript(({key,old})=>{
      const get=Storage.prototype.getItem;
      localStorage.setItem(key,old);
      let first=true;
      Storage.prototype.getItem=function(k){if(k===key && first){first=false;throw new DOMException("Temporary read failure","SecurityError");}return get.call(this,k);};
    },{key:KEY,old:previousProgress});
    const unreadPage=await unreadable.newPage(); unreadPage.on("pageerror",e=>errors.push(e.message));
    await unreadPage.goto(server.url+"/");
    await nav(unreadPage,"library");
    await unreadPage.locator('[data-card="dns"] [data-prog="progress"]').tap();
    await unreadPage.locator("#search").fill("DNS");
    await nav(unreadPage,"review");
    assert.equal(await unreadPage.evaluate(key=>localStorage.getItem(key),KEY),previousProgress);
    assert(await unreadPage.locator("#storage-notice").isVisible());
    passed("a temporary initial read failure never overwrites unread existing progression");

    const quota = await browser.newContext(profile); contexts.push(quota);
    const quotaPrevious = JSON.stringify({view:"library",section:"all",search:"",status:"all",progress:{dns:"learn"},review:{}});
    await quota.addInitScript(({key,old})=>{
      const set=Storage.prototype.setItem;
      localStorage.setItem(key,old);
      window.failProgressSave=true;
      Storage.prototype.setItem=function(k,v){if(k===key&&window.failProgressSave)throw new DOMException("Progression quota exceeded","QuotaExceededError");return set.call(this,k,v);};
    },{key:KEY,old:quotaPrevious});
    const quotaPage=await quota.newPage(); quotaPage.on("pageerror",e=>errors.push(e.message));
    quotaPage.on("request",request=>{if(!request.url().startsWith(server.url+"/"))external.push(request.url());});
    await quotaPage.goto(server.url+"/");
    await quotaPage.locator('[data-card="dns"] [data-prog="progress"]').tap();
    assert(await quotaPage.locator('[data-card="dns"] [data-prog="progress"]').evaluate(el=>el.classList.contains("on")));
    assert.equal(await quotaPage.evaluate(key=>localStorage.getItem(key),KEY),quotaPrevious);
    assert(await quotaPage.locator("#storage-notice").isVisible());
    await quotaPage.locator("#theme").tap();
    assert.equal(await quotaPage.evaluate(()=>localStorage.getItem("reconversion-control.theme")),"light");
    assert(await quotaPage.locator("#storage-notice").isVisible(),"a successful theme save must not conceal unsaved progression");
    await nav(quotaPage,"privacy");
    const [quotaDownload]=await Promise.all([quotaPage.waitForEvent("download"),quotaPage.locator("#export").tap()]);
    const quotaExport=JSON.parse(await fs.readFile(await quotaDownload.path(),"utf8"));
    assert.equal(quotaExport.progress.dns,"progress","export must retain unsaved in-memory progression");
    assert.equal(await quotaPage.evaluate(key=>localStorage.getItem(key),KEY),quotaPrevious);
    await nav(quotaPage,"library");
    await quotaPage.evaluate(()=>{window.failProgressSave=false;});
    await quotaPage.locator('[data-card="dns"] [data-prog="mastered"]').tap();
    assert.equal(await quotaPage.evaluate(key=>JSON.parse(localStorage.getItem(key)).progress.dns,KEY),"mastered");
    assert.equal(await quotaPage.locator("#storage-notice").isVisible(),false,"a successful progression save must clear its own storage failure");
    passed("a theme save cannot conceal failed progression persistence; export and recovery retain the latest progress");

    const legacy = await open({view:"library",section:"all",search:"",progress:{dns:"mastered"},review:{dns:{step:1,due:"2099-01-01"}}});
    assert(await legacy.page.locator('[data-card="dns"] [data-prog="mastered"]').evaluate(el => el.classList.contains("on")));
    passed("existing v1 local progression loads without new-field migration loss");

    const fallback = await browser.newContext(profile); contexts.push(fallback);
    await fallback.addInitScript(() => {HTMLDialogElement.prototype.showModal = undefined;});
    const fallbackPage = await fallback.newPage(); fallbackPage.on("pageerror", e => errors.push(e.message));
    await fallbackPage.goto(server.url + "/");
    await fallbackPage.locator('#app [data-open]').first().tap();
    assert.equal(await fallbackPage.locator("#dlg").getAttribute("open"), "");
    await fallbackPage.locator("#close").tap();
    assert.equal(await fallbackPage.locator("#dlg").getAttribute("open"), null);
    passed("fiche dialog also opens and closes when native showModal is unavailable");

    const paris = await browser.newContext({...profile,timezoneId:"Europe/Paris"}); contexts.push(paris);
    const midnight = await paris.newPage(); midnight.on("pageerror",e=>errors.push(e.message));
    await midnight.clock.install({time:new Date("2026-10-04T23:30:00Z")});
    await midnight.goto(server.url + "/"); await nav(midnight,"library");
    await midnight.locator('[data-card="dns"] [data-prog="mastered"]').tap();
    const dueDay=await midnight.evaluate(key=>JSON.parse(localStorage.getItem(key)).review.dns.due,KEY);
    assert.equal(dueDay,"2026-10-06","J+1 must follow the local calendar after midnight Paris time");
    passed("revision J+1 uses the iPhone’s local day around midnight");

    for (const viewport of [{width:320,height:568},{width:414,height:715},{width:414,height:896},{width:896,height:414},{width:1280,height:900}]) {
      const layout = await open({view:"cockpit",section:"all",search:"",status:"all",progress:{"race-cicd":"mastered", "linux-perms":"mastered"},review:{"race-cicd":{step:0,due:"2000-01-01"}, "linux-perms":{step:2,due:"2099-10-04"}}}, {viewport, screen:viewport, isMobile: viewport.width < 1000});
      for (const view of Object.keys(headings)) {
        await nav(layout.page, view);
        await geometry(layout.page, viewport.width + "×" + viewport.height + " " + view);
      }
      await nav(layout.page, "library");
      await layout.page.locator('[data-open="race-cicd"]').tap();
      await geometry(layout.page, viewport.width + "×" + viewport.height + " dialog");
      const bounds = await layout.page.locator("#dlg").boundingBox();
      assert(bounds.x >= -1 && bounds.x + bounds.width <= viewport.width + 1, "dialog must fit viewport");
      await layout.page.locator("#close").tap();
      passed(viewport.width + "×" + viewport.height + ": seven views and long fiche fit, every touch control ≥44 px");
    }
    assert.deepEqual(errors, [], "no unhandled JavaScript errors");
    assert.deepEqual(external, [], "the app must not request external services");
    assert(stored, "seeded persistence exists");
    passed("no JavaScript errors or external network requests");
    console.log(browserName + ": " + checks + "/" + checks + " mobile regression groups passed");
  } finally {
    await Promise.allSettled(contexts.map(c => c.close()));
    await browser.close(); await server.close();
  }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
