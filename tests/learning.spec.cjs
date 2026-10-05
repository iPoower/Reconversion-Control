"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const {chromium, webkit, devices} = require("playwright");
const {startServer} = require("./server.cjs");
const KEY = "reconversion-control.state.v1";
const browserName = process.env.BROWSER || "chromium";
const browserType = {chromium, webkit}[browserName];
assert(browserType, "BROWSER must be chromium or webkit");
const profile = {...devices["iPhone 11 Pro Max"], serviceWorkers:"block", acceptDownloads:true};
const chapterIds = Array.from({length:32}, (_, i) => "rc-" + String(i + 1).padStart(2, "0"));
const studyIds = ["rc-01","rc-03","rc-04","rc-05","rc-06","rc-07","rc-02","rc-08","rc-09","rc-10","rc-11","rc-12","rc-13","rc-14","rc-15","rc-16","rc-18","rc-17","rc-19","rc-20","rc-21","rc-22","rc-24","rc-23","rc-29","rc-25","rc-26","rc-27","rc-28","rc-30","rc-31","rc-32"];
let checks = 0;
function passed(name) {checks++; console.log("PASS " + name);}
async function nav(page, view) {await page.locator('#nav [data-view="' + view + '"]').tap();}
async function openChapter(page, id) {
  const opener = page.locator('[data-open="' + id + '"]').first();
  const level = opener.locator("xpath=ancestor::details[1]");
  if (await level.count() && !(await level.evaluate(el=>el.open))) await level.locator("summary").first().tap();
  await opener.tap();
}
async function geometry(page, label) {
  const result = await page.evaluate(() => {
    const visible = el => {const r=el.getBoundingClientRect();return r.width && r.height && getComputedStyle(el).display !== "none" && !el.closest("[hidden]");};
    return {
      width:innerWidth,
      overflow:document.documentElement.scrollWidth,
      short:[...document.querySelectorAll("button, input:not([type=file]), select, summary")].filter(visible).map(el=>({label:el.textContent || el.id, rect:el.getBoundingClientRect().toJSON()})).filter(x=>x.rect.width < 43.5 || x.rect.height < 43.5)
    };
  });
  assert(result.overflow <= result.width + 1, label + " must fit without horizontal overflow");
  assert.deepEqual(result.short, [], label + " touch controls, including answers, must be at least 44 × 44 px");
}
async function main() {
  const server = await startServer();
  const browser = await browserType.launch({headless:true});
  const contexts = [], errors = [], external = [];
  async function open(seed, options = {}) {
    const context = await browser.newContext({...profile, ...options});
    contexts.push(context);
    if(seed) await context.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));},{key:KEY,value:seed});
    const page = await context.newPage();
    page.on("pageerror",e=>errors.push(e.message));
    page.on("request",request=>{if(!request.url().startsWith(server.url + "/"))external.push(request.url());});
    await page.goto(server.url + "/?v=2");
    return {context,page};
  }
  try {
    const {page} = await open();
    await nav(page,"course");
    assert.equal(await page.locator("#app h2").first().textContent(),"Parcours de révision");
    assert.deepEqual(await page.locator("#course-chapters [data-card]").evaluateAll(cards=>cards.map(c=>c.dataset.card)),studyIds);
    assert.deepEqual(await page.locator("[data-course-level]").evaluateAll(levels=>levels.map(level=>level.dataset.courseLevel)),["beginner","intermediate","pro"]);
    assert.equal(await page.locator('[data-course-level="beginner"]').evaluate(el=>el.open),true);
    assert.equal(await page.locator('[data-course-level="intermediate"]').evaluate(el=>el.open),false);
    assert.equal(await page.locator('[data-course-level="pro"]').evaluate(el=>el.open),false);
    assert.match(await page.locator('[data-level-card="beginner"]').textContent(),/Débutant|DÉBUTANT/);
    assert.match(await page.locator('[data-level-card="intermediate"]').textContent(),/Intermédiaire|INTERMÉDIAIRE/);
    assert.match(await page.locator('[data-level-card="pro"]').textContent(),/Pro|PRO/);
    assert.equal(await page.evaluate(()=>RC_TOPICS.length),74);
    assert.equal(await page.evaluate(()=>RC_SECTIONS.length),9);
    passed("the course presents 32 chapters in a beginner, intermediate and pro hierarchy");

    assert.match(await page.locator('[data-card="rc-03"] .src').textContent(),/ÉTAPE 2/);
    assert.match(await page.locator('[data-card="rc-02"] .src').textContent(),/ÉTAPE 7/);
    assert.match(await page.locator('[data-card="rc-29"] .src').textContent(),/ÉTAPE 25/);
    assert.deepEqual(await page.locator('[data-course-level="beginner"] .study-phase h3').evaluateAll(nodes=>nodes.map(n=>n.textContent)),["Vue d’ensemble","Bases du Web","Travailler comme un développeur"]);
    passed("study order follows prerequisites rather than source chapter numbers");

    const beginnerDone = Object.fromEntries(studyIds.slice(0,9).map(id=>[id,"mastered"]));
    const staged = await open({view:"course",section:"all",search:"",status:"all",progress:beginnerDone,review:{}});
    assert.match(await staged.page.locator('[data-level-card="beginner"]').textContent(),/TERMINÉ/);
    assert.match(await staged.page.locator('[data-level-card="intermediate"]').textContent(),/NIVEAU ACTIF/);
    assert.match(await staged.page.locator('[data-level-card="pro"]').textContent(),/À VENIR/);
    assert.equal(await staged.page.locator('[data-course-level="beginner"]').evaluate(el=>el.open),false);
    assert.equal(await staged.page.locator('[data-course-level="intermediate"]').evaluate(el=>el.open),true);
    assert.equal(await staged.page.locator('[data-course-level="pro"]').evaluate(el=>el.open),false);
    assert.match(await staged.page.locator(".hero").textContent(),/INTERMÉDIAIRE/);
    passed("finishing beginner automatically promotes intermediate as the active level");

    const interviews = new Set(), exercises = new Set();
    for(const id of studyIds) {
      await openChapter(page,id);
      const detail = page.locator("#detail .lesson-detail");
      assert.equal(await detail.count(),1,id + " must show a real lesson rather than the old generic template");
      assert((await detail.locator(".lesson-goals li").count()) > 0,id + " learning goals must be visible");
      assert((await detail.locator(".lesson-sections section").count()) > 0,id + " must contain explanations");
      const body = await detail.textContent();
      assert(body.length > 600,id + " must provide substantive explanations, not only a card summary");
      assert.match(body,/Question d[’']entretien/);
      assert.match(body,/Exercice/);
      assert.match(body,/prod[- ]?15/i,id + " must identify its historical baseline");
      const citations = detail.locator('[data-source-id="course-prod15"]');
      assert((await citations.count()) > 0,id + " must cite the supplied course");
      assert.match(await citations.first().textContent(),/(?:p\.|page)/i,id + " citation must include a page reference");
      const answers = detail.locator("details.answer");
      assert((await answers.count()) >= 2,id + " needs separate interview and exercise corrections");
      for(let i=0;i<2;i++) {
        const answer = answers.nth(i);
        assert.equal(await answer.evaluate(el=>el.open),false,"answers should start folded so the learner can try first");
        const fullText = await answer.textContent();
        assert(fullText.length > 80,id + " requires a useful correction");
        if(i===0)interviews.add(fullText);else exercises.add(fullText);
        await answer.locator("summary").tap();
        assert.equal(await answer.evaluate(el=>el.open),true);
        await answer.locator("summary").tap();
        assert.equal(await answer.evaluate(el=>el.open),false);
      }
      await page.locator("#close").tap();
    }
    assert.equal(interviews.size,32,"interview answers must be specific to the chapter");
    assert.equal(exercises.size,32,"exercise corrections must be specific to the chapter");
    passed("every chapter has explanations, page citations and its own touch-accessible folded corrections");

    await page.locator('#course-chapters [data-open="rc-01"]').tap();
    assert.equal(await page.locator('#detail [data-open="rc-00"]').count(),0);
    await page.locator('#detail .chapter-navigation [data-open="rc-03"]').tap();
    assert.equal(await page.locator("#detail .lesson-detail").getAttribute("data-lesson-id"),"rc-03");
    assert.equal(await page.locator("#dlg").evaluate(el=>el.open),true);
    assert(await page.locator("#detail-title").evaluate(el=>el===document.activeElement),"a chapter transition must focus the new heading, not a removed button");
    assert.equal(await page.locator(".dialogbox").evaluate(el=>el.scrollTop),0);
    await page.locator('#detail .chapter-navigation [data-open="rc-01"]').tap();
    assert.equal(await page.locator("#detail .lesson-detail").getAttribute("data-lesson-id"),"rc-01");
    await page.locator("#close").tap();
    assert(await page.locator('#course-chapters [data-open="rc-01"]').evaluate(el=>el===document.activeElement));
    passed("next and previous chapter navigation keeps the dialog, resets reading position and restores the course opener");

    await openChapter(page,"rc-32");
    assert.equal(await page.locator("#detail .lesson-quiz .quiz-item").count(),12);
    assert.equal(await page.locator("#detail .lesson-glossary dt").count(),42);
    const lastAnswer=page.locator("#detail .lesson-quiz details.answer").last();
    assert.equal(await lastAnswer.evaluate(el=>el.open),false);
    await lastAnswer.locator("summary").tap();
    assert.match(await lastAnswer.textContent(),/app\.js/);
    await page.locator("#close").tap();
    await nav(page,"library");
    await page.locator("#search").fill("idempotence");
    assert(await page.locator('[data-card="rc-32"]').isVisible(),"the glossary must be discoverable beyond chapter title and tags");
    await page.locator("#search").fill("");
    await nav(page,"course");
    passed("all twelve revision answers unfold independently and the 42-term glossary is searchable");

    await openChapter(page,"rc-06");
    const asyncText = await page.locator("#detail .lesson-sections").textContent();
    const metadata = await page.evaluate(()=>{const t=RC_TOPICS.find(t=>t.id==="rc-06");return (t.title+" "+t.summary+" "+t.tags.join(" ")).toLowerCase();});
    const bodyToken = ["AbortController","clearTimeout","setTimeout"].find(token=>asyncText.includes(token) && !metadata.includes(token.toLowerCase()));
    assert(bodyToken,"the asynchronous lesson must teach a cancellation/timeout mechanism beyond its card metadata");
    await page.locator("#close").tap();
    await nav(page,"library");
    await page.locator('[data-section="all"]').tap();
    const search = page.locator("#search");
    await search.tap();
    await search.evaluate(el=>{window.originalLessonSearch=el;});
    await search.pressSequentially(bodyToken,{delay:15});
    assert(await page.locator('[data-card="rc-06"]').isVisible(),"search must find text from the lesson body");
    assert(await page.evaluate(()=>document.querySelector("#search")===window.originalLessonSearch && document.activeElement===window.originalLessonSearch));
    await search.fill("zzzz-no-such-lesson");
    assert.equal(await page.locator("#cards .card").count(),0);
    await search.fill(bodyToken.toLowerCase());
    assert(await page.locator('[data-card="rc-06"]').isVisible());
    await openChapter(page,"rc-06");
    assert.match(await page.locator("#detail .lesson-sections").textContent(),new RegExp(bodyToken));
    await page.locator("#close").tap();
    assert(await page.locator('[data-open="rc-06"]').evaluate(el=>el===document.activeElement));
    passed("full-text search finds lesson code absent from card metadata and preserves typing focus");

    await nav(page,"privacy");
    assert.equal(await page.locator("#support-coverage .support[data-support-id]").count(),7);
    const supportText = await page.locator("#support-coverage").textContent();
    assert.match(supportText,/39/);
    assert.match(supportText,/31/);
    assert.match(supportText,/chiffr[ée]/i);
    assert.match(supportText,/hors|exclu|non intégré|non int[ée]gr[ée]|pas un support/i);
    assert.match(supportText,/doublon|m[êe]me dossier|format alternatif/i);
    assert.match(supportText,/historique|archive|instantan[ée]/i);
    assert.equal(await page.locator('#support-coverage [data-support-id="backup-private"]').getAttribute("data-support-status"),"excluded");
    assert.equal(await page.locator('#support-coverage [data-support-id="dossier-prod15-docx"]').getAttribute("data-support-status"),"duplicate");
    assert.equal(await page.locator('#support-coverage [data-support-id="architecture-prod8"]').getAttribute("data-support-status"),"historical");
    assert.equal(await page.locator('#support-coverage a[href*=".pdf"], #support-coverage a[href*=".docx"], #support-coverage a[href*="sauvegarde"]').count(),0);
    passed("all seven supplied files are accounted for, with duplicates, historical versions and encrypted backup limits explicit");

    await nav(page,"course");
    await openChapter(page,"rc-30");
    const roadmap = await page.locator("#detail .lesson-detail").textContent();
    assert.match(roadmap,/roadmap|futur|non livr[ée]|pas livr[ée]/i);
    assert.match(roadmap,/prod[- ]?15/i);
    assert.match(roadmap,/trafic|tenue|dayplan|Race Engineer/i);
    await page.locator("#close").tap();
    await nav(page,"library");
    await search.fill("");
    await openChapter(page,"dns");
    assert.match(await page.locator("#detail").textContent(),/rep[èe]re.*compl[ée]ter|support.*manqu|pas.*cours.*d[ée]taill[ée]/i,"the Race Control PDFs must not imply that a complete DNS course was provided");
    await page.locator("#close").tap();
    await openChapter(page,"crypto");
    assert((await page.locator("#detail .related-lessons [data-open]").count()) > 0,"a supported original fiche must link to the relevant expanded lesson");
    await page.locator("#detail .related-lessons [data-open]").first().tap();
    assert.equal(await page.locator("#detail .lesson-detail").count(),1);
    await page.locator("#close").tap();
    passed("roadmap stays dated and missing theory remains explicit; original fiches link to relevant course chapters");

    const seeded = await open({view:"course",section:"all",search:"",status:"all",progress:{dns:"mastered","rc-06":"progress"},review:{dns:{step:1,due:"2099-01-01"}}});
    const learning = seeded.page;
    assert.equal(await learning.locator("#course-chapters").count(),1,"the course view must reload from the existing v1 storage format");
    assert(await learning.locator('[data-card="rc-06"] [data-prog="progress"]').evaluate(el=>el.classList.contains("on")));
    await openChapter(learning,"rc-06");
    await learning.locator('[data-dprog="mastered"]').tap();
    assert.equal(await learning.locator("#dlg").evaluate(el=>el.open),true);
    await learning.locator("#close").tap();
    await learning.reload();
    assert(await learning.locator('[data-card="rc-06"] [data-prog="mastered"]').evaluate(el=>el.classList.contains("on")));
    const mixed = await learning.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
    assert.equal(mixed.progress.dns,"mastered");
    assert.equal(mixed.progress["rc-06"],"mastered");
    assert(mixed.review["rc-06"] && /^\d{4}-\d{2}-\d{2}$/.test(mixed.review["rc-06"].due));
    await nav(learning,"privacy");
    const [download] = await Promise.all([learning.waitForEvent("download"),learning.locator("#export").tap()]);
    const exported = JSON.parse(await fs.readFile(await download.path(),"utf8"));
    assert.equal(exported.version,1);
    assert.deepEqual(exported.progress,mixed.progress);
    assert.deepEqual(exported.review,mixed.review);
    assert(!("sources" in exported) && !("lessons" in exported),"a progression backup must not export uploaded documents or course files");
    passed("new course progress and old DNS progress coexist, persist and export through the unchanged v1 format");

    const alerts = [];
    learning.on("dialog",async dialog=>{alerts.push(dialog.message());await dialog.accept();});
    await learning.locator("#importer").setInputFiles({name:"progression.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(exported))});
    await learning.waitForFunction(()=>document.querySelector("#importer").value==="");
    const restored = await learning.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
    assert.deepEqual(restored.progress,mixed.progress); assert.deepEqual(restored.review,mixed.review);
    const oldBackup = {progress:{dns:"progress"},review:{}};
    await learning.locator("#importer").setInputFiles({name:"legacy.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(oldBackup))});
    await learning.waitForFunction(()=>document.querySelector("#importer").value==="");
    assert.deepEqual(await learning.evaluate(key=>JSON.parse(localStorage.getItem(key)).progress,KEY),oldBackup.progress);
    await learning.locator("#importer").setInputFiles({name:"progression.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(exported))});
    await learning.waitForFunction(()=>document.querySelector("#importer").value==="");
    const beforeEncryptedImport = await learning.evaluate(key=>localStorage.getItem(key),KEY);
    const beforeAlerts = alerts.length;
    // Shape-only synthetic fixture: no ciphertext, coordinates or original backup.
    await learning.locator("#importer").setInputFiles({name:"race-control-backup.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify({app:"Race Control",v:1,kdf:"PBKDF2",it:600000,s:"synthetic",i:"synthetic",c:"synthetic"}))});
    await learning.waitForFunction(()=>document.querySelector("#importer").value==="");
    assert(alerts.length>beforeAlerts && /invalide/i.test(alerts.at(-1)));
    assert.equal(await learning.evaluate(key=>localStorage.getItem(key),KEY),beforeEncryptedImport);
    passed("course v1 backups and legacy progress import; an encrypted Race Control-shaped backup is rejected without corruption");

    const revision = await open({view:"review",progress:{dns:"mastered","rc-06":"mastered"},review:{dns:{step:0,due:"2000-01-01"},"rc-06":{step:0,due:"2000-01-01"}}});
    await revision.page.locator('[data-good="rc-06"]').tap();
    const reviewed = await revision.page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
    assert.equal(reviewed.review["rc-06"].step,1);
    assert.equal(reviewed.review.dns.due,"2000-01-01");
    assert.equal(await revision.page.locator('[data-good="rc-06"]').count(),0);
    assert.equal(await revision.page.locator('[data-good="dns"]').count(),1);
    passed("spaced revision advances a new chapter without changing an existing fiche’s schedule");

    for(const viewport of [{width:320,height:568},{width:414,height:896},{width:1280,height:900}]) {
      const layout = await open(undefined,{viewport,screen:viewport,isMobile:viewport.width<1000});
      await nav(layout.page,"course");
      await geometry(layout.page,viewport.width+" course");
      await openChapter(layout.page,"rc-30");
      const details = layout.page.locator("#detail details.answer");
      await details.first().locator("summary").tap();
      await geometry(layout.page,viewport.width+" lesson and expanded correction");
      const bounds = await layout.page.locator("#dlg").boundingBox();
      assert(bounds.x>=-1 && bounds.x+bounds.width<=viewport.width+1,"long lessons must fit the viewport");
      await layout.page.locator("#close").tap();
      await nav(layout.page,"privacy");
      await geometry(layout.page,viewport.width+" source coverage");
      passed(viewport.width+" px: course, long corrected lesson and seven-file source inventory fit with ≥44 px touch targets");
    }
    assert.deepEqual(errors,[],"no unhandled JavaScript errors");
    assert.deepEqual(external,[],"reading lessons, citations and progression must request no external services");
    assert(server.requests.every(r=>!(/\.(?:pdf|docx)$/.test(r.path) || /sauvegarde/.test(r.path))),"original uploaded materials must never be fetched by the public app");
    passed("learning content and source inventory produce no external calls or requests for private originals");
    console.log(browserName+": "+checks+"/"+checks+" source-backed learning groups passed");
  } finally {
    await Promise.allSettled(contexts.map(context=>context.close()));
    await browser.close(); await server.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
