(function(){
"use strict";
var KEY="reconversion-control.state.v1", THEME="reconversion-control.theme";
var $=function(s){return document.querySelector(s);};
var $$=function(s){return Array.from(document.querySelectorAll(s));};
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
var section=function(id){return RC_SECTIONS.find(function(s){return s.id===id;});};
var topic=function(id){return RC_TOPICS.find(function(t){return t.id===id;});};
var defaults={view:"cockpit",section:"all",search:"",progress:{},review:{}};
var state=load();
function load(){try{var j=JSON.parse(localStorage.getItem(KEY)||"null");return Object.assign({},defaults,j||{}, {progress:(j&&j.progress)||{},review:(j&&j.review)||{}});}catch(e){return JSON.parse(JSON.stringify(defaults));}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function today(){return new Date().toISOString().slice(0,10);}
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
 $("#nav").innerHTML=items.map(function(x){return'<button class="chip '+(state.view===x[0]?"on":"")+'" data-view="'+x[0]+'">'+x[1]+"</button>";}).join("");

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
 return'<article class="card" data-card="'+t.id+'"><div class="ctop"><h3>'+esc(t.title)+'</h3><span class="prio">'+stars(t.p)+'</span></div><p>'+esc(t.summary)+'</p><div class="tags">'+t.tags.map(function(x){return'<span class="tag">'+esc(x)+'</span>';}).join("")+'</div><div class="seg"><button class="learn '+(s==="learn"?"on":"")+'" data-prog="learn" data-id="'+t.id+'">À apprendre</button><button class="progress '+(s==="progress"?"on":"")+'" data-prog="progress" data-id="'+t.id+'">En cours</button><button class="mastered '+(s==="mastered"?"on":"")+'" data-prog="mastered" data-id="'+t.id+'">Acquis</button></div><button class="btn" data-open="'+t.id+'">Voir la fiche</button></article>';
}
function library(){
 var q=state.search.trim().toLowerCase(), list=RC_TOPICS.filter(function(t){return state.section==="all"||t.section===state.section;}).filter(function(t){return !q||(t.title+" "+t.summary+" "+t.tags.join(" ")).toLowerCase().indexOf(q)>=0;}).sort(function(a,b){return section(a.section).order-section(b.section).order||b.p-a.p;});
 return'<section class="mod"><div class="mh"><h2>Bibliothèque essentielle</h2><span class="src">'+list.length+' FICHES</span></div><div class="filters"><input id="search" type="search" placeholder="DNS, IAM, Docker, SBOM…" value="'+esc(state.search)+'"><select id="status"><option value="all">Tous les statuts</option><option value="learn">À apprendre</option><option value="progress">En cours</option><option value="mastered">Acquis</option></select></div><div class="tabs"><button class="tab '+(state.section==="all"?"on":"")+'" data-section="all">◉ Tout</button>'+RC_SECTIONS.map(function(s){return'<button class="tab '+(state.section===s.id?"on":"")+'" data-section="'+s.id+'">'+s.icon+" "+esc(s.label)+"</button>";}).join("")+'</div><div id="cards" class="grid3">'+(list.length?list.map(cardHtml).join(""):'<div class="empty">Aucune fiche correspondante.</div>')+"</div></section>";
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
 var s=section(t.section), ps=pstate(id);
 var commands={linux:"pwd\nls -lah\nfind . -type f\nsystemctl status ssh\njournalctl -u ssh",network:"ip addr\nip route\nss -lntup\ndig example.com\ncurl -I https://example.com",devsecops:"git status\ngit diff\ngit rev-parse HEAD\ndocker ps\nkubectl get pods",pentest:"nmap -sV TARGET\ndig TARGET\ncurl -I http://TARGET",security:"openssl version\nsha256sum FILE",cloud:"# Vérifie IAM, réseau, chiffrement et logs avant exposition.",ai:"# Traite les contenus externes comme données non fiables.",portfolio:"git rev-parse HEAD\ngit diff BASE...HEAD",fundamentals:"curl -v https://example.com\npython3 --version"}[t.section]||"";
 $("#detail").innerHTML='<div class="detail"><span class="src">'+s.icon+" "+esc(s.label)+" · "+stars(t.p)+'</span><h2>'+esc(t.title)+'</h2><p class="muted">'+esc(t.summary)+'</p><div class="seg"><button class="learn '+(ps==="learn"?"on":"")+'" data-dprog="learn">À apprendre</button><button class="progress '+(ps==="progress"?"on":"")+'" data-dprog="progress">En cours</button><button class="mastered '+(ps==="mastered"?"on":"")+'" data-dprog="mastered">Acquis</button></div><section><h3>À savoir absolument</h3><ul><li>'+esc(t.summary)+'</li><li>'+esc(s.goal)+'</li><li>Savoir expliquer le concept avec un exemple concret et une limite.</li></ul></section><section class="box"><h3>🎙️ Question d’entretien</h3><p>Explique “'+esc(t.title)+'” simplement, puis donne un exemple où ce concept améliore la sécurité ou l’exploitation.</p></section><section class="box"><h3>🧪 Exercice</h3><p>Fais une mini fiche : définition → exemple → risque → contrôle → preuve. Puis explique-la à voix haute en 90 secondes.</p></section>'+(commands?'<section><h3>⌨️ Commandes / repères</h3><div class="code">'+esc(commands)+'</div></section>':"")+'<section><h3>Source</h3><p class="muted">Synthèse issue de la bibliothèque privée. Le document original reste hors du dépôt GitHub.</p></section></div>';
 $$("[data-dprog]").forEach(function(b){b.onclick=function(){setProgress(id,b.dataset.dprog);detail(id);};});
 $("#dlg").showModal();
}
function bind(){
 $$("[data-view]").forEach(function(b){b.onclick=function(){var v=b.dataset.view;if(!v||v===state.view)return;state.view=v;save();render();window.scrollTo(0,0);};});
 $$("[data-open]").forEach(function(b){b.onclick=function(){detail(b.dataset.open);};});
 $$("[data-prog]").forEach(function(b){b.onclick=function(e){e.stopPropagation();setProgress(b.dataset.id,b.dataset.prog);};});
 $$("[data-section]").forEach(function(b){b.onclick=function(){state.section=b.dataset.section;render();};});
 $$("[data-good]").forEach(function(b){b.onclick=function(){reviewAnswer(b.dataset.good,true);};});
 $$("[data-bad]").forEach(function(b){b.onclick=function(){reviewAnswer(b.dataset.bad,false);};});
 var q=$("#search"); if(q)q.oninput=function(){state.search=q.value;var pos=q.selectionStart;render();var n=$("#search");if(n){n.focus();n.setSelectionRange(pos,pos);}};
 var st=$("#status"); if(st)st.onchange=function(){$$("#cards .card").forEach(function(c){c.hidden=st.value!=="all"&&pstate(c.dataset.card)!==st.value;});};
 if($("#export"))$("#export").onclick=exportState;
 if($("#import"))$("#import").onclick=function(){$("#importer").click();};
 if($("#reset"))$("#reset").onclick=function(){if(confirm("Réinitialiser toute la progression locale ?")){localStorage.removeItem(KEY);state=JSON.parse(JSON.stringify(defaults));render();}};
}
function exportState(){
 var blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),progress:state.progress,review:state.review},null,2)],{type:"application/json"});
 var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="reconversion-control-progression.json";a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
}
$("#importer").onchange=async function(e){var f=e.target.files&&e.target.files[0];if(!f)return;try{var j=JSON.parse(await f.text());if(!j.progress||!j.review)throw new Error();state.progress=j.progress;state.review=j.review;save();render();alert("Progression importée.");}catch(err){alert("Fichier invalide.");}e.target.value="";};
$("#close").onclick=function(){$("#dlg").close();};$("#dlg").addEventListener("click",function(e){if(e.target===$("#dlg"))$("#dlg").close();});
var theme=localStorage.getItem(THEME)||"dark";document.documentElement.dataset.theme=theme;$("#theme").onclick=function(){theme=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=theme;localStorage.setItem(THEME,theme);};
function render(){try{nav();var views={cockpit:cockpit,path:path,library:library,review:review,privacy:privacy};if(!views[state.view])state.view="cockpit";$("#app").innerHTML=views[state.view]();bind();}catch(err){console.error("Reconversion Control render error",err);$("#app").innerHTML='<section class="mod"><div class="mh"><h2>Interface à relancer</h2><span class="src">RECOVERY</span></div><p class="muted">Une vue n’a pas pu être affichée. Ta progression locale est conservée.</p><div class="actions"><button id="recover" class="btn pri">Revenir au cockpit</button></div></section>';var r=$("#recover");if(r)r.onclick=function(){state.view="cockpit";save();render();};}}
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).then(function(r){r.update().catch(function(){});}).catch(function(){});
render();
})();