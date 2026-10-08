"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const {webcrypto}=require("node:crypto"),{TextEncoder,TextDecoder}=require("node:util");
let row=null;
const user="00000000-0000-4000-8000-000000000001";
async function fetchMock(input,init){
 const url=new URL(input),headers=init.headers||{},body=init.body?JSON.parse(init.body):null;
 if(!url.hostname.endsWith(".supabase.co"))throw Error("Outside test provider");
 if(url.pathname==="/auth/v1/otp")return response(200,{});
 if(url.pathname==="/auth/v1/verify")return response(200,{access_token:"mockJwt",refresh_token:"mockRefresh",expires_in:3600,user:{id:user}});
 if(url.pathname==="/rest/v1/reconversion_progress"){
  if(headers.Authorization!=="Bearer mockJwt")return response(401,{message:"unauthorized"});
  if(init.method==="POST"){if(row)return response(409,{message:"duplicate"});row={revision:1,payload:body.payload};return response(201,[row]);}
  if(init.method==="PATCH"){
   const n=Number(url.searchParams.get("revision").slice(3));
   if(!row||n!==row.revision)return response(200,[]);
   row={revision:n+1,payload:body.payload};return response(200,[row]);
  }
  return response(200,row?[row]:[]);
 }
 return response(404,{error:"not found"});
}
function response(status,j){return {ok:status>=200&&status<300,status,text:async()=>JSON.stringify(j)};}
const ctx=vm.createContext({URL,crypto:webcrypto,TextEncoder,TextDecoder,fetch:fetchMock,Date,console,btoa:s=>Buffer.from(s,"binary").toString("base64"),atob:s=>Buffer.from(s,"base64").toString("binary")});
vm.runInContext(fs.readFileSync(require("node:path").join(__dirname,"../cloud-transport.js"),"utf8")+"\nglobalThis.T=RC_CLOUD_TRANSPORT;",ctx);
const T=ctx.T;
async function run(){
 assert.throws(()=>T.config("http://example.com","sb_publishable_abcdef"));
 assert.throws(()=>T.config("https://example.com","sb_publishable_abcdef"));
 assert.throws(()=>T.config("https://rc-project.supabase.co","sb_secret_abcdef"));
 assert.throws(()=>T.config("https://rc-project.supabase.co","service_role"));
 const cfg=T.config("https://rc-project.supabase.co","sb_publishable_example");assert.equal(cfg.url,"https://rc-project.supabase.co");
 const original={version:2,progress:{dns:"mastered"},dailyFive:{days:{"2026-10-08":{xp:20}}}};
 const enc=await T.seal(original,"phrase secrète assez longue");
 assert.equal(enc.v,1);assert(enc.ciphertext.length>20);
 const plain=await T.open(enc,"phrase secrète assez longue");assert.equal(JSON.stringify(plain),JSON.stringify(original));
 await assert.rejects(T.open(enc,"mauvaise phrase secrète"),/Déchiffrement impossible/);
 const a=T.create(cfg),b=T.create(cfg);
 await a.sendCode("test@example.com");
 await a.verifyCode("test@example.com","123456");
 await b.verifyCode("test@example.com","123456");
 assert.equal(await a.read(),null);
 assert.equal(await a.write(enc,null),1);
 assert.equal((await b.read()).revision,1);
 assert.equal(await a.write(enc,1),2);
 await assert.rejects(b.write(enc,1),/Conflit/);
 assert.equal((await b.read()).revision,2);
 a.logout();await assert.rejects(a.read(),/Non connecté/);
 console.log("PASS: crypto AES-GCM, rejet mauvaises phrases, OTP, conflit de révision, refus de clé secrète.");
}
run().catch(e=>{console.error(e);process.exitCode=1;});
