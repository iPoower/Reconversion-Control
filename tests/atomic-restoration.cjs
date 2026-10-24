"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const segment = source.match(/\/\* NOESIS_ATOMIC_BEGIN[\s\S]*?\/\* NOESIS_ATOMIC_END \*\//);
assert(segment, "The tests must exercise the exact atomic implementation from app.js, not a fictional restore adapter");
const A = "reconversion-control.snapshot.v3", M = "reconversion-control.state.v1", D = "reconversion-control.daily-five.v1";
const oldMain = {progress:{dns:"progress"},review:{},labs:{},proofs:{},labChecks:{},career:{marker:"old"}};
const oldDaily = {days:{"2026-10-22":{completed:true}}};
const nextMain = {...oldMain, progress:{dns:"mastered"},career:{marker:"new"}};
const nextDaily = {days:{"2026-10-23":{completed:true}}};
const serialize = v => JSON.stringify(v);
const document = (main,daily) => serialize({version:3,main,daily});

function harness(initial) {
 const values = new Map(Object.entries(initial||{}));
 const errors = {set:null,get:null,getAfterSet:null};
 const storage = {
   getItem(key) {
     if(errors.get===key){errors.get=null;throw Error("synthetic get failure");}
     return values.has(key)?values.get(key):null;
   },
   setItem(key,value) {
     if(errors.set===key){errors.set=null;throw Object.assign(Error("QuotaExceededError"),{name:"QuotaExceededError"});}
     values.set(key,String(value));
     if(errors.getAfterSet===key){errors.getAfterSet=null;errors.get=key;}
   },
   removeItem(key){values.delete(key);}
 };
 const faults = [];
 const sandbox = {localStorage:storage,ATOMIC_KEY:A,KEY:M,DAILY_KEY:D,
   atomicUnread:false,atomicSnapshot:null,progressUnread:false,dailyUnread:false,storageWriter:true,storageConflict:false,
   plainObject:v=>v!==null&&typeof v==="object"&&!Array.isArray(v),
   storageStatus:(key,failed)=>{if(failed)faults.push(key);},storageNotice:()=>{}};
 vm.createContext(sandbox);
 vm.runInContext(segment[0]+"\nglobalThis.API = {atomicRead,atomicCommit,mirrorLegacy};",sandbox);
 sandbox.atomicSnapshot=sandbox.API.atomicRead();
 return {values,errors,storage,sandbox,faults,...sandbox.API};
}
let checks=0;
function test(title,fn){fn();checks++;console.log("PASS "+title);}
test("baseline: independent historical writes can create a split during quota error",()=>{
 const h=harness({[M]:serialize(oldMain),[D]:serialize(oldDaily)});
 h.storage.setItem(D,serialize(nextDaily));
 h.errors.set=M;assert.throws(()=>h.storage.setItem(M,serialize(nextMain)),/QuotaExceededError/);
 assert.equal(JSON.parse(h.values.get(M)).progress.dns,"progress");
 assert.equal(JSON.parse(h.values.get(D)).days["2026-10-23"].completed,true);
});
test("atomic commit: quota before write preserves the prior complete state",()=>{
 const h=harness({[A]:document(oldMain,oldDaily)});
 h.errors.set=A;assert.throws(()=>h.atomicCommit(nextMain,nextDaily),/Instantané non confirmé/);
 const read=JSON.parse(h.values.get(A));
 assert.equal(read.main.progress.dns,"progress");
 assert.ok(read.daily.days["2026-10-22"]);
});
test("atomic commit: failed readback restores the entire prior confirmed snapshot",()=>{
 const h=harness({[A]:document(oldMain,oldDaily)});
 h.errors.getAfterSet=A;assert.throws(()=>h.atomicCommit(nextMain,nextDaily),/Instantané non confirmé/);
 const recovered=JSON.parse(h.values.get(A));
 assert.equal(recovered.main.progress.dns,"progress");
 assert.deepEqual(recovered.daily,oldDaily);
});
test("first migration: quota preserves both original legacy keys",()=>{
 const h=harness({[M]:serialize(oldMain),[D]:serialize(oldDaily)});
 h.errors.set=A;assert.throws(()=>h.atomicCommit(nextMain,nextDaily));
 assert.equal(h.values.get(A),undefined);
 assert.equal(JSON.parse(h.values.get(M)).progress.dns,"progress");
 assert.ok(JSON.parse(h.values.get(D)).days["2026-10-22"]);
});
test("complete commit and read-after-reload yield one coherent revision",()=>{
 const h=harness({[M]:serialize(oldMain),[D]:serialize(oldDaily)});
 assert.equal(h.atomicRead(),null);
 h.atomicCommit(nextMain,nextDaily);
 const reboot=harness(Object.fromEntries(h.values));
 const recovered=reboot.atomicRead();
 assert.equal(recovered.version,3);
 assert.equal(recovered.main.progress.dns,"mastered");
 assert.equal(recovered.main.career.marker,"new");
 assert.ok(recovered.daily.days["2026-10-23"]);
});
test("legacy mirrors may partially fail but are never authoritative",()=>{
 const h=harness({[A]:document(oldMain,oldDaily),[M]:serialize(oldMain),[D]:serialize(oldDaily)});
 h.atomicCommit(nextMain,nextDaily);
 h.errors.set=D;h.mirrorLegacy(nextMain,nextDaily);
 assert.equal(JSON.parse(h.values.get(M)).progress.dns,"mastered");
 assert.ok(JSON.parse(h.values.get(D)).days["2026-10-22"]);
 const reboot=harness(Object.fromEntries(h.values));
 assert.equal(reboot.atomicRead().main.progress.dns,"mastered");
 assert.ok(reboot.atomicRead().daily.days["2026-10-23"]);
});
test("unread legacy Daily Five blocks first migration without erasing history",()=>{
 const h=harness({[M]:serialize(oldMain),[D]:serialize(oldDaily)});
 h.sandbox.dailyUnread=true;
 assert.throws(()=>h.atomicCommit(nextMain,nextDaily),/Ancienne progression non lisible/);
 assert.equal(h.values.get(A),undefined);
 assert.equal(h.values.get(D),serialize(oldDaily));
});
test("unread legacy progression blocks first migration",()=>{
 const h=harness({[M]:serialize(oldMain),[D]:serialize(oldDaily)});
 h.sandbox.progressUnread=true;
 assert.throws(()=>h.atomicCommit(nextMain,nextDaily),/Ancienne progression non lisible/);
 assert.equal(h.values.get(M),serialize(oldMain));
});
test("malformed authoritative snapshot blocks overwriting unknown data",()=>{
 const h=harness({[A]:'{"version":3,"main":{}}',[M]:serialize(oldMain)});
 assert.equal(h.atomicRead(),null);assert.equal(h.sandbox.atomicUnread,true);
 assert.throws(()=>h.atomicCommit(nextMain,nextDaily),/inaccessible/);
 assert.equal(h.values.get(A),'{"version":3,"main":{}}');
});
test("both primary payloads are required",()=>{
 const h=harness({});
 assert.throws(()=>h.atomicCommit(nextMain,{}),/incomplet/);
 assert.equal(h.values.size,0);
});
test("stale tab refuses a sequential lost update without overwriting either value",()=>{
 const h=harness({[A]:document(oldMain,oldDaily)});
 h.values.set(A,document(nextMain,nextDaily));
 assert.throws(()=>h.atomicCommit({...oldMain,progress:{linux:"progress"}},oldDaily),/Instantané non confirmé/);
 assert.equal(h.values.get(A),document(nextMain,nextDaily));
 assert.equal(h.sandbox.storageConflict,true);
});
test("read-only tab cannot commit, including first migration and restoration",()=>{
 for(const initial of [{},{[A]:document(oldMain,oldDaily)}]){
  const h=harness(initial);h.sandbox.storageWriter=false;
  assert.throws(()=>h.atomicCommit(nextMain,nextDaily),/Autre onglet/);
  assert.deepEqual(Object.fromEntries(h.values),initial);
 }
});
test("preflight read failure preserves the previous authoritative bytes",()=>{
 const h=harness({[A]:document(oldMain,oldDaily)});
 h.errors.get=A;assert.throws(()=>h.atomicCommit(nextMain,nextDaily),/Instantané non confirmé/);
 assert.equal(h.values.get(A),document(oldMain,oldDaily));
});
test("historical unknown progression blocks migration instead of dropping its bytes",()=>{
 const loadFunction=source.match(/function load\(\)\{[\s\S]*?\n\}/)[0];
 const progressFunction=source.match(/function progression\(data,strict\)\{[\s\S]*?\n\}/)[0];
 const context=vm.createContext({defaults:{progress:{},review:{}},atomicSnapshot:null,
  KEY:M,progressUnread:false,storageGet:()=>serialize({view:"review",progress:{retiredTopic:"mastered"},review:{}}),
  storageStatus(){},plainObject:v=>v&&typeof v==="object"&&!Array.isArray(v),
  topic:()=>null,statuses:["learn","progress","mastered"],views:["review"],section:()=>null,
  labStateSanitize:()=>({}),proofStateSanitize:()=>({}),labChecksSanitize:()=>({}),RC_PROJECT_PLAN:{sanitize:()=>({})}});
 vm.runInContext(progressFunction+loadFunction+';globalThis.loaded=load();',context);
 assert.equal(context.loaded.view,'review','safe navigation metadata must remain usable while business migration is blocked');
 assert.equal(context.progressUnread,true,"unsupported historical progression must stay unread and non-migratable");
});
test("idempotent retry preserves one complete revision and no extra key",()=>{
 const h=harness({[A]:document(oldMain,oldDaily)});
 h.errors.set=A;assert.throws(()=>h.atomicCommit(nextMain,nextDaily));
 h.atomicCommit(nextMain,nextDaily);const a=h.values.get(A);
 h.atomicCommit(nextMain,nextDaily);
 assert.equal(h.values.get(A),a);assert.equal(h.values.size,1);
});
test("cloud restore and manual import commit before mutating live state",()=>{
 const cloud=source.match(/function cloudRestore\(o\)\{[\s\S]*?\n\}/);
 assert(cloud);
 assert(cloud[0].indexOf("atomicCommit(nextState,daily)")<cloud[0].indexOf("state=nextState"));
 const importer=source.match(/\$\("#importer"\)\.onchange=[^\n]+/);
 assert(importer);
 assert(importer[0].indexOf("atomicCommit(nextState,nextDaily)")<importer[0].indexOf("state=nextState"));
});
console.log("NOESIS-RCC-001: "+checks+" synthetic and source-wired checks passed; browser/physical tests remain separate.");
