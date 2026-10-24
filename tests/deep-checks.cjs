"use strict";
const assert=require("node:assert/strict"), fs=require("node:fs"),vm=require("node:vm");
const env=vm.createContext({});
for(const f of ["deep-dives.js","evidence-checks.js"])vm.runInContext(fs.readFileSync(require("node:path").join(__dirname,"..",f),"utf8"),env,{filename:f});
const entries=vm.runInContext("RC_DEEP_DIVES",env),v=vm.runInContext("RC_EVIDENCE",env);
const subjects=["linux-fs","linux-perms","linux-process","ipv4","routing","dns","shared","cloud-iam","vpc","method","recon","web"];
assert.deepEqual(Object.keys(entries).sort(),subjects.sort());
for(const id of subjects){
 const d=entries[id];assert(d.theory.length>=3,id);assert(d.objectives.length>=3,id);assert(d.source[1].startsWith("https://"),id);
 for(const item of d.theory)assert(item.length>70,id);
}
const good={
 "lab-02":{observations:[{time:"08:00",temperature:4,rain:0},{time:"09:00",temperature:7,rain:2},{time:"10:00",temperature:11,rain:1}],rainy:[{time:"09:00",temperature:7},{time:"10:00",temperature:11}]},
 "lab-04":{mode:"640",owner:["read","write"],group:["read"],others:[]},
 "lab-05":{destination:"10.0.0.42",selectedGateway:"10.0.0.1",reason:"Le préfixe /24 est plus spécifique que /0"},
 "lab-09":{principal:"viewer",action:"delete",resourceOwner:"other",authorized:false,serverSideCheck:true,remediation:"Le serveur vérifie les permissions sur chaque objet avant suppression."},
 "lab-12":{Version:"2012-10-17",Statement:[{Effect:"Allow",Action:"s3:GetObject",Resource:"arn:aws:s3:::rc-training/*"}]}
};
for(const [id,o] of Object.entries(good)){
 const baseline=v.verify(id,JSON.stringify(o));assert.equal(baseline.ok,true,id+" "+JSON.stringify(baseline.checks));
 assert.equal(v.verify(id,"not-json").ok,false,id);
 assert.equal(v.verify(id,JSON.stringify([])).ok,false,id);
 assert.equal(v.verify(id,JSON.stringify({...o,invalid:true, ...(id==="lab-04"?{mode:"777"}:id==="lab-05"?{selectedGateway:"192.168.1.1"}:id==="lab-09"?{authorized:true}:id==="lab-12"?{Statement:[{Effect:"Allow",Action:"*"}]}:{rainy:[]})})).ok,false,id);
}
assert.equal(v.verify("lab-01","{}").ok,false);
assert.equal(v.verify("lab-02","x".repeat(70000)).ok,false);
for(const f of ["index.html","sw.js"]){
 const s=fs.readFileSync(require("node:path").join(__dirname,"..",f),"utf8");
 for(const script of ["deep-dives.js","evidence-checks.js"])assert(s.includes(script),f+" "+script);
}
console.log("PASS: 12 modules sourcés et 5 correcteurs JSON (acceptation, rejet, taille, intégration offline).");

// Content additions must keep every existing progress ID and bibliography boundary.
const contentEnv=vm.createContext({});
for(const file of ["data.js","course-foundations.js","course-race.js","course-operations.js","learning.js","english.js","drive-learning.js","daily-five.js"]){
 vm.runInContext(fs.readFileSync(require("node:path").join(__dirname,"..",file),"utf8"),contentEnv,{filename:file});
}
const content=JSON.parse(vm.runInContext("JSON.stringify({lessons:RC_LESSONS,topics:RC_TOPICS,supports:RC_SUPPORTS,english:RC_ENGLISH,labs:RC_LABS,projects:RC_PROJECTS,daily:RC_DAILY_FIVE})",contentEnv));
assert.deepEqual(content.lessons.map(l=>l.id),Array.from({length:42},(_,i)=>"rc-"+String(i+1).padStart(2,"0")));
assert.equal(content.topics.length,84);assert.equal(new Set(content.topics.map(t=>t.id)).size,84);
assert.deepEqual(content.labs.map(l=>l.id),Array.from({length:20},(_,i)=>"lab-"+String(i+1).padStart(2,"0")));
assert.equal(content.daily.length,14,"existing Daily Five rotations must remain unchanged");
assert.equal(content.supports.filter(s=>s.status!=="public").length,7);
assert.equal(content.supports.filter(s=>s.status==="public").length,39);
const supportIds=new Set(content.supports.map(s=>s.id)),topicIds=new Set(content.topics.map(t=>t.id));
for(const lesson of content.lessons){
 assert(content.english[lesson.id]&&content.english[lesson.id].vocab.length>=4,lesson.id+" bilingual coaching");
 assert(lesson.sources.every(s=>supportIds.has(s.id)),lesson.id+" source identity");
 if(lesson.chapter<=32)assert(lesson.sources.some(s=>s.id==="course-prod15"),lesson.id+" retained historical citations");
 else {assert(lesson.provenance);assert(lesson.sources.every(s=>!s.pages),lesson.id+" must not fabricate private page references");}
}
for(const lab of content.labs.filter(l=>l.public)){assert(topicIds.has(lab.topic));assert(lab.sources.every(id=>supportIds.has(id)));}
assert.equal(content.projects.length,3);
assert.match(content.projects.find(p=>p.id==="control-vault").status,/prototype/);
for(const source of content.supports.filter(s=>s.url)){
 const u=new URL(source.url);assert.equal(u.protocol,"https:");
 assert(["github.com","developer.mozilla.org","cheatsheetseries.owasp.org","docs.github.com","developers.google.com","playwright.dev"].includes(u.hostname));
 assert(!u.username&&!u.password);
}
console.log("PASS: 42 cours bilingues, 20 labs, 14 séances conservées, 39 sources publiques et trois projets honnêtement identifiés.");
