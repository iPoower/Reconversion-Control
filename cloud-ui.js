"use strict";
/* Opt-in controller over the existing Supabase transport and atomic V3 adapter.
   Durable encrypted outbox; receipts scoped to provider + authenticated user. */
const RC_CLOUD_UI = (() => {
 const CONFIG="reconversion-control.cloud.config.v1",SESSION="reconversion-control.cloud.session.v1";
 let env,client,cfg,email="",phrase="",remember=false,user="",scope="",meta={v:1},remote=null,remoteData=null,googleIdentity=null;
 let revision=null,baseline="",busy=false,applying=false,mode="setup",status="Local uniquement · cloud non configuré.",timer=null,pending=null,epoch=0,retries=0,historyRows=[],restoredHere=false,lastFullRead=0;
 const FULL_READ_MS=600000;
 const T=()=>RC_CLOUD_TRANSPORT,now=()=>new Date().toISOString();
 function safe(s){return env.escape(String(s||""));}
 function load(key){const raw=localStorage.getItem(key);if(raw===null)return null;if(raw.length>4200000)throw Error("Métadonnées trop volumineuses");return JSON.parse(raw);}
 function save(key,value){const raw=JSON.stringify(value);if(raw.length>4200000)throw Error("Stockage cloud trop volumineux");localStorage.setItem(key,raw);if(localStorage.getItem(key)!==raw)throw Error("Relecture du journal cloud non confirmée");}
 function remove(key){localStorage.removeItem(key);if(localStorage.getItem(key)!==null)throw Error("Suppression de session non confirmée");}
 function local(){return T().serialize(env.snapshot());}
 function validate(data){return env.validate?env.validate(data):data;}
 function guard(ticket){if(ticket!==epoch)throw Error("Opération annulée");}
 function persist(next){if(next.v!==1)throw Error("Journal cloud incompatible : écriture refusée");save(scope,next);meta=next;}
 function dirty(){return local()!==baseline;}
 function delayed(){if(dirty())schedule();}
 function uploadStatus(message){return message+(dirty()?" De nouvelles modifications locales restent à synchroniser.":"");}
 function receipt(){return meta.ack?'<p class="muted">Dernière sauvegarde cloud confirmée : '+safe(meta.ack.at)+' · révision '+safe(meta.ack.revision)+'.</p>':"";}
 function view(){
  const intro='<h3>☁️ Synchronisation chiffrée PC ↔ iPhone (optionnelle)</h3><p class="muted">Local d’abord. Après activation et déverrouillage, la progression complète est chiffrée avant envoi. Phrase en mémoire seulement. Une app iPhone fermée reprend à la réouverture.</p>';
  const msg='<p id="rc-sync-status" role="status" aria-live="polite">'+safe(status)+'</p>'+receipt();
  const disconnect='<button class="btn" id="rc-sync-disconnect">Déconnecter</button>';
  if(mode==="setup")return intro+'<p>Connexion réservée à tes appareils personnels. Sur un PC professionnel, utilise les <a href="./courses-public.html">cours publics sans connexion</a>.</p><div class="rc-sync-form"><label>URL Supabase<input id="rc-sync-url" type="url" autocomplete="off" value="'+safe(cfg&&cfg.url)+'" placeholder="https://jsxbpxlipjmkszfektis.supabase.co"></label><label>Clé publique<input id="rc-sync-key" type="text" autocomplete="off" value="'+safe(cfg&&cfg.key)+'" placeholder="sb_publishable_…"></label><button class="btn pri" id="rc-sync-google">Continuer avec Google</button><p class="muted">Google identifie le compte. Ta phrase de chiffrement sera demandée ensuite ; elle ne sera pas transmise à Google ou Supabase.</p><details id="rc-sync-legacy"><summary>Connexion email existante</summary><label>Adresse email de connexion<input id="rc-sync-email" type="email" autocomplete="email"></label><label><input id="rc-sync-remember" type="checkbox"> Mémoriser la session chiffrée sur cet appareil privé</label><button class="btn" id="rc-sync-request">Recevoir un code par email</button></details></div>'+msg;
  if(mode==="oauth")return intro+'<p>Compte Google confirmé : <b id="rc-sync-account">'+safe(googleIdentity&&googleIdentity.email)+'</b></p><div class="rc-sync-form"><label><input type="checkbox" id="rc-sync-confirm-account"> Je confirme utiliser ce compte pour mes sauvegardes.</label><label>Phrase secrète (indépendante du compte Google)<input id="rc-sync-phrase" type="password" autocomplete="off"></label><label><input id="rc-sync-remember" type="checkbox"> Mémoriser la session sous chiffrement sur cet appareil personnel</label><button class="btn pri" id="rc-sync-google-unlock">Déverrouiller mes sauvegardes</button>'+disconnect+'</div>'+msg;
  if(mode==="otp"||mode==="locked")return intro+(mode==="otp"?'<p>Code email Supabase requis (modèle <code>{{ .Token }}</code>).</p>':'<p>Session chiffrée mémorisée. Déverrouille-la pour vérifier sa validité auprès de Supabase.</p>')+'<div class="rc-sync-form">'+(mode==="otp"?'<label>Code reçu<input id="rc-sync-otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></label>':'')+'<label>Phrase secrète (12 caractères minimum, identique sur les deux appareils)<input id="rc-sync-phrase" type="password" autocomplete="off"></label><button class="btn pri" id="rc-sync-'+(mode==="otp"?'verify':'unlock')+'">Déverrouiller</button>'+disconnect+'</div>'+msg;
  let controls='<div class="actions"><button class="btn" id="rc-sync-now">Synchroniser maintenant</button>'+disconnect+'</div>';
  if(mode==="initial")controls='<p>Le cloud est vide. Ta progression locale sera la source initiale. Vérifie d’abord ton export indépendant.</p><div class="actions"><button class="btn pri" id="rc-sync-create">Créer la première sauvegarde chiffrée</button>'+disconnect+'</div>';
  if(mode==="choose"||mode==="conflict")controls='<p><b>'+safe(mode==="choose"?'Choisis explicitement la source initiale.':'Conflit : aucune version remplacée automatiquement.')+'</b></p><div class="actions"><button class="btn" id="rc-sync-take">Récupérer le cloud sur cet appareil</button><button class="btn" id="rc-sync-push">Envoyer cet appareil vers le cloud</button><button class="btn" id="rc-sync-now">Revérifier les versions</button>'+disconnect+'</div><p class="muted">Chaque remplacement nécessite confirmation et copie locale de récupération. Exporte aussi une sauvegarde indépendante.</p>';
  if(mode==="error")controls='<div class="actions"><button class="btn" id="rc-sync-now">Réessayer la lecture cloud</button>'+disconnect+'</div>';
  const history=user?'<div class="actions"><button class="btn" id="rc-sync-history">Versions cloud précédentes</button></div>'+historyRows.map((r,i)=>'<button class="btn" data-sync-history="'+i+'">Récupérer la révision '+safe(r.revision)+'</button>').join(""):"";
  return intro+msg+controls+history;
 }
 function repaint(){
  const root=typeof document!=="undefined"&&document.querySelector("#rc-sync");if(!root||!env)return;
  const label=document.querySelector("#rc-storage-label");if(label)label.textContent=mode==="active"?"LOCAL + CLOUD CHIFFRÉ · voir l’état de sauvegarde":"LOCAL · cloud "+(cfg?"configuré":"non configuré");
  root.innerHTML=view();bind();
 }
 function warn(t){status=t;repaint();}
 function makeClient(ticket){
  return T().create(cfg,{sessionChanged:async session=>{
   guard(ticket);if(!remember)return;
   const encrypted=await T().sealSession(session,phrase);guard(ticket);save(SESSION,{v:1,project:cfg.url,payload:encrypted});
  }});
 }
 function readConfig(){
  const next=T().config(document.querySelector("#rc-sync-url").value,document.querySelector("#rc-sync-key").value);
  if(cfg&&next.url===cfg.url&&cfg.owner)next.owner=cfg.owner;return next;
 }
 async function startGoogle(){
  if(busy)return;busy=true;const ticket=++epoch;
  try{
   local();cfg=readConfig();save(CONFIG,cfg);remember=false;phrase="";client=makeClient(ticket);
   const callback=new URL("./",location.href);callback.search="";callback.hash="";
   const target=await client.beginOAuth(callback.href);guard(ticket);busy=false;location.assign(target);
  }catch(e){if(ticket===epoch){status="Connexion Google impossible : "+e.message;busy=false;repaint();}}
 }
 async function receiveGoogle(result){
  if(!cfg){status="Retour Google sans configuration : aucune donnée modifiée.";repaint();return;}
  const ticket=++epoch;remember=false;phrase="";busy=true;
  try{
   client=makeClient(ticket);
   if(result.error){client.cancelOAuth();throw Error(result.error);}
   const callback=new URL("./",location.href);callback.search="";callback.hash="";
   googleIdentity=await client.completeOAuth(result.code,callback.href);guard(ticket);user=googleIdentity.id;
   mode="oauth";status="Compte vérifié. Aucun instantané téléchargé ou envoyé avant déverrouillage et choix de source.";
  }catch(e){if(ticket===epoch){user="";googleIdentity=null;client=null;status="Connexion Google refusée : "+e.message;}}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 async function unlockGoogle(){
  if(busy||!client||!googleIdentity)return;busy=true;const ticket=epoch;
  try{
   if(!document.querySelector("#rc-sync-confirm-account").checked)throw Error("Confirme le compte affiché avant de continuer.");
   local();phrase=document.querySelector("#rc-sync-phrase").value;
   if(phrase.length<12||phrase.length>1024)throw Error("Phrase secrète : 12 à 1024 caractères.");
   if(cfg.owner&&cfg.owner!==user)throw Error("Compte différent du compte attendu : aucune progression transférée.");
   cfg={...cfg,owner:user};save(CONFIG,cfg);remember=!!document.querySelector("#rc-sync-remember").checked;
   if(remember)await client.rememberSession();else if(load(SESSION))remove(SESSION);
   guard(ticket);loadMeta();await inspect(ticket);
  }catch(e){if(ticket===epoch){status="Déverrouillage refusé : "+e.message;if(!["oauth","initial","choose"].includes(mode))mode="error";}}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 async function start(){
  if(busy)return;busy=true;const ticket=++epoch;
  try{
   local(); // Read-only/stale tabs must not rotate a shared authentication session.
   const mail=document.querySelector("#rc-sync-email").value.trim();
   cfg=readConfig();
   remember=!!document.querySelector("#rc-sync-remember").checked;save(CONFIG,cfg);
   client=makeClient(ticket);await client.sendCode(mail);guard(ticket);email=mail;mode="otp";status="Vérifie ta boîte mail puis saisis le code reçu.";
  }catch(e){if(ticket===epoch)status="Connexion impossible : "+e.message;}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 function loadMeta(){
  scope="reconversion-control.cloud.sync.v1:"+cfg.url+":"+user;meta=load(scope)||{v:1};
  if(meta.v!==1||meta.ack&&(!Number.isSafeInteger(meta.ack.revision)||!/^[a-f0-9]{64}$/.test(meta.ack.hash))||meta.pending&&(!/^[a-f0-9]{64}$/.test(meta.pending.hash)||!(meta.pending.expected===null||Number.isSafeInteger(meta.pending.expected))))throw Error("Journal cloud incompatible : récupération manuelle requise");
 }
 async function acknowledge(sent,next,ticket,payload){
  const hash=await T().fingerprint(sent),payloadHash=payload?await T().fingerprint(T().serialize(payload)):null;guard(ticket);
  persist({...meta,ack:{revision:next,hash,payloadHash,at:now()},pending:null});revision=next;baseline=sent;retries=0;lastFullRead=Date.now();
 }
 async function flush(ticket){
  const job=meta.pending;if(!job)return;
  const data=validate(await T().open(job.payload,phrase));guard(ticket);
  const sent=T().serialize(data);if(await T().fingerprint(sent)!==job.hash)throw Error("Journal d’envoi altéré");guard(ticket);
  local(); // A failed/unconfirmed local write must suspend network transmission.
  const next=await client.write(job.payload,job.expected);guard(ticket);await acknowledge(sent,next,ticket,job.payload);
 }
 async function upload(expected,ticket){
  if(meta.pending)throw Error("Un envoi précédent doit être résolu avant un nouvel envoi");
  const sent=local(),snapshot=JSON.parse(sent),payload=await T().seal(snapshot,phrase);guard(ticket);
  const hash=await T().fingerprint(sent);guard(ticket);local();
  persist({...meta,pending:{expected,hash,payload}});
  await flush(ticket);delayed();
 }
 async function inspect(ticket){
  loadMeta();
  let latest=await client.read();guard(ticket);
  if(meta.pending){
   const next=meta.pending.expected===null?1:meta.pending.expected+1;
   const matches=latest&&latest.revision===next&&T().serialize(latest.payload)===T().serialize(meta.pending.payload);
   const retry=(!latest&&meta.pending.expected===null)||(latest&&latest.revision===meta.pending.expected);
   if(matches||retry){await flush(ticket);latest=await client.read();guard(ticket);}
   else{remote=latest;remoteData=latest?validate(await T().open(latest.payload,phrase)):null;guard(ticket);mode="conflict";status="Conflit détecté : envoi précédent conservé, décision nécessaire.";return;}
  }
  remote=latest;
  if(!latest){mode=meta.ack?"conflict":"initial";remoteData=null;status=meta.ack?"La sauvegarde cloud a disparu. Aucun changement local effacé.":"Connecté et déverrouillé · aucune sauvegarde cloud. Confirmation initiale requise.";return;}
  remoteData=validate(await T().open(latest.payload,phrase));guard(ticket);
  const here=local(),hash=await T().fingerprint(here),there=T().serialize(remoteData);guard(ticket);
  // No automatic source selection without a durable receipt from this account.
  if(!meta.ack){mode="choose";status="Une progression cloud existe déjà. Choisis laquelle conserver.";return;}
  if(latest.revision<meta.ack.revision)throw Error("Révision distante obsolète : restauration automatique refusée");
  if(latest.revision===meta.ack.revision){
   if(await T().fingerprint(there)!==meta.ack.hash)throw Error("Même révision avec contenu différent : restauration refusée");guard(ticket);
   baseline=there;revision=latest.revision;mode="active";lastFullRead=Date.now();
   status=uploadStatus(meta.restore&&hash===meta.restore.hash&&!restoredHere?"Restauration vérifiée après réouverture · connecté et déverrouillé.":"Connecté et déverrouillé. Reprise de la synchronisation.");activate();delayed();return;
  }
  // Read/decrypt/hash may yield; take another snapshot before deciding to replace.
  if(hash!==meta.ack.hash||local()!==here){mode="conflict";status="Conflit détecté : modifications sur deux appareils.";return;}
  if(env.empty&&env.empty(remoteData)&&!env.empty(env.snapshot())){mode="conflict";status="Une version cloud vide nécessite une sélection explicite. Progression locale conservée.";return;}
  await apply(remoteData,latest.revision,ticket);mode="active";status="Progression distante relue localement. Restauration après réouverture à vérifier.";activate();
 }
 async function confirmOtp(){
  if(busy)return;busy=true;const ticket=epoch;
  try{
   local();
   phrase=document.querySelector("#rc-sync-phrase").value;
   if(phrase.length<12||phrase.length>1024)throw Error("Phrase secrète : 12 à 1024 caractères.");
   user=await client.verifyCode(email,document.querySelector("#rc-sync-otp").value.trim());guard(ticket);loadMeta();await inspect(ticket);
  }catch(e){if(ticket===epoch){status="Échec : "+e.message;if(user)mode="error";}}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 async function unlock(){
  if(busy)return;busy=true;const ticket=++epoch;
  try{
   local();
   phrase=document.querySelector("#rc-sync-phrase").value;remember=true;
   const saved=load(SESSION);if(!saved||saved.project!==cfg.url)throw Error("Session mémorisée absente ou incompatible");
   const session=await T().openSession(saved.payload,phrase);guard(ticket);client=makeClient(ticket);
   user=await client.resume(session);guard(ticket);loadMeta();await inspect(ticket);
  }catch(e){if(ticket===epoch){status="Déverrouillage refusé : "+e.message;if(user)mode="error";}}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 function activate(){if(timer)clearInterval(timer);timer=setInterval(()=>tick(true),30000);}
 function schedule(delay){if(pending)clearTimeout(pending);pending=setTimeout(()=>{pending=null;return tick();},delay||2000);}
 function changed(){
  if(!env||applying||mode!=="active")return;
  try{if(dirty()){status="Modifications locales en attente de sauvegarde cloud.";schedule();repaint();}}
  catch(e){warn("Sauvegarde cloud suspendue : "+e.message);}
 }
 async function apply(data,next,ticket){
  guard(ticket);const expected=local(),valid=validate(data);applying=true;
  try{
   if(env.preserve)env.preserve(JSON.parse(expected));
   guard(ticket);if(local()!==expected)throw Error("Progression locale modifiée pendant la réception");
   restoredHere=true;env.restore(valid);
   const restored=local();if(restored!==T().serialize(valid))throw Error("Relecture restaurée différente");
   await acknowledge(restored,next,ticket,remote&&remote.payload);guard(ticket);persist({...meta,restore:{hash:meta.ack.hash,revision:next}});
  }finally{applying=false;}
 }
 async function tick(periodic){
  if(periodic!==true)lastFullRead=0;
  if(!client||busy||!["active","conflict","error"].includes(mode))return;
  if(periodic===true&&document.hidden)return;
  if(!navigator.onLine){warn("Hors connexion · progression locale conservée, reprise à la reconnexion.");return;}
  busy=true;const ticket=epoch;
  try{
   loadMeta();
   if(mode!=="active"){await inspect(ticket);return;}
   if(meta.pending)await flush(ticket);
   // An unchanged metadata probe never replaces a payload check or creates a receipt.
   // Local edits, pending writes, manual actions and resumes always read the payload.
   const stamp=Date.now();
   if(periodic===true&&!dirty()&&meta.ack&&meta.ack.payloadHash&&lastFullRead>0&&stamp>=lastFullRead&&stamp-lastFullRead<FULL_READ_MS&&typeof client.readRevision==="function"){
    const head=await client.readRevision();guard(ticket);
    const checked=Date.now();
    if(head===revision&&lastFullRead>0&&checked>=lastFullRead&&checked-lastFullRead<FULL_READ_MS&&!dirty()){
     status="À jour sur cet appareil et dans le cloud · révision inchangée, dernière confirmation conservée.";return;
    }
   }
   const latest=await client.read();guard(ticket);
   if(!latest){mode="conflict";remote=remoteData=null;status="La sauvegarde cloud a disparu. Aucun changement local effacé.";return;}
   if(latest.revision!==revision){
    const decrypted=validate(await T().open(latest.payload,phrase));guard(ticket);remote=latest;remoteData=decrypted;
    if(latest.revision<revision)throw Error("Révision distante obsolète");
    if(dirty()){mode="conflict";status="Conflit détecté : modifications sur deux appareils.";return;}
    if(env.empty&&env.empty(decrypted)&&!env.empty(env.snapshot())){mode="conflict";status="Une version cloud vide nécessite une sélection explicite. Progression locale conservée.";return;}
    await apply(decrypted,latest.revision,ticket);status="Progression distante relue localement. Restauration après réouverture à vérifier.";
   }else {
    if(meta.ack&&meta.ack.payloadHash&&await T().fingerprint(T().serialize(latest.payload))!==meta.ack.payloadHash)throw Error("Contenu distant modifié sans nouvelle révision");guard(ticket);
    if(dirty()){await upload(revision,ticket);status=uploadStatus("Modifications locales sauvegardées et chiffrées dans le cloud.");}
    else status="À jour sur cet appareil et dans le cloud · sauvegarde cloud confirmée.";
   }
   lastFullRead=Date.now();delayed();
  }catch(e){if(ticket===epoch){lastFullRead=0;status="Synchronisation en attente : "+e.message+" · progression locale conservée.";schedule(Math.min(60000,2000*2**Math.min(retries++,5)));}}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 async function createFirst(){
  if(busy||mode!=="initial"||!confirm("Créer la première sauvegarde chiffrée de cette progression locale ? Vérifie ton export indépendant."))return;
  busy=true;const ticket=epoch;
  try{
   const latest=await client.read();guard(ticket);if(latest){await inspect(ticket);return;}
   if(meta.pending)await flush(ticket);else await upload(null,ticket);
   mode="active";status=uploadStatus("Première sauvegarde chiffrée confirmée. Synchronisation automatique active.");activate();delayed();
  }catch(e){if(ticket===epoch)status="Envoi initial en attente : "+e.message;}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 async function chooseCloud(){
  if(busy||!remoteData||!confirm("Remplacer la progression locale par la copie cloud ? Une copie locale de récupération sera vérifiée avant remplacement."))return;
  busy=true;const ticket=epoch;
  try{
   const before=local(),latest=await client.read();guard(ticket);
   if(!latest||latest.revision!==remote.revision||T().serialize(latest.payload)!==T().serialize(remote.payload)||local()!==before)throw Error("Une version a changé : revérifie les deux sources");
   if(meta.pending&&env.preserve)env.preserve(validate(await T().open(meta.pending.payload,phrase)));guard(ticket);
   if(local()!==before)throw Error("Progression locale modifiée");
   await apply(remoteData,latest.revision,ticket);mode="active";status="Progression cloud relue localement. Restauration après réouverture à vérifier.";activate();
  }catch(e){if(ticket===epoch)status="Import cloud refusé : "+e.message;}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 async function chooseLocal(){
  if(busy||!confirm("Remplacer la progression cloud par cet appareil ? Les copies à remplacer seront conservées localement. Vérifie ton export indépendant."))return;
  busy=true;const ticket=epoch;
  try{
   const latest=await client.read();guard(ticket);
   if((!latest&&remote)||latest&&(!remote||latest.revision!==remote.revision))throw Error("La version cloud a encore changé. Revérifie et réessaie.");
   if(latest&&env.preserve)env.preserve(validate(await T().open(latest.payload,phrase)));guard(ticket);
   if(meta.pending&&env.preserve)env.preserve(validate(await T().open(meta.pending.payload,phrase)));guard(ticket);
   persist({...meta,pending:null});await upload(latest?latest.revision:null,ticket);
   mode="active";status=uploadStatus("Progression de cet appareil envoyée. Synchronisation automatique active.");activate();delayed();
  }catch(e){if(ticket===epoch)status="Envoi refusé : "+e.message;}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 async function history(){
  if(busy||!client||!user)return;busy=true;const ticket=epoch;
  try{const rows=await client.history();guard(ticket);historyRows=rows;status=rows.length?"Versions chiffrées disponibles : sélectionner puis confirmer la récupération.":"Aucune version précédente disponible.";}
  catch(e){if(ticket===epoch)status="Historique indisponible : "+e.message+". Utilise ton export indépendant si nécessaire.";}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 async function restoreHistory(index){
  const r=historyRows[index];if(busy||!r||!confirm("Récupérer cette ancienne révision localement ? La synchronisation sera suspendue jusqu’à une nouvelle décision."))return;
  busy=true;const ticket=epoch;
  try{
   const before=local(),saved=await client.historyVersion(r.revision);guard(ticket);const data=validate(await T().open(saved.payload,phrase));guard(ticket);if(local()!==before)throw Error("Progression locale modifiée");
   if(env.preserve)env.preserve(JSON.parse(before));restoredHere=true;env.restore(data);
   if(local()!==T().serialize(data))throw Error("Relecture restaurée différente");
   mode="conflict";baseline="";status="Ancienne révision relue localement. Exporter puis revérifier les sources avant toute synchronisation.";
  }catch(e){if(ticket===epoch)status="Récupération refusée : "+e.message;}
  finally{if(ticket===epoch){busy=false;repaint();}}
 }
 async function disconnect(){
  const ticket=++epoch,previous=client;if(timer)clearInterval(timer);if(pending)clearTimeout(pending);timer=pending=null;
  client=null;phrase="";email="";user="";googleIdentity=null;remote=remoteData=null;revision=null;baseline="";meta={v:1};historyRows=[];busy=false;mode="setup";
  try{remove(SESSION);status="Déconnecté localement. Données et journal de récupération conservés.";}
  catch(e){status="Session en mémoire fermée ; suppression durable NON confirmée. Efface la session mémorisée avant de quitter cet appareil.";}
  repaint();if(previous){const revoked=await previous.logout();if(ticket===epoch&&!revoked){status+=" Révocation serveur non confirmée : reconnecte-toi au fournisseur pour révoquer la session.";repaint();}}
 }
 function bind(){
  const on=(id,fn)=>{const el=document.querySelector("#"+id);if(el)el.onclick=fn;};
  on("rc-sync-google",startGoogle);on("rc-sync-google-unlock",unlockGoogle);on("rc-sync-request",start);on("rc-sync-verify",confirmOtp);on("rc-sync-unlock",unlock);on("rc-sync-create",createFirst);on("rc-sync-take",chooseCloud);on("rc-sync-push",chooseLocal);on("rc-sync-disconnect",disconnect);on("rc-sync-now",tick);on("rc-sync-history",history);
  if(document.querySelectorAll)document.querySelectorAll("[data-sync-history]").forEach(el=>{el.onclick=()=>restoreHistory(Number(el.dataset.syncHistory));});
 }
 function attach(options){
  env=options;
  try{const saved=load(CONFIG);if(saved){cfg=T().config(saved.url,saved.key);if(saved.owner!==undefined){if(!/^[0-9a-f-]{36}$/i.test(saved.owner))throw Error("Compte mémorisé invalide");cfg.owner=saved.owner;}}if(cfg&&load(SESSION)){mode="locked";status="Session mémorisée chiffrée · déverrouillage requis, aucun envoi automatique.";}}
  catch(e){status="Cloud suspendu : configuration locale illisible. Progression locale conservée.";}
  if(typeof window!=="undefined"&&window.addEventListener){
   window.addEventListener("online",tick);
   window.addEventListener("offline",()=>{if(mode==="active")warn("Hors connexion · progression locale conservée, reprise à la reconnexion.");});
   window.addEventListener("pageshow",()=>{if(mode==="active")tick();});
  }
  if(document.addEventListener)document.addEventListener("visibilitychange",()=>{if(!document.hidden&&mode==="active")tick();});
  const returned=typeof RC_ACCESS_MODE!=="undefined"?RC_ACCESS_MODE.takeOAuthReturn():null;
  if(returned)Promise.resolve().then(()=>receiveGoogle(returned));
  return {render:view,bind,changed};
 }
 return {attach};
})();
