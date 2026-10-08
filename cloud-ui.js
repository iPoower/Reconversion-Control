"use strict";
/* Cloud opt-in UI. Privacy-first defaults: nothing uploaded until email OTP + passphrase
   and an explicit initial source selection. Remote version conflicts never silently overwrite. */
const RC_CLOUD_UI = (() => {
 let env=null,client=null,email="",phrase="",remote=null,remoteData=null,revision=null,baseline="",busy=false,applying=false,mode="setup",status="Non connecté : ta progression reste locale.",timer=null;
 function safe(s){return env.escape(String(s||""));}
 function local(){return JSON.stringify(env.snapshot());}
 function view(){
  const intro='<h3>☁️ Synchronisation chiffrée PC ↔ iPhone (optionnelle)</h3><p class="muted">Aucune donnée envoyée avant configuration. Une fois activée : progression, labs, révisions et Daily Five sont synchronisés lors des connexions. GPS et documents privés exclus. La phrase de chiffrement et les jetons de session ne sont jamais stockés durablement.</p>';
  const msg='<p id="rc-sync-status" role="status" aria-live="polite">'+safe(status)+'</p>';
  if(mode==="setup")return intro+'<p>Projet Supabase personnel requis. Utiliser uniquement son URL et sa clé PUBLIQUE sb_publishable_… ; jamais de service_role.</p><div class="rc-sync-form"><label>URL Supabase<input id="rc-sync-url" type="url" autocomplete="off" placeholder="https://projet.supabase.co"></label><label>Clé publique<input id="rc-sync-key" type="text" autocomplete="off" placeholder="sb_publishable_…"></label><label>Adresse email de connexion<input id="rc-sync-email" type="email" autocomplete="email"></label><button class="btn" id="rc-sync-request">Recevoir un code par email</button></div>'+msg;
  if(mode==="otp")return intro+'<p>Un code à usage unique a été demandé. La configuration Supabase doit utiliser le modèle de courriel <code>{{ .Token }}</code>.</p><div class="rc-sync-form"><label>Code reçu<input id="rc-sync-otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></label><label>Phrase secrète de chiffrement (au moins 12 caractères, identique sur les deux appareils)<input id="rc-sync-phrase" type="password" autocomplete="off"></label><button class="btn pri" id="rc-sync-verify">Déverrouiller</button><button class="btn" id="rc-sync-disconnect">Annuler</button></div>'+msg;
  let controls='<div class="actions"><button class="btn" id="rc-sync-now">Synchroniser maintenant</button><button class="btn" id="rc-sync-disconnect">Déconnecter</button></div>';
  if(mode==="choose"||mode==="conflict")controls='<p><b>'+safe(mode==="choose"?"Deux progressions existent. Choisis la source initiale.":"Conflit : les deux appareils ont changé. Aucun écrasement automatique.")+'</b></p><div class="actions"><button class="btn" id="rc-sync-take">Récupérer le cloud sur cet appareil</button><button class="btn" id="rc-sync-push">Envoyer cet appareil vers le cloud</button><button class="btn" id="rc-sync-disconnect">Déconnecter</button></div><p class="muted">Avant de remplacer une version, exporte une sauvegarde JSON. Le choix remplace les données concernées, sans fusion automatique ambiguë.</p>';
  return intro+msg+controls;
 }
 function repaint(){
  const root=typeof document!=="undefined"&&document.querySelector("#rc-sync");
  if(!root||!env)return;
  const label=document.querySelector("#rc-storage-label");
  if(label)label.textContent=mode==="active"?"CLOUD CHIFFRÉ · synchronisation active":mode==="setup"?"LOCAL · aucune progression envoyée":"LOCAL + CLOUD · connexion ou conflit en cours";
  root.innerHTML=view();bind();
 }
 function warn(t){status=t;repaint();}
 async function start(){
  try{
   const url=document.querySelector("#rc-sync-url").value,key=document.querySelector("#rc-sync-key").value;
   const mail=document.querySelector("#rc-sync-email").value.trim();
   client=RC_CLOUD_TRANSPORT.create({url,key});await client.sendCode(mail);
   email=mail;mode="otp";warn("Vérifie ta boîte mail puis saisis le code reçu.");
  }catch(e){warn("Connexion impossible : "+e.message);}
 }
 async function confirmOtp(){
  if(busy)return;busy=true;
  try{
   const otp=document.querySelector("#rc-sync-otp").value.trim(),p=document.querySelector("#rc-sync-phrase").value;
   if(p.length<12)throw Error("Phrase secrète trop courte (12 caractères minimum).");
   await client.verifyCode(email,otp);phrase=p;
   remote=await client.read();
   if(!remote){
    revision=await client.write(await RC_CLOUD_TRANSPORT.seal(env.snapshot(),phrase),null);
    baseline=local();mode="active";status="Première sauvegarde chiffrée créée. Synchronisation automatique active.";activate();
   }else{
    remoteData=await RC_CLOUD_TRANSPORT.open(remote.payload,phrase);
    revision=remote.revision;mode="choose";status="Une progression cloud existe déjà. Choisis laquelle conserver.";
   }
  }catch(e){status="Échec : "+e.message;}
  busy=false;repaint();
 }
 function activate(){
  if(timer)clearInterval(timer);
  timer=setInterval(tick,30000);
 }
 function dirty(){return local()!==baseline;}
 function changed(){
  if(!env||applying||mode!=="active")return;
  if(dirty())schedule();
 }
 let pending=null;
 function schedule(){if(pending)clearTimeout(pending);pending=setTimeout(tick,2000);}
 async function apply(data){
  applying=true;
  try{env.restore(data);baseline=local();}finally{applying=false;}
 }
 async function tick(){
  if(!client||busy||mode!=="active"||!navigator.onLine)return;
  busy=true;
  try{
   const latest=await client.read();
   if(!latest){mode="conflict";status="La sauvegarde cloud a disparu. Aucun changement local effacé.";return;}
   if(latest.revision!==revision){
    const decrypted=await RC_CLOUD_TRANSPORT.open(latest.payload,phrase);
    remote=latest;remoteData=decrypted;
    if(dirty()){mode="conflict";status="Conflit détecté : modifications sur deux appareils.";return;}
    await apply(decrypted);revision=latest.revision;status="Progression distante reçue automatiquement.";
   }else if(dirty()){
    revision=await client.write(await RC_CLOUD_TRANSPORT.seal(env.snapshot(),phrase),revision);
    baseline=local();status="Modifications locales sauvegardées et chiffrées dans le cloud.";
   }else status="À jour sur cet appareil et dans le cloud.";
  }catch(e){status="Synchronisation en attente : "+e.message+" · progression locale conservée.";}
  finally{busy=false;repaint();}
 }
 async function chooseCloud(){
  if(!remoteData||!confirm("Remplacer la progression locale par la copie cloud ? Exporte d'abord une sauvegarde si besoin."))return;
  try{await apply(remoteData);revision=remote.revision;mode="active";status="Progression cloud appliquée. Synchronisation automatique active.";activate();}
  catch(e){status="Import cloud refusé : "+e.message;}repaint();
 }
 async function chooseLocal(){
  if(!remote||!confirm("Remplacer la progression cloud par cet appareil ? Exporte d'abord une sauvegarde."))return;
  if(busy)return;busy=true;
  try{
   const latest=await client.read();
   if(!latest||latest.revision!==remote.revision)throw Error("La version cloud a encore changé. Actualise et réessaie.");
   revision=await client.write(await RC_CLOUD_TRANSPORT.seal(env.snapshot(),phrase),latest.revision);
   baseline=local();mode="active";status="Progression de cet appareil envoyée. Synchronisation automatique active.";activate();
  }catch(e){status="Envoi refusé : "+e.message;}
  busy=false;repaint();
 }
 function disconnect(){
  if(timer)clearInterval(timer);if(pending)clearTimeout(pending);
  timer=pending=null;
  if(client)client.logout();client=null;phrase="";email="";remote=remoteData=null;revision=null;baseline="";mode="setup";status="Déconnecté. Données locales conservées.";repaint();
 }
 function bind(){
  const on=(id,fn)=>{const el=document.querySelector("#"+id);if(el)el.onclick=fn;};
  on("rc-sync-request",start);on("rc-sync-verify",confirmOtp);on("rc-sync-take",chooseCloud);on("rc-sync-push",chooseLocal);on("rc-sync-disconnect",disconnect);on("rc-sync-now",tick);
 }
 function attach(options){env=options;return{render:view,bind,changed};}
 return {attach};
})();
