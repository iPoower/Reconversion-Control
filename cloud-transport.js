"use strict";
/* Optional, same-origin-independent Supabase REST transport. No default provider.
   Browser encryption, conditional writes and read-after-write acknowledgement. */
const RC_CLOUD_TRANSPORT = (() => {
 const te=new TextEncoder(),td=new TextDecoder("utf-8",{fatal:true}),MAX=2097136;
 function serialize(value){
  function sort(v){if(Array.isArray(v))return v.map(sort);if(v&&typeof v==="object"){const out=Object.create(null);Object.keys(v).sort().forEach(k=>{if(["__proto__","prototype","constructor"].includes(k))throw Error("Champ interdit");out[k]=sort(v[k]);});return out;}return v;}
  return JSON.stringify(sort(value));
 }
 function bounded(value){const raw=serialize(value);if(!raw||te.encode(raw).length>MAX)throw Error("Sauvegarde trop volumineuse (2 Mio maximum)");return raw;}
 function b64(bytes){let s="";for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);}
 function un64(s,max){if(typeof s!=="string"||s.length>Math.ceil(max/3)*4||s.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error("Base64 invalide");const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));if(bytes.length>max||b64(bytes)!==s)throw Error("Base64 invalide");return bytes;}
 async function fingerprint(raw){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",te.encode(raw))),n=>n.toString(16).padStart(2,"0")).join("");}
 function config(url,key){
  const u=new URL(String(url||"").trim());
  if(u.protocol!=="https:"||!/^[-a-z0-9]+\.supabase\.co$/i.test(u.hostname)||u.username||u.password||u.search||u.hash||u.pathname!=="/"||u.port)throw Error("URL Supabase invalide");
  if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(String(key||"")))throw Error("Utiliser uniquement une clé publique sb_publishable_… (jamais une clé secret/service_role)");
  return {url:u.origin,key};
 }
 function validRevision(n){return Number.isSafeInteger(n)&&n>0&&n<Number.MAX_SAFE_INTEGER;}
 function row(value){if(!value||!validRevision(value.revision)||!value.payload||typeof value.payload!=="object")throw Error("Réponse cloud invalide");bounded(value.payload);return value;}
 function create(cfg,options={}){
  const base=config(cfg.url,cfg.key);let session=null,refreshing=null,generation=0;
  async function request(path,init={}){
   const headers={apikey:base.key,"Content-Type":"application/json",...(init.headers||{})};
   if(init.secure)headers.Authorization="Bearer "+await access();
   const ctrl=typeof AbortController!=="undefined"?new AbortController():null;
   const timeout=ctrl?setTimeout(()=>ctrl.abort(),20000):null;
   try{
    const res=await fetch(base.url+path,{method:init.method||"GET",headers,body:init.body?JSON.stringify(init.body):undefined,cache:"no-store",credentials:"omit",redirect:"error",...(ctrl?{signal:ctrl.signal}:{})});
    if(!res.ok)throw Object.assign(Error("Service cloud : erreur HTTP "+res.status),{status:res.status});
    // Limit memory even when a malicious/intermediary response has no length header.
    let raw="";
    if(res.body&&res.body.getReader){const reader=res.body.getReader();let size=0;const chunks=[];while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>4200000){await reader.cancel();throw Error("Réponse cloud trop volumineuse");}chunks.push(chunk.value);}const bytes=new Uint8Array(size);let offset=0;chunks.forEach(c=>{bytes.set(c,offset);offset+=c.length;});raw=td.decode(bytes);}
    else{raw=await res.text();if(raw.length>4200000)throw Error("Réponse cloud trop volumineuse");}
    return raw?JSON.parse(raw):null;
   }finally{if(timeout)clearTimeout(timeout);}
  }
  function validSession(s){return s&&s.project===base.url&&typeof s.access_token==="string"&&s.access_token.length>0&&s.access_token.length<16384&&typeof s.refresh_token==="string"&&s.refresh_token.length>0&&s.refresh_token.length<16384&&Number.isFinite(s.expires_at)&&typeof s.user==="string"&&/^[0-9a-f-]{36}$/i.test(s.user);}
  async function accept(j,ticket){
   if(ticket!==generation)throw Error("Session annulée");
   if(!j||!j.user||j.user.is_anonymous===true)throw Error("Authentification non confirmée");
   const next={project:base.url,access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Date.now()+Number(j.expires_in||3600)*1000,user:j.user.id};
   if(!validSession(next)||session&&session.user!==next.user)throw Error("Authentification non confirmée");
   session=next;
   if(options.sessionChanged)await options.sessionChanged({...next});
   if(ticket!==generation)throw Error("Session annulée");
   return session.user;
  }
  async function sendCode(email){if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error("Adresse email incorrecte");await request("/auth/v1/otp",{method:"POST",body:{email,create_user:true}});}
  async function verifyCode(email,token){if(!/^\d{6,8}$/.test(token))throw Error("Code OTP attendu (6 à 8 chiffres)");const ticket=generation;return accept(await request("/auth/v1/verify",{method:"POST",body:{email,token,type:"email"}}),ticket);}
  async function access(){
   if(!session)throw Error("Non connecté");
   if(Date.now()<session.expires_at-60000)return session.access_token;
   if(!refreshing){const ticket=generation,previous=session;refreshing=(async()=>{
    try{const j=await request("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:{refresh_token:previous.refresh_token}});await accept(j,ticket);return session.access_token;}
    catch(e){if(ticket===generation&&(e.status===400||e.status===401||e.status===403)){session=null;throw Error("Session expirée ou révoquée : reconnecte-toi");}throw e;}
    finally{refreshing=null;}
   })();}
   return refreshing;
  }
  async function resume(saved){
   if(!validSession(saved))throw Error("Session mémorisée incompatible");session={...saved};const ticket=generation;
   const user=await request("/auth/v1/user",{secure:true});
   if(ticket!==generation||!session||!user||user.id!==session.user||user.is_anonymous===true){session=null;throw Error("Session non confirmée");}return session.user;
  }
  async function read(){
   if(!session)throw Error("Non connecté");
   const rows=await request("/rest/v1/reconversion_progress?user_id=eq."+encodeURIComponent(session.user)+"&select=revision,payload",{secure:true});
   if(!Array.isArray(rows)||rows.length>1)throw Error("Réponse cloud invalide");return rows.length?row(rows[0]):null;
  }
  async function write(payload,revision){
   if(!session)throw Error("Non connecté");if(revision!==null&&!validRevision(revision))throw Error("Révision invalide");bounded(payload);
   const expected=revision===null?1:revision+1;
   const path="/rest/v1/reconversion_progress"+(revision===null?"":"?user_id=eq."+encodeURIComponent(session.user)+"&revision=eq."+revision);
   let cause;
   try{
    const rows=await request(path,{secure:true,method:revision===null?"POST":"PATCH",headers:{Prefer:"return=representation"},body:revision===null?{user_id:session.user,revision:expected,payload}:{revision:expected,payload}});
    if(!Array.isArray(rows)||rows.length!==1||row(rows[0]).revision!==expected||serialize(rows[0].payload)!==serialize(payload))throw Error("Écriture non confirmée");
   }catch(e){cause=e;}
   // Even an HTTP error/empty response does NOT prove that a write failed.
   // The durable outbox retries the SAME ciphertext, never a new random envelope.
   let head;try{head=await read();}catch(e){throw cause||e;}
   if(head&&head.revision===expected&&serialize(head.payload)===serialize(payload))return expected;
   if(head&&head.revision!==revision)throw Error("Conflit de version : modification distante détectée ; aucune donnée écrasée");
   throw cause||Error("Écriture non confirmée : réessayer avec la même version");
  }
  async function history(){
   if(!session)throw Error("Non connecté");
   const rows=await request("/rest/v1/reconversion_progress_history?user_id=eq."+encodeURIComponent(session.user)+"&select=revision&order=revision.desc&limit=20",{secure:true});
   if(!Array.isArray(rows)||rows.length>20||rows.some(r=>!validRevision(r.revision)))throw Error("Historique invalide");return rows.map(r=>({revision:r.revision}));
  }
  async function historyVersion(revision){
   if(!session||!validRevision(revision))throw Error("Révision inaccessible");
   const rows=await request("/rest/v1/reconversion_progress_history?user_id=eq."+encodeURIComponent(session.user)+"&revision=eq."+revision+"&select=revision,payload&limit=1",{secure:true});
   if(!Array.isArray(rows)||rows.length!==1||rows[0].revision!==revision)throw Error("Version historique absente");return row(rows[0]);
  }
  async function logout(){const previous=session;generation++;session=null;refreshing=null;if(previous){try{await request("/auth/v1/logout?scope=local",{method:"POST",headers:{Authorization:"Bearer "+previous.access_token}});return true;}catch(e){return false;}}return true;}
  return {sendCode,verifyCode,resume,read,write,history,historyVersion,logout};
 }
 async function encrypt(snapshot,phrase,context){
  if(typeof phrase!=="string"||phrase.length<12||phrase.length>1024)throw Error("Phrase de chiffrement : 12 à 1024 caractères");
  // Freeze/validate before the first asynchronous KDF.
  const raw=bounded(snapshot),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const material=await crypto.subtle.importKey("raw",te.encode(phrase),"PBKDF2",false,["deriveKey"]);
  const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt"]);
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:te.encode(context)},key,te.encode(raw));
  return {v:1,kdf:"PBKDF2-SHA256",iterations:250000,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(cipher))};
 }
 async function decrypt(envelope,phrase,context){
  if(!envelope||envelope.v!==1||envelope.kdf!=="PBKDF2-SHA256"||envelope.iterations!==250000||Object.keys(envelope).sort().join(",")!=="ciphertext,iterations,iv,kdf,salt,v")throw Error("Format de sauvegarde cloud inconnu");
  try{
   if(typeof phrase!=="string"||phrase.length<12||phrase.length>1024)throw Error("Phrase");
   const salt=un64(envelope.salt,16),iv=un64(envelope.iv,12),cipher=un64(envelope.ciphertext,2097152);
   if(salt.length!==16||iv.length!==12||cipher.length<16)throw Error("Format");
   const material=await crypto.subtle.importKey("raw",te.encode(phrase),"PBKDF2",false,["deriveKey"]);
   const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["decrypt"]);
   const value=JSON.parse(td.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:te.encode(context)},key,cipher)));bounded(value);return value;
  }catch(e){throw Error("Déchiffrement impossible : mauvaise phrase ou données altérées");}
 }
 const progress="reconversion-control-progress-v1",auth="reconversion-control-session-v1";
 return Object.freeze({create,config,serialize,fingerprint,seal:(s,p)=>encrypt(s,p,progress),open:(s,p)=>decrypt(s,p,progress),sealSession:(s,p)=>encrypt(s,p,auth),openSession:(s,p)=>decrypt(s,p,auth)});
})();
