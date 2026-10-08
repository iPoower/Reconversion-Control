"use strict";
/* Optional Supabase transport. No network unless explicitly configured and authenticated.
   Public publishable key only; SQL RLS mandatory; payload encrypted client-side. */
const RC_CLOUD_TRANSPORT = (() => {
 const te=new TextEncoder(),td=new TextDecoder();
 const b64=bytes=>btoa(String.fromCharCode(...bytes));
 const un64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const aad=te.encode("reconversion-control-progress-v1");
 function config(url,key){
  const u=new URL(String(url||"").trim());
  if(u.protocol!=="https:"||!/^[-a-z0-9]+\.supabase\.co$/i.test(u.hostname)||u.username||u.password||u.search||u.hash)throw Error("URL Supabase invalide");
  if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(String(key||"")))throw Error("Utiliser uniquement une clé publique sb_publishable_… (jamais une clé secret/service_role)");
  return {url:u.origin,key};
 }
 function create(cfg){
  const base=config(cfg.url,cfg.key);let session=null;
  async function request(path,init={}){
   const headers={"apikey":base.key,"Content-Type":"application/json",...(init.headers||{})};
   if(init.secure){const token=await access();headers.Authorization="Bearer "+token;}
   const res=await fetch(base.url+path,{method:init.method||"GET",headers,body:init.body?JSON.stringify(init.body):undefined,cache:"no-store"});
   if(!res.ok)throw Error("Service cloud : erreur HTTP "+res.status);
   const raw=await res.text();return raw?JSON.parse(raw):null;
  }
  async function sendCode(email){
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error("Adresse email incorrecte");
   await request("/auth/v1/otp",{method:"POST",body:{email,create_user:true}});
  }
  async function verifyCode(email,token){
   if(!/^\d{6,8}$/.test(token))throw Error("Code OTP attendu (6 à 8 chiffres)");
   const j=await request("/auth/v1/verify",{method:"POST",body:{email,token,type:"email"}});
   if(!j||!j.access_token||!j.refresh_token||!j.user||!j.user.id)throw Error("Authentification non confirmée");
   session={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Date.now()+(j.expires_in||3600)*1000,user:j.user.id};return session.user;
  }
  async function access(){
   if(!session)throw Error("Non connecté");
   if(Date.now()<session.expires_at-60000)return session.access_token;
   const j=await request("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:{refresh_token:session.refresh_token}});
   if(!j||!j.access_token||!j.refresh_token)throw Error("Session expirée");
   session={...session,access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Date.now()+(j.expires_in||3600)*1000};
   return session.access_token;
  }
  async function read(){
   if(!session)throw Error("Non connecté");
   const rows=await request("/rest/v1/reconversion_progress?user_id=eq."+encodeURIComponent(session.user)+"&select=revision,payload",{secure:true});
   if(!Array.isArray(rows))throw Error("Réponse cloud invalide");
   return rows[0]||null;
  }
  async function write(payload,revision){
   if(!session)throw Error("Non connecté");
   const initial=revision===null;
   const path="/rest/v1/reconversion_progress"+(initial?"":"?user_id=eq."+encodeURIComponent(session.user)+"&revision=eq."+revision);
   const headers={"Prefer":"return=representation"};
   const body=initial?{user_id:session.user,revision:1,payload}:{revision:revision+1,payload};
   const rows=await request(path,{secure:true,method:initial?"POST":"PATCH",headers,body});
   if(!Array.isArray(rows)||rows.length!==1)throw Error("Conflit de version : modification distante détectée ; aucune donnée écrasée");
   return rows[0].revision;
  }
  function logout(){session=null;}
  return {sendCode,verifyCode,read,write,logout};
 }
 async function seal(snapshot,phrase){
  if(typeof phrase!=="string"||phrase.length<12)throw Error("Phrase de chiffrement : 12 caractères minimum");
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const base=await crypto.subtle.importKey("raw",te.encode(phrase),"PBKDF2",false,["deriveKey"]);
  const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt"]);
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:aad},key,te.encode(JSON.stringify(snapshot)));
  return {v:1,kdf:"PBKDF2-SHA256",iterations:250000,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(cipher))};
 }
 async function open(envelope,phrase){
  if(!envelope||envelope.v!==1||envelope.kdf!=="PBKDF2-SHA256"||envelope.iterations!==250000)throw Error("Format de sauvegarde cloud inconnu");
  try{
   const salt=un64(envelope.salt),iv=un64(envelope.iv),cipher=un64(envelope.ciphertext);
   if(salt.length!==16||iv.length!==12||cipher.length>2097152)throw Error("Format");
   const base=await crypto.subtle.importKey("raw",te.encode(phrase),"PBKDF2",false,["deriveKey"]);
   const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
   return JSON.parse(td.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:aad},key,cipher)));
  }catch(e){throw Error("Déchiffrement impossible : mauvaise phrase ou données altérées");}
 }
 return Object.freeze({create,seal,open,config});
})();
