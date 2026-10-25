"use strict";
/* Runs before application scripts: public access never reads personal storage.
   The device choice is an explicit user statement, not device attestation. */
const RC_ACCESS_MODE=(()=>{
 const KEY="reconversion-control.device.mode.v1";let returned=null,started=false;
 const u=new URL(location.href),codes=u.searchParams.getAll("code");
 const tokenKeys=["access_token","refresh_token","provider_token","provider_refresh_token"];
 const implicit=tokenKeys.some(k=>u.searchParams.has(k)||new URLSearchParams(u.hash.slice(1)).has(k));
 if(codes.length||u.searchParams.has("error")||implicit){
  returned=implicit||codes.length>1?{error:"Retour de connexion refusé"}:u.searchParams.has("error")?{error:"Connexion Google annulée ou refusée"}:{code:codes[0]};
  ["code","error","error_description","error_code",...tokenKeys].forEach(k=>u.searchParams.delete(k));if(implicit)u.hash="";
  history.replaceState(null,"",u.pathname+u.search+u.hash);
 }
 function trusted(){try{return sessionStorage.getItem(KEY)==="personal";}catch(e){return false;}}
 async function enter(){
  if(started)return;started=true;
  try{sessionStorage.setItem(KEY,"personal");}catch(e){} // Local-only use may still run with storage unavailable.
  document.querySelector("#rc-access-screen").hidden=true;document.querySelector("#rc-private-shell").hidden=false;
  try{
   for(const source of document.querySelectorAll("script[data-rc-private-src]"))await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=source.getAttribute("data-rc-private-src");script.onload=resolve;script.onerror=()=>reject(Error("Chargement incomplet"));document.body.appendChild(script);});
   document.documentElement.dataset.rcPrivateReady="yes";
  }catch(e){const screen=document.querySelector("#rc-access-screen");screen.hidden=false;screen.textContent="Application incomplète : recharge avec le réseau. Aucun stockage existant effacé.";}
 }
 function ready(){
  if(trusted()){enter();return;}
  const screen=document.querySelector("#rc-access-screen");
  screen.innerHTML='<section class="mod"><h2>Choisir l’accès</h2><p>Sur un ordinateur professionnel ou partagé, consulte les cours publics sans connexion, sans progression personnelle et sans phrase secrète.</p><p><a class="btn pri" href="./courses-public.html">Consulter les cours sans connexion</a></p><label><input type="checkbox" id="rc-private-confirm"> Cet appareil est personnel et sous mon contrôle.</label><p><button class="btn" id="rc-private-enter">Ouvrir ma progression personnelle</button></p><p id="rc-access-message" role="status"></p></section>';
  if(returned)document.querySelector("#rc-access-message").textContent="Retour de connexion reçu sans contexte personnel autorisé. Recommence depuis ton appareil personnel.";
  document.querySelector("#rc-private-enter").onclick=()=>{if(!document.querySelector("#rc-private-confirm").checked){document.querySelector("#rc-access-message").textContent="Confirme que cet appareil est personnel, ou utilise les cours publics.";return;}enter();};
 }
 document.addEventListener("DOMContentLoaded",ready);
 return Object.freeze({takeOAuthReturn:()=>{const value=returned;returned=null;return value;},publicURL:()=>new URL("./courses-public.html",location.href).href});
})();
