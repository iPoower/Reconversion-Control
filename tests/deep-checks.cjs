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
