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
  let interval, timeout, failWrite = false, failRestore = false;
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
    sendCode: async () => {}, verifyCode: async () => {}, logout: () => {},
    async read() { const result = copy(row); await wait("read"); return result; },
    async write(payload, revision) {
      await wait("write");
      if (failWrite) { failWrite = false; throw Error("Fictitious network failure"); }
      assert.equal(revision, row ? row.revision : null, "conditional write must use the expected revision");
      row = {revision: revision === null ? 1 : revision + 1, payload: copy(payload)};
      writes.push(copy(row)); return row.revision;
    }
  };
  const sandbox = {
    navigator: {onLine: true}, document: {querySelector: node}, confirm: () => true,
    setInterval: callback => { interval = callback; return 1; }, clearInterval: () => { interval = null; },
    setTimeout: callback => { timeout = callback; return 2; }, clearTimeout: () => { timeout = null; },
    RC_CLOUD_TRANSPORT: {
      create: () => client,
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
      if (kind !== "first") await click("verify");
    },
    send: kind => kind === "first" ? click("verify") : kind === "choice" ? click("push") : interval(),
    edit(value) { state.progress.dns = value; api.changed(); },
    pause(stage) { const gate = {started: deferred(), release: deferred()}; gates.set(stage, gate); return {started: gate.started.promise, release: gate.release.resolve}; },
    remote(value) { row = {revision: (row ? row.revision : 0) + 1, payload: {snapshot: {version: 2, progress: {dns: value}}}}; },
    tick: () => interval(),
    async pending() { assert(timeout, "concurrent edits must schedule another attempt, including first backup"); const run = timeout; timeout = null; await run(); },
    failWrite: () => { failWrite = true; }, failRestore: () => { failRestore = true; },
    get local() { return state.progress.dns; }, get remoteValue() { return row && row.payload.snapshot.progress.dns; },
    get html() { return node("#rc-sync").innerHTML; }, get writes() { return writes; }
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
    f.edit("local-after-failed-restore"); await f.tick();
    assert.equal(f.local, "local-after-failed-restore"); assert.match(f.html, /Conflit détecté/);
  });
  console.log("N03 offline regression cases: " + count + "/" + (count + failures.length) + " passed; no network or real data.");
  if (failures.length) throw new AggregateError(failures, failures.length + " N03 regression cases failed");
}
module.exports = {run};
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
