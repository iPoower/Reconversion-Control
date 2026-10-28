"use strict";
// Deterministic, offline controller tests. Every account and progression is fictitious.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const copy = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return {promise, resolve}; };

function fixture() {
  let state = {version: 2, progress: {dns: "initial-fixture"}}, row = null;
  let interval, timeout, failWrite = false, failRestore = false, failHead = false, fullReads=0, headReads=0, clock=0, expired=false;
  const listeners = {};
  const gates = new Map(), nodes = new Map(), writes = [];
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {value: "", innerHTML: "", textContent: ""});
    return nodes.get(selector);
  };
  for (const [id, value] of Object.entries({url: "https://fixture.supabase.co", key: "sb_publishable_fixture", email: "fixture@example.invalid", otp: "123456", phrase: "fictional-test-only-phrase"})) node("#rc-sync-" + id).value = value;
  async function wait(stage) {
    const gate = gates.get(stage);
    if (gate) { gates.delete(stage); gate.started.resolve(); await gate.release.promise; }
  }
  const client = {
    sendCode: async () => {}, verifyCode: async () => { expired = false; return "00000000-0000-4000-8000-000000000001"; }, logout: () => {},
    async read() { if (expired) throw Error("Session expirée ou révoquée : reconnecte-toi"); fullReads++; const result = copy(row); await wait("read"); return result; },
    async readRevision() { headReads++; const result=row?row.revision:null; await wait("head"); if(failHead){failHead=false;throw Error("Fictitious metadata failure");}return result; },
    async write(payload, revision) {
      await wait("write");
      if (expired) throw Error("Session expirée ou révoquée : reconnecte-toi");
      if (failWrite) { failWrite = false; throw Error("Fictitious network failure"); }
      assert.equal(revision, row ? row.revision : null, "conditional write must use the expected revision");
      row = {revision: revision === null ? 1 : revision + 1, payload: copy(payload)};
      writes.push(copy(row)); return row.revision;
    }
  };
  const store = new Map();
  const sandbox = {
    localStorage: {getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
    Date: class extends Date { static now(){return Date.now()+clock;} },
    navigator: {onLine: true}, confirm: () => true,
    document: {querySelector: node, addEventListener: (type, fn) => { listeners["document:" + type] = fn; }},
    window: {addEventListener: (type, fn) => { listeners["window:" + type] = fn; }},
    setInterval: callback => { interval = callback; return 1; }, clearInterval: () => { interval = null; },
    setTimeout: callback => { timeout = callback; return 2; }, clearTimeout: () => { timeout = null; },
    RC_CLOUD_TRANSPORT: {
      config: (url,key)=>({url,key}), create: () => client,
      serialize: JSON.stringify, fingerprint: async s => require("node:crypto").createHash("sha256").update(s).digest("hex"),
      // Serialize AFTER the wait, just as real seal() does after its asynchronous KDF.
      async seal(snapshot) { await wait("seal"); return {snapshot: copy(snapshot)}; },
      async open(payload) { await wait("open"); return copy(payload.snapshot); }
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../cloud-ui.js"), "utf8") + "\nglobalThis.testUI=RC_CLOUD_UI;", sandbox);
  const api = sandbox.testUI.attach({
    escape: s => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;"),
    // Match cloudSnapshot(): nested objects are shared with the live application state.
    snapshot: () => ({version: state.version, progress: state.progress}),
    restore: data => { if (failRestore) throw Error("Fictitious local save failure"); state = copy(data); }
  });
  api.bind();
  const click = name => node("#rc-sync-" + name).onclick();
  return {
    async prepare(kind) {
      if (kind === "choice") row = {revision: 4, payload: {snapshot: {version: 2, progress: {dns: "remote-fixture"}}}};
      await click("request");
      await click("verify");
      if(kind === "automatic") await click("create");
    },
    send: kind => kind === "first" ? click("create") : kind === "choice" ? click("push") : interval(),
    edit(value) { state.progress.dns = value; api.changed(); },
    pause(stage) { const gate = {started: deferred(), release: deferred()}; gates.set(stage, gate); return {started: gate.started.promise, release: gate.release.resolve}; },
    remote(value) { row = {revision: (row ? row.revision : 0) + 1, payload: {snapshot: {version: 2, progress: {dns: value}}}}; },
    tick: () => interval(),
    manual: () => click("now"),
    advance: ms => {clock+=ms;},
    hidden: value => {sandbox.document.hidden=value;},
    online: value => {sandbox.navigator.onLine=value;},
    // Browser lifecycle events registered by attach(); handlers do not return their promise.
    async fire(target, type) { const fn = listeners[target + ":" + type]; assert(fn, target + " " + type + " listener must be registered"); fn({type}); for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r)); },
    dropTimer: () => { timeout = null; },
    expireSession: () => { expired = true; },
    disconnect: () => click("disconnect"),
    corruptHead: value => {row.payload.snapshot.progress.dns=value;},
    removeCloud: () => {row=null;},
    failHead: () => {failHead=true;},
    get reads(){return {full:fullReads,head:headReads};},
    async pending() { assert(timeout, "concurrent edits must schedule another attempt, including first backup"); const run = timeout; timeout = null; await run(); },
    failWrite: () => { failWrite = true; }, failRestore: () => { failRestore = true; },
    get local() { return state.progress.dns; }, get remoteValue() { return row && row.payload.snapshot.progress.dns; },
    corruptJournal() { for(const key of store.keys())if(key.startsWith("reconversion-control.cloud.sync.v1:"))store.set(key,JSON.stringify({v:99,retained:"future-journal"})); },
    get html() { return node("#rc-sync").innerHTML; }, get writes() { return writes; }, get journal() { return Array.from(store.values()).join("\n"); }
  };
}

async function run() {
  const failures = []; let count = 0;
  async function check(name, test) {
    try { await test(); count++; console.log("PASS N03 " + name); }
    catch (error) { console.error("FAIL N03 " + name + ": " + error.message); failures.push(error); }
  }
  for (const kind of ["first", "automatic", "choice"]) {
    for (const stage of ["seal", "write"]) await check(kind + ": edit during " + stage + " remains pending and is subsequently sent", async () => {
      const f = fixture(); await f.prepare(kind); f.edit("edit-A");
      const gate = f.pause(stage), sending = f.send(kind); await gate.started;
      f.edit("edit-B"); gate.release(); await sending;
      assert.equal(f.local, "edit-B");
      assert.equal(f.remoteValue, "edit-A", "the uploaded snapshot must be independent of live nested objects");
      assert.match(f.html, /restent à synchroniser/);
      await f.pending(); assert.equal(f.remoteValue, "edit-B");
      const writes = f.writes.length; await f.tick(); assert.equal(f.writes.length, writes);
      assert.match(f.html, /À jour sur cet appareil et dans le cloud/);
    });
    await check(kind + ": next remote revision cannot overwrite an unuploaded concurrent edit", async () => {
      const f = fixture(); await f.prepare(kind); f.edit("edit-A");
      const gate = f.pause("write"), sending = f.send(kind); await gate.started;
      f.edit("edit-B"); gate.release(); await sending;
      f.remote("other-device"); await f.tick();
      assert.equal(f.local, "edit-B"); assert.match(f.html, /Conflit détecté/);
      await f.send("choice"); assert.equal(f.remoteValue, "edit-B");
    });
    await check(kind + ": failed write never acknowledges the unsent state and can be retried", async () => {
      const f = fixture(); await f.prepare(kind); f.edit("unsent-fixture"); f.failWrite();
      await f.send(kind); assert.notEqual(f.remoteValue, "unsent-fixture"); assert.equal(f.local, "unsent-fixture");
      assert.doesNotMatch(f.html, /À jour sur cet appareil et dans le cloud/);
      await f.send(kind); assert.equal(f.remoteValue, "unsent-fixture");
    });
  }
  for (const stage of ["read", "open"]) await check("edit during remote " + stage + " prevents automatic replacement", async () => {
    const f = fixture(); await f.prepare("automatic"); f.remote("other-device");
    const gate = f.pause(stage), receiving = f.tick(); await gate.started;
    f.edit("local-during-receive"); gate.release(); await receiving;
    assert.equal(f.local, "local-during-receive"); assert.match(f.html, /Conflit détecté/);
  });
  await check("refused local restore does not advance baseline or erase later local work", async () => {
    const f = fixture(); await f.prepare("automatic"); f.remote("other-device"); f.failRestore();
    await f.tick(); assert.equal(f.local, "initial-fixture"); assert.match(f.html, /progression locale conservée/);
    assert.doesNotMatch(f.html, /À jour sur cet appareil et dans le cloud/, "a refused restoration must never acknowledge synchronization success");
    f.edit("local-after-failed-restore"); await f.tick();
    assert.equal(f.local, "local-after-failed-restore"); assert.match(f.html, /Conflit détecté/);
  });
  await check("future durable journal is never overwritten or treated as synchronized", async () => {
    const f=fixture();await f.prepare("automatic");f.corruptJournal();const before=f.journal,writes=f.writes.length;f.edit("pending-after-future-journal");await f.tick();
    assert.equal(f.journal,before);assert.equal(f.writes.length,writes);assert.match(f.html,/incompatible/);assert.doesNotMatch(f.html,/À jour sur cet appareil et dans le cloud/);
  });
  await check("idle metadata reads do not upload or advance a receipt; full audits remain mandatory",async()=>{
    const f=fixture();await f.prepare("automatic");const before=f.reads,journal=f.journal,writes=f.writes.length;
    await f.tick();assert.equal(f.reads.full,before.full);assert.equal(f.reads.head,before.head+1);assert.equal(f.writes.length,writes);assert.equal(f.journal,journal);
    await f.manual();assert.equal(f.reads.full,before.full+1);
    f.advance(600001);await f.tick();assert.equal(f.reads.full,before.full+2);
    f.advance(-700000);await f.tick();assert.equal(f.reads.full,before.full+3,"clock rollback must force a full audit");
    f.hidden(true);const hidden=f.reads;await f.tick();assert.deepEqual(f.reads,hidden);
  });
  await check("changed or disappeared revision always falls back to a full read",async()=>{
    const f=fixture();await f.prepare("automatic");const before=f.reads.full;f.remote("other-device");await f.tick();
    assert.equal(f.local,"other-device");assert.equal(f.reads.full,before+1);
    f.removeCloud();await f.tick();assert.equal(f.local,"other-device");assert.match(f.html,/disparu/);
  });
  for(const concurrentRemote of [false,true])await check("edit during metadata probe is preserved"+(concurrentRemote?" with a remote conflict":""),async()=>{
    const f=fixture();await f.prepare("automatic");const gate=f.pause("head"),poll=f.tick();await gate.started;
    f.edit("new-local");if(concurrentRemote)f.remote("new-remote");gate.release();await poll;
    assert.equal(f.local,"new-local");
    if(concurrentRemote){assert.equal(f.remoteValue,"new-remote");assert.match(f.html,/Conflit détecté/);}
    else assert.equal(f.remoteValue,"new-local");
  });
  await check("metadata failure cannot manufacture a success and forces the next full read",async()=>{
    const f=fixture();await f.prepare("automatic");const before=f.reads.full,journal=f.journal;f.failHead();await f.tick();
    assert.equal(f.journal,journal);assert.match(f.html,/metadata failure/);assert.doesNotMatch(f.html,/À jour sur cet appareil et dans le cloud/);
    await f.tick();assert.equal(f.reads.full,before+1);
  });
  await check("manual request or audit expiry during a metadata probe forces a full read",async()=>{
    for(const action of ["manual","expiry"]){
     const f=fixture();await f.prepare("automatic");const before=f.reads.full,gate=f.pause("head"),poll=f.tick();await gate.started;
     if(action==="manual")await f.manual();else f.advance(600001);
     gate.release();await poll;assert.equal(f.reads.full,before+1);
    }
  });
  await check("same-revision payload tampering remains rejected by manual and repeated full checks",async()=>{
    const f=fixture();await f.prepare("automatic");const journal=f.journal;f.corruptHead("tampered-fixture");await f.manual();
    assert.equal(f.local,"initial-fixture");assert.equal(f.journal,journal);assert.match(f.html,/modifié sans nouvelle révision/);
    const before=f.reads.full;await f.tick();assert.equal(f.reads.full,before+1);assert.match(f.html,/modifié sans nouvelle révision/);
  });
  // Resume triggers (task: automatic backup chain). Each case starts from a durable local edit.
  await check("reconnection ('online' event) uploads an edit made while offline", async () => {
    const f = fixture(); await f.prepare("automatic"); f.online(false); f.edit("offline-edit");
    await f.pending(); assert.match(f.html, /Hors connexion/); assert.notEqual(f.remoteValue, "offline-edit");
    assert.doesNotMatch(f.html, /À jour sur cet appareil et dans le cloud/);
    f.online(true); await f.fire("window", "online");
    assert.equal(f.remoteValue, "offline-edit"); assert.match(f.html, /sauvegardées et chiffrées|À jour/);
  });
  for (const [target, type] of [["document", "visibilitychange"], ["window", "pageshow"]]) await check("foreground (" + type + ") resumes an upload whose debounce timer was suspended", async () => {
    const f = fixture(); await f.prepare("automatic"); f.hidden(true); f.edit("background-edit"); f.dropTimer();
    assert.notEqual(f.remoteValue, "background-edit"); f.hidden(false); await f.fire(target, type);
    assert.equal(f.remoteValue, "background-edit"); assert.equal(f.local, "background-edit");
  });
  for (const stage of ["read", "write"]) await check("session expiry during " + stage + " never acknowledges; local edit is uploaded after re-authentication", async () => {
    const f = fixture(); await f.prepare("automatic"); f.edit("edit-before-expiry");
    const writes = f.writes.length;
    if (stage === "read") { f.expireSession(); await f.pending(); }
    else { const gate = f.pause("write"), sending = f.pending(); await gate.started; f.expireSession(); gate.release(); await sending;
      assert.match(f.journal, /"pending":\{/, "an interrupted upload must stay in the durable encrypted outbox"); }
    assert.equal(f.writes.length, writes); assert.equal(f.local, "edit-before-expiry");
    assert.match(f.html, /Session expirée/); assert.doesNotMatch(f.html, /À jour sur cet appareil et dans le cloud/);
    await f.disconnect(); await f.prepare("relogin");
    if (stage === "read") await f.pending(); // no outbox yet: the dirty snapshot is re-sent by the normal debounce
    assert.equal(f.remoteValue, "edit-before-expiry"); assert.equal(f.writes.length, writes + 1);
    assert.doesNotMatch(f.journal, /"pending":\{/);
  });
  console.log("N03 offline regression cases: " + count + "/" + (count + failures.length) + " passed; no network or real data.");
  if (failures.length) throw new AggregateError(failures, failures.length + " N03 regression cases failed");
}
module.exports = {run};
if (require.main === module) { const watchdog=setTimeout(()=>{throw Error("N03 suite stalled");},30000); run().catch(error => { console.error(error); process.exitCode = 1; }).finally(()=>clearTimeout(watchdog)); }
