(function(){
"use strict";
var KEY="reconversion-control.state.v1", THEME="reconversion-control.theme";
var $=function(s){return document.querySelector(s);};
var $$=function(s){return Array.from(document.querySelectorAll(s));};
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
var section=function(id){return RC_SECTIONS.find(function(s){return s.id===id;});};
var topic=function(id){return RC_TOPICS.find(function(t){return t.id===id;});};
var views=["cockpit","path","library","review","privacy"], statuses=["learn","progress","mastered"];
var defaults={view:"cockpit",section:"all",search:"",status:"all",progress:{},review:{}};
var storageUnavailable=false, storageFailures=Object.create(null), progressUnread=false, detailOpener=null, detailId=null, libraryTabsScroll=0;
var state=load();
function storageStatus(key,failed){if(failed)storageFailures[key]=true;else delete storageFailures[key];storageUnavailable=Object.keys(storageFailures).length>0;}
function storageGet(key){try{var value=localStorage.getItem(key);storageStatus(key,false);return value;}catch(e){storageStatus(key,true);if(key===KEY)progressUnread=true;return null;}}
function storageSet(key,value,replace){
 if(key===KEY&&progressUnread&&!replace){storageNotice();return;}
 try{localStorage.setItem(key,value);if(key===KEY)progressUnread=false;storageStatus(key,false);}catch(e){storageStatus(key,true);}storageNotice();
}
function storageRemove(key){try{localStorage.removeItem(key);if(key===KEY)progressUnread=false;storageStatus(key,false);}catch(e){storageStatus(key,true);}storageNotice();}
function storageNotice(){
 var app=$("#app"), notice=$("#storage-notice");if(!app)return;
 if(!notice){notice=document.createElement("p");notice.id="storage-notice";notice.className="privacy";notice.setAttribute("role","status");app.parentNode.insertBefore(notice,app);}
 notice.hidden=!storageUnavailable;
 notice.textContent=storageUnavailable?"Le stockage local est indisponible. Tes changements restent en mémoire jusqu’à la fermeture de cette page. Exporte ta progression dans Sources & privacy pour la conserver.":"";
}
function plainObject(value){return !!value&&Object.prototype.toString.call(value)==="[object Object]";}
function validDate(value){return typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(Date.parse(value+"T12:00:00Z"))&&new Date(value+"T12:00:00Z").toISOString().slice(0,10)===value;}
function progression(data,strict){
 if(!plainObject(data)||!plainObject(data.progress)||!plainObject(data.review))throw new Error("Invalid progression");
 var result={progress:{},review:{}};
 Object.keys(data.progress).forEach(function(id){var value=data.progress[id];if(!topic(id)||statuses.indexOf(value)<0){if(strict)throw new Error("Invalid status");return;}result.progress[id]=value;});
 Object.keys(data.review).forEach(function(id){var r=data.review[id];if(!topic(id)||!plainObject(r)||!Number.isInteger(r.step)||r.step<0||r.step>5||!validDate(r.due)){if(strict)throw new Error("Invalid review");return;}result.review[id]={step:r.step,due:r.due};});
 return result;
}
function load(){
 var initial=JSON.parse(JSON.stringify(defaults));
 try{var j=JSON.parse(storageGet(KEY)||"null");if(!plainObject(j))return initial;
 var saved=progression({progress:plainObject(j.progress)?j.progress:{},review:plainObject(j.review)?j.review:{}},false);initial.progress=saved.progress;initial.review=saved.review;
 if(views.indexOf(j.view)>=0)initial.view=j.view;
 if(j.section==="all"||section(j.section))initial.section=j.section;
 if(typeof j.search==="string")initial.search=j.search;
 if(j.status==="all"||statuses.indexOf(j.status)>=0)initial.status=j.status;
 }catch(e){}return initial;
}
function save(replace){storageSet(KEY,JSON.stringify(state),replace);}
function today(){var now=new Date();return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");}
function addDays(d,n){var x=new Date(d+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);}
function daysBetween(a,b){return Math.round((Date.parse(a+"T12:00:00Z")-Date.parse(b+"T12:00:00Z"))/86400000);}
function pstate(id){return state.progress[id]||"learn";}
function setProgress(id,value){
 state.progress[id]=value;
 if(value==="mastered"){if(!state.review[id])state.review[id]={step:0,due:addDays(today(),1)};}
 else delete state.review[id];
 save(); render();
}
var schedule=[1,3,7,14,30,60];
function reviewAnswer(id,ok){
 var r=state.review[id]||{step:0,due:today()};
 if(!ok){r.step=0;r.due=addDays(today(),1);}
 else {r.step=Math.min(r.step+1,schedule.length-1);r.due=addDays(today(),schedule[r.step]);}
 state.review[id]=r; save(); render();
}
function progressFor(list){
 var total=list.length, mastered=list.filter(function(t){return pstate(t.id)==="mastered";}).length, inprog=list.filter(function(t){return pstate(t.id)==="progress";}).length;
 return{total:total,mastered:mastered,inprog:inprog,pct:total?Math.round((mastered+inprog*.5)*100/total):0};
}
function due(){return Object.keys(state.review).map(function(id){return{id:id,r:state.review[id],t:topic(id)};}).filter(function(x){return x.t&&x.r.due<=today();}).sort(function(a,b){return a.r.due.localeCompare(b.r.due);});}
function stars(n){return "★★★★★".slice(0,n)+"☆☆☆☆☆".slice(0,5-n);}
function nav(){
 var items=[["cockpit","◉ Cockpit"],["path","↗ Parcours"],["library","▦ Fiches"],["review","↻ Révisions"],["privacy","⌾ Sources & privacy"]];
 $("#nav").innerHTML=items.map(function(x){return'<button class="chip '+(state.view===x[0]?"on":"")+'" data-view="'+x[0]+'"'+(state.view===x[0]?' aria-current="page"':"")+'>'+x[1]+"</button>";}).join("");
}
function healthRows(){
 return RC_SECTIONS.map(function(s){var p=progressFor(RC_TOPICS.filter(function(t){return t.section===s.id;}));return'<div class="hr"><b>'+s.icon+" "+esc(s.label)+'</b><div class="bar"><i style="width:'+p.pct+'%"></i></div><span class="pct">'+p.pct+"%</span></div>";}).join("");
}
function focusTopic(){
 var list=RC_TOPICS.filter(function(t){return pstate(t.id)!=="mastered";}).sort(function(a,b){var sa=section(a.section).order,sb=section(b.section).order;return sa-sb||b.p-a.p;});
 return list[0]||RC_TOPICS[0];
}
function cockpit(){
 var p=progressFor(RC_TOPICS), d=due(), f=focusTopic();
 return'<div class="grid2"><section class="mod"><div class="mh"><h2>Knowledge Health</h2><span class="src">LOCAL</span></div><div class="hero"><h2>'+(p.pct>=80?"PRÊT À CONSOLIDER":p.pct>=45?"PROGRESSION ACTIVE":"BASES À CONSTRUIRE")+'</h2><p><strong>'+p.pct+' %</strong> de couverture pondérée · '+p.mastered+" acquis · "+p.inprog+' en cours</p></div><div class="health">'+healthRows()+'</div></section><section class="mod"><div class="mh"><h2>Briefing</h2><span class="src">PRIORITÉ</span></div><div class="metrics"><div class="metric"><small>Fiches</small><b>'+p.total+'</b></div><div class="metric"><small>Acquis</small><b>'+p.mastered+'</b></div><div class="metric"><small>À revoir</small><b>'+d.length+'</b></div><div class="metric"><small>Domaines</small><b>'+RC_SECTIONS.length+'</b></div></div><div class="hero"><h2>🎯 '+esc(f.title)+'</h2><p>'+esc(f.summary)+'</p><div class="actions" style="margin-top:10px"><button class="btn pri" data-open="'+f.id+'">Ouvrir la fiche</button><button class="btn" data-view="path">Voir le parcours</button></div></div></section></div><section class="mod"><div class="mh"><h2>Priorités ★★★★★</h2><span class="src">À SAVOIR</span></div><div class="grid3">'+RC_TOPICS.filter(function(t){return t.p===5&&pstate(t.id)!=="mastered";}).slice(0,6).map(cardHtml).join("")+'</div></section>';
}
function path(){
 return'<section class="mod"><div class="mh"><h2>Parcours recommandé</h2><span class="src">9 ÉTAPES</span></div><p class="muted">On consolide les couches dans l’ordre. Kubernetes, pentest avancé et sécurité IA deviennent beaucoup plus simples quand Linux, réseau et IAM sont solides.</p>'+RC_SECTIONS.map(function(s,i){var p=progressFor(RC_TOPICS.filter(function(t){return t.section===s.id;}));var active=p.pct<80&&RC_SECTIONS.slice(0,i).every(function(x){return progressFor(RC_TOPICS.filter(function(t){return t.section===x.id;})).pct>=50;});return'<div class="pathrow '+(active?"active":"")+'"><span class="num">'+(i+1)+'</span><div><b>'+s.icon+" "+esc(s.label)+'</b><div class="muted">'+esc(s.goal)+'</div></div><span class="score">'+p.pct+"%</span></div>";}).join("")+'</section>';
}
function cardHtml(t){
 var s=pstate(t.id);
 return'<article class="card" data-card="'+t.id+'"><div class="ctop"><h3>'+esc(t.title)+'</h3><span class="prio">'+stars(t.p)+'</span></div><p>'+esc(t.summary)+'</p><div class="tags">'+t.tags.map(function(x){return'<span class="tag">'+esc(x)+'</span>';}).join("")+'</div><div class="seg"><button class="learn '+(s==="learn"?"on":"")+'" aria-pressed="'+(s==="learn")+'" data-prog="learn" data-id="'+t.id+'">À apprendre</button><button class="progress '+(s==="progress"?"on":"")+'" aria-pressed="'+(s==="progress")+'" data-prog="progress" data-id="'+t.id+'">En cours</button><button class="mastered '+(s==="mastered"?"on":"")+'" aria-pressed="'+(s==="mastered")+'" data-prog="mastered" data-id="'+t.id+'">Acquis</button></div><button class="btn" data-open="'+t.id+'">Voir la fiche</button></article>';
}
function searchText(value){return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function libraryTopics(){
 var q=searchText(state.search.trim());return RC_TOPICS.filter(function(t){return state.section==="all"||t.section===state.section;}).filter(function(t){return state.status==="all"||pstate(t.id)===state.status;}).filter(function(t){return !q||searchText(t.title+" "+t.summary+" "+t.tags.join(" ")).indexOf(q)>=0;}).sort(function(a,b){return section(a.section).order-section(b.section).order||b.p-a.p;});
}
function libraryCards(list){return list.length?list.map(cardHtml).join(""):'<div class="empty">Aucune fiche correspondante.</div>';}
function updateLibrary(){var list=libraryTopics();$("#cards").innerHTML=libraryCards(list);$("#library-count").textContent=list.length+" FICHES";bindCards($("#cards"));}
function library(){
 var list=libraryTopics();
 return'<section class="mod"><div class="mh"><h2>Bibliothèque essentielle</h2><span id="library-count" class="src" role="status" aria-live="polite">'+list.length+' FICHES</span></div><div class="filters"><label class="field-label" for="search">Rechercher une fiche<input id="search" type="search" placeholder="DNS, IAM, Docker, SBOM…" value="'+esc(state.search)+'"></label><label class="field-label" for="status">Statut<select id="status">'+[["all","Tous les statuts"],["learn","À apprendre"],["progress","En cours"],["mastered","Acquis"]].map(function(x){return'<option value="'+x[0]+'"'+(state.status===x[0]?" selected":"")+'>'+x[1]+"</option>";}).join("")+'</select></label></div><div class="tabs"><button class="tab '+(state.section==="all"?"on":"")+'" aria-pressed="'+(state.section==="all")+'" data-section="all">◉ Tout</button>'+RC_SECTIONS.map(function(s){return'<button class="tab '+(state.section===s.id?"on":"")+'" aria-pressed="'+(state.section===s.id)+'" data-section="'+s.id+'">'+s.icon+" "+esc(s.label)+"</button>";}).join("")+'</div><div id="cards" class="grid3">'+libraryCards(list)+"</div></section>";
}
function review(){
 var d=due(), future=Object.keys(state.review).map(function(id){return{id:id,r:state.review[id],t:topic(id)};}).filter(function(x){return x.t&&x.r.due>today();}).sort(function(a,b){return a.r.due.localeCompare(b.r.due);}).slice(0,10);
 return'<div class="grid2"><section class="mod"><div class="mh"><h2>À revoir aujourd’hui</h2><span class="src">'+d.length+'</span></div><p class="muted">Cycle : J+1 · J+3 · J+7 · J+14 · J+30 · J+60.</p>'+(d.length?d.map(reviewRow).join(""):'<div class="empty">Aucune révision due. Passe une fiche en “Acquis” pour démarrer.</div>')+'</section><section class="mod"><div class="mh"><h2>À venir</h2><span class="src">'+future.length+'</span></div>'+(future.length?future.map(function(x){return'<div class="review"><div><b>'+esc(x.t.title)+'</b><small>'+esc(x.r.due)+'</small></div><span></span><span class="due">J+'+Math.max(0,daysBetween(x.r.due,today()))+'</span></div>';}).join(""):'<div class="empty">Rien de planifié.</div>')+"</section></div>";
}
function reviewRow(x){
 return'<div class="review"><div><b>'+esc(x.t.title)+'</b><small>'+section(x.t.section).icon+" "+esc(section(x.t.section).label)+'</small></div><span></span><div class="actions"><button class="btn sm" data-bad="'+x.id+'">À revoir</button><button class="btn sm pri" data-good="'+x.id+'">Bien retenu</button></div></div>';
}
function privacy(){
 return'<div class="grid2"><section class="mod"><div class="mh"><h2>Sources pédagogiques</h2><span class="src">DRIVE PRIVÉ</span></div>'+RC_SOURCES.map(function(s){return'<div><b>'+esc(s)+'</b><div class="muted">Référence utilisée pour synthétiser les fiches · document non publié.</div></div>';}).join("")+'</section><section class="mod"><div class="mh"><h2>Confidentialité</h2><span class="src">BY DESIGN</span></div><div class="privacy"><b>✅ Aucun document Drive dans GitHub</b><br>Pas d’URL privée ni d’identifiant de fichier dans le build public.</div><div class="privacy"><b>✅ Progression locale</b><br>Statuts et révisions restent dans localStorage sur ton appareil.</div><div class="privacy"><b>✅ Aucun analytics / backend</b><br>L’application n’envoie pas ta progression.</div><div class="actions"><button id="export" class="btn">Exporter</button><button id="import" class="btn">Importer</button><button id="reset" class="btn">Réinitialiser</button></div></section></div>';
}
function detail(id){
 var t=topic(id); if(!t)return;
 var dlg=$("#dlg");if(!dlg.open&&!dlg.hasAttribute("open"))detailOpener=document.activeElement;detailId=id;
 var s=section(t.section), ps=pstate(id);
 var commands={linux:"pwd\nls -lah\nfind . -type f\nsystemctl status ssh\njournalctl -u ssh",network:"ip addr\nip route\nss -lntup\ndig example.com\ncurl -I https://example.com",devsecops:"git status\ngit diff\ngit rev-parse HEAD\ndocker ps\nkubectl get pods",pentest:"nmap -sV TARGET\ndig TARGET\ncurl -I http://TARGET",security:"openssl version\nsha256sum FILE",cloud:"# Vérifie IAM, réseau, chiffrement et logs avant exposition.",ai:"# Traite les contenus externes comme données non fiables.",portfolio:"git rev-parse HEAD\ngit diff BASE...HEAD",fundamentals:"curl -v https://example.com\npython3 --version"}[t.section]||"";
 $("#detail").innerHTML='<div class="detail"><span class="src">'+s.icon+" "+esc(s.label)+" · "+stars(t.p)+'</span><h2 id="detail-title">'+esc(t.title)+'</h2><p class="muted">'+esc(t.summary)+'</p><div class="seg"><button class="learn '+(ps==="learn"?"on":"")+'" data-dprog="learn">À apprendre</button><button class="progress '+(ps==="progress"?"on":"")+'" data-dprog="progress">En cours</button><button class="mastered '+(ps==="mastered"?"on":"")+'" data-dprog="mastered">Acquis</button></div><section><h3>À savoir absolument</h3><ul><li>'+esc(t.summary)+'</li><li>'+esc(s.goal)+'</li><li>Savoir expliquer le concept avec un exemple concret et une limite.</li></ul></section><section class="box"><h3>🎙️ Question d’entretien</h3><p>Explique “'+esc(t.title)+'” simplement, puis donne un exemple où ce concept améliore la sécurité ou l’exploitation.</p></section><section class="box"><h3>🧪 Exercice</h3><p>Fais une mini fiche : définition → exemple → risque → contrôle → preuve. Puis explique-la à voix haute en 90 secondes.</p></section>'+(commands?'<section><h3>⌨️ Commandes / repères</h3><div class="code">'+esc(commands)+'</div></section>':"")+'<section><h3>Source</h3><p class="muted">Synthèse issue de la bibliothèque privée. Le document original reste hors du dépôt GitHub.</p></section></div>';
 $$("[data-dprog]").forEach(function(b){b.setAttribute("aria-pressed",String(ps===b.dataset.dprog));b.onclick=function(){setProgress(id,b.dataset.dprog);detail(id);};});
 if(!dlg.open&&!dlg.hasAttribute("open")){
  if(typeof dlg.showModal==="function")dlg.showModal();
  else{dlg.setAttribute("open","");dlg.classList.add("dialog-fallback");document.body.classList.add("dialog-open");$("#close").focus();}
 }
}
function bindCards(root){
 Array.from(root.querySelectorAll("[data-open]")).forEach(function(b){b.onclick=function(){detail(b.dataset.open);};});
 Array.from(root.querySelectorAll("[data-prog]")).forEach(function(b){b.onclick=function(e){e.stopPropagation();setProgress(b.dataset.id,b.dataset.prog);};});
}
function bind(){
 $$("[data-view]").forEach(function(b){b.onclick=function(){state.view=b.dataset.view;save();render();$("#nav [aria-current]").focus({preventScroll:true});};});
 bindCards($("#app"));
 $$("[data-section]").forEach(function(b){b.onclick=function(){state.section=b.dataset.section;save();render();$("[data-section=\""+state.section+"\"]").focus({preventScroll:true});};});
 $$("[data-good]").forEach(function(b){b.onclick=function(){reviewAnswer(b.dataset.good,true);};});
 $$("[data-bad]").forEach(function(b){b.onclick=function(){reviewAnswer(b.dataset.bad,false);};});
 var q=$("#search"); if(q)q.oninput=function(){state.search=q.value;save();updateLibrary();};
 var st=$("#status"); if(st)st.onchange=function(){state.status=st.value;save();updateLibrary();};
 if($("#export"))$("#export").onclick=exportState;
 if($("#import"))$("#import").onclick=function(){$("#importer").click();};
 if($("#reset"))$("#reset").onclick=function(){if(confirm("Réinitialiser toute la progression locale ?")){storageRemove(KEY);state=JSON.parse(JSON.stringify(defaults));render();}};
}
function exportState(){
 var blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),progress:state.progress,review:state.review},null,2)],{type:"application/json"});
 var a=document.createElement("a"), url=URL.createObjectURL(blob);a.href=url;a.download="reconversion-control-progression.json";a.hidden=true;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},60000);
}
function readFile(file){return typeof file.text==="function"?file.text():new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(reader.result);};reader.onerror=function(){reject(reader.error);};reader.readAsText(file);});}
$("#importer").onchange=async function(e){var f=e.target.files&&e.target.files[0];if(!f)return;try{if(f.size>1024*1024)throw new Error("Too large");var j=JSON.parse(await readFile(f));if(!plainObject(j)||(j.version!==undefined&&j.version!==1))throw new Error("Invalid version");var imported=progression(j,true);state.progress=imported.progress;state.review=imported.review;save(true);render();alert(storageUnavailable?"Progression importée en mémoire. Le stockage local reste indisponible.":"Progression importée.");}catch(err){alert("Fichier invalide. La progression actuelle est conservée.");}e.target.value="";};
function afterDetailClose(){document.body.classList.remove("dialog-open");$("#dlg").classList.remove("dialog-fallback");var focus=detailOpener&&detailOpener.isConnected?detailOpener:$("[data-open=\""+detailId+"\"]")||$("#nav [aria-current]");if(focus)focus.focus({preventScroll:true});detailOpener=null;}
function closeDetail(){var dlg=$("#dlg");if(typeof dlg.close==="function")dlg.close();else{dlg.removeAttribute("open");afterDetailClose();}}
$("#close").onclick=closeDetail;$("#dlg").addEventListener("click",function(e){if(e.target===$("#dlg"))closeDetail();});$("#dlg").addEventListener("close",afterDetailClose);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&$("#dlg").classList.contains("dialog-fallback"))closeDetail();});
var theme=storageGet(THEME)==="light"?"light":"dark";document.documentElement.dataset.theme=theme;$("#theme").onclick=function(){theme=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=theme;storageSet(THEME,theme);};
function render(){var navScroll=$("#nav").scrollLeft, tabs=$(".tabs");if(tabs)libraryTabsScroll=tabs.scrollLeft;nav();var f={cockpit:cockpit,path:path,library:library,review:review,privacy:privacy}[state.view]||cockpit;$("#app").innerHTML=f();$("#nav").scrollLeft=navScroll;tabs=$(".tabs");if(tabs)tabs.scrollLeft=libraryTabsScroll;bind();storageNotice();}
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).catch(function(){});
render();
})();
