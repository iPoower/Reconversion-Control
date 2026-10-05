(function(){
"use strict";
var KEY="reconversion-control.state.v1", THEME="reconversion-control.theme";
var $=function(s){return document.querySelector(s);};
var $$=function(s){return Array.from(document.querySelectorAll(s));};
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
var section=function(id){return RC_SECTIONS.find(function(s){return s.id===id;});};
var topic=function(id){return RC_TOPICS.find(function(t){return t.id===id;});};
var views=["cockpit","path","library","course","review","privacy"], statuses=["learn","progress","mastered"];
var RC_COURSE_LEVELS=[
 {id:"beginner",label:"Débutant",labelEn:"Beginner",icon:"🟢",goal:"Comprendre d’abord comment une application Web fonctionne, puis comment on la versionne, la construit et la rend installable.",goalEn:"Understand how a web app works before learning how to version, build and install it."},
 {id:"intermediate",label:"Intermédiaire",labelEn:"Intermediate",icon:"🟡",goal:"Appliquer les bases aux vraies données Race Control : météo, pneus, agenda, trajets, GPS et décision utilisateur.",goalEn:"Apply the fundamentals to real Race Control data: weather, tyres, calendar, trips, GPS and user decisions."},
 {id:"pro",label:"Pro",labelEn:"Pro",icon:"🔴",goal:"Passer du développement à l’exploitation : cloud, confidentialité, diagnostic, tests, CI/CD, incidents, refactor et entretien.",goalEn:"Move from development to operations: cloud, privacy, debugging, testing, CI/CD, incidents, refactoring and interviews."}
];
var RC_CURRICULUM=[
 {id:"rc-01",level:"beginner",phase:"Vue d’ensemble"},
 {id:"rc-03",level:"beginner",phase:"Bases du Web"},
 {id:"rc-04",level:"beginner",phase:"Bases du Web"},
 {id:"rc-05",level:"beginner",phase:"Bases du Web"},
 {id:"rc-06",level:"beginner",phase:"Bases du Web"},
 {id:"rc-07",level:"beginner",phase:"Travailler comme un développeur"},
 {id:"rc-02",level:"beginner",phase:"Travailler comme un développeur"},
 {id:"rc-08",level:"beginner",phase:"Travailler comme un développeur"},
 {id:"rc-09",level:"beginner",phase:"Travailler comme un développeur"},

 {id:"rc-10",level:"intermediate",phase:"Données météo et risque"},
 {id:"rc-11",level:"intermediate",phase:"Données météo et risque"},
 {id:"rc-12",level:"intermediate",phase:"Données météo et risque"},
 {id:"rc-13",level:"intermediate",phase:"Données météo et risque"},
 {id:"rc-14",level:"intermediate",phase:"Données météo et risque"},
 {id:"rc-15",level:"intermediate",phase:"Agenda, trajets et position"},
 {id:"rc-16",level:"intermediate",phase:"Agenda, trajets et position"},
 {id:"rc-18",level:"intermediate",phase:"Agenda, trajets et position"},
 {id:"rc-17",level:"intermediate",phase:"Agenda, trajets et position"},
 {id:"rc-19",level:"intermediate",phase:"Agenda, trajets et position"},
 {id:"rc-20",level:"intermediate",phase:"Décision utilisateur"},
 {id:"rc-21",level:"intermediate",phase:"Décision utilisateur"},

 {id:"rc-22",level:"pro",phase:"Cloud et confidentialité"},
 {id:"rc-24",level:"pro",phase:"Cloud et confidentialité"},
 {id:"rc-23",level:"pro",phase:"Cloud et confidentialité"},
 {id:"rc-29",level:"pro",phase:"Diagnostiquer et tester"},
 {id:"rc-25",level:"pro",phase:"Diagnostiquer et tester"},
 {id:"rc-26",level:"pro",phase:"Livrer et revenir en arrière"},
 {id:"rc-27",level:"pro",phase:"Livrer et revenir en arrière"},
 {id:"rc-28",level:"pro",phase:"Livrer et revenir en arrière"},
 {id:"rc-30",level:"pro",phase:"Consolider et expliquer"},
 {id:"rc-31",level:"pro",phase:"Consolider et expliquer"},
 {id:"rc-32",level:"pro",phase:"Consolider et expliquer"}
];
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
function due(){return Object.keys(state.review).map(function(id){return{id:id,r:state.review[id],t:topic(id)};}).filter(function(x){return x.t&&x.r.due<=today();}).sort(function(a,b){var d=a.r.due.localeCompare(b.r.due);if(d)return d;var sa=studyStep(a.id)||999,sb=studyStep(b.id)||999;return sa-sb;});}
function stars(n){return "★★★★★".slice(0,n)+"☆☆☆☆☆".slice(0,5-n);}
function englishData(id){return typeof RC_ENGLISH!=="undefined"&&RC_ENGLISH[id]?RC_ENGLISH[id]:null;}
function englishIntensity(level){return level&&level.id==="beginner"?25:level&&level.id==="intermediate"?50:75;}
function englishSupport(level){
 if(level&&level.id==="beginner")return "Lis d’abord la phrase anglaise, puis compare avec le français. Réponds une fois en français, puis reformule en anglais.";
 if(level&&level.id==="intermediate")return "Lis d’abord sans traduction. Réponds en anglais en 2–3 phrases, puis utilise le français seulement pour vérifier.";
 return "Réponds d’abord en anglais comme en entretien. Ouvre l’aide française uniquement pour vérifier le sens.";
}
function englishCoachHtml(lesson,level){
 var en=englishData(lesson.id);if(!en)return"";
 var pct=englishIntensity(level), frHelp=level&&level.id==="beginner"?'<p class="en-fr-help"><b>🇫🇷 Sens :</b> '+esc(en.phraseFr)+'</p>':'<details class="answer en-fr-help"><summary>🇫🇷 Aide française · French help</summary><p>'+esc(en.phraseFr)+'</p></details>';
 return'<section class="english-coach" data-english-level="'+pct+'"><div class="mh"><h3>🇬🇧 English Coach</h3><span class="src">'+pct+'% EN</span></div><p class="en-mode">'+esc(englishSupport(level))+'</p><h4 lang="en">'+esc(en.title)+'</h4><p class="en-summary" lang="en">'+esc(en.summary)+'</p><div class="en-phrase"><b>Key sentence · Phrase clé</b><p lang="en">'+esc(en.phrase)+'</p>'+frHelp+'</div><div class="en-vocab"><b>Vocabulary · Vocabulaire</b><div class="en-vocab-grid">'+en.vocab.map(function(pair){return'<span><strong lang="en">'+esc(pair[0])+'</strong><small>'+esc(pair[1])+'</small></span>';}).join("")+'</div></div><div class="en-speaking"><b>🎤 Speaking challenge · Défi oral</b><p lang="en">'+esc(en.question)+'</p><small>Objectif : réponds à voix haute, même avec des phrases simples.</small></div></section>';
}
function nav(){
 var items=[["cockpit","◉ Cockpit"],["path","↗ Parcours · Path"],["library","▦ Fiches · Notes"],["course","▤ Cours · Study"],["review","↻ Révisions · Review"],["privacy","⌾ Sources & privacy"]];
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
function curriculumItem(id){return RC_CURRICULUM.find(function(item){return item.id===id;})||null;}
function studyStep(id){var i=RC_CURRICULUM.findIndex(function(item){return item.id===id;});return i<0?0:i+1;}
function orderedLessons(){return RC_CURRICULUM.map(function(item){return RC_LESSON_MAP[item.id];}).filter(Boolean);}
function courseLevelFor(item){var entry=item&&curriculumItem(item.id);return entry?RC_COURSE_LEVELS.find(function(level){return level.id===entry.level;})||null:null;}
function courseLessons(level){return RC_CURRICULUM.filter(function(item){return item.level===level.id;}).map(function(item){return RC_LESSON_MAP[item.id];}).filter(Boolean);}
function coursePhases(level){
 var phases=[];
 RC_CURRICULUM.filter(function(item){return item.level===level.id;}).forEach(function(item){
  var phase=phases.find(function(p){return p.label===item.phase;});
  if(!phase){phase={label:item.phase,ids:[]};phases.push(phase);}
  phase.ids.push(item.id);
 });
 return phases;
}
function activeCourseLevel(){return RC_COURSE_LEVELS.find(function(level){var lessons=courseLessons(level);return progressFor(lessons).mastered<lessons.length;})||RC_COURSE_LEVELS[RC_COURSE_LEVELS.length-1];}
function courseLevelState(level,active){var p=progressFor(courseLessons(level));return p.mastered===p.total?"TERMINÉ":level.id===active.id?"NIVEAU ACTIF":"À VENIR";}
function levelStepRange(level){var steps=RC_CURRICULUM.map(function(item,i){return item.level===level.id?i+1:null;}).filter(Boolean);return steps[0]+"–"+steps[steps.length-1];}
function courseRoadmapCard(level,active){var lessons=courseLessons(level),p=progressFor(lessons),status=courseLevelState(level,active);return '<article class="course-stage '+(level.id===active.id?"active":"")+'" data-level-card="'+level.id+'"><span class="src">'+level.icon+" "+esc(level.label.toUpperCase())+" · "+esc(level.labelEn.toUpperCase())+'</span><b>'+p.mastered+" / "+p.total+' acquis · mastered</b><div class="bar"><i style="width:'+p.pct+'%"></i></div><small>'+status+' · étapes / steps '+levelStepRange(level)+'</small></article>';}
function courseLevelSection(level,active){
 var lessons=courseLessons(level),p=progressFor(lessons),status=courseLevelState(level,active),phases=coursePhases(level);
 return '<details class="course-level" data-course-level="'+level.id+'"'+(level.id===active.id?" open":"")+'><summary><span class="level-title">'+level.icon+" "+esc(level.label)+' <small lang="en">/ '+esc(level.labelEn)+'</small></span><span class="level-meta">'+status+" · "+p.mastered+"/"+p.total+" acquis · étapes "+levelStepRange(level)+'</span></summary><div class="course-level-body"><p class="muted">'+esc(level.goal)+'</p><p class="level-goal-en" lang="en">'+esc(level.goalEn)+'</p>'+phases.map(function(phase){return '<section class="study-phase"><div class="mh"><h3>'+esc(phase.label)+'</h3><span class="src">'+phase.ids.length+' ÉTAPE'+(phase.ids.length>1?"S":"")+'</span></div><div class="grid3">'+phase.ids.map(function(id){return cardHtml(topic(id));}).join("")+'</div></section>';}).join("")+'</div></details>';
}
function cardHtml(t){
 var s=pstate(t.id);
 var level=t.chapter?courseLevelFor(t):null, step=t.chapter?studyStep(t.id):0, entry=t.chapter?curriculumItem(t.id):null, en=t.chapter?englishData(t.id):null;
 return'<article class="card" data-card="'+t.id+'">'+(t.chapter?'<span class="src">'+level.icon+' '+esc(level.label.toUpperCase())+' · ÉTAPE '+step+' · '+esc(entry.phase.toUpperCase())+'</span>':'<span class="src">FICHE ESSENTIELLE · CORE NOTE</span>')+'<div class="ctop"><h3>'+esc(t.title)+'</h3><span class="prio">'+stars(t.p)+'</span></div>'+(en?'<p class="card-en-title" lang="en">🇬🇧 '+esc(en.title)+'</p>':'')+'<p>'+esc(t.summary)+'</p><div class="tags">'+t.tags.map(function(x){return'<span class="tag">'+esc(x)+'</span>';}).join("")+'</div><div class="seg"><button class="learn '+(s==="learn"?"on":"")+'" aria-pressed="'+(s==="learn")+'" data-prog="learn" data-id="'+t.id+'">À apprendre<small>Learn</small></button><button class="progress '+(s==="progress"?"on":"")+'" aria-pressed="'+(s==="progress")+'" data-prog="progress" data-id="'+t.id+'">En cours<small>Learning</small></button><button class="mastered '+(s==="mastered"?"on":"")+'" aria-pressed="'+(s==="mastered")+'" data-prog="mastered" data-id="'+t.id+'">Acquis<small>Mastered</small></button></div><button class="btn" data-open="'+t.id+'">'+(t.chapter?'Lire · Read':'Voir · Open')+'</button></article>';
}
function searchText(value){return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function topicSearchText(t){
 return t.title+" "+t.summary+" "+t.tags.join(" ")+" "+(RC_LESSON_TEXT[t.id] || "")+" "+(typeof RC_ENGLISH_TEXT!=="undefined"?(RC_ENGLISH_TEXT[t.id]||""):"")+" "+(RC_LESSON_LINKS[t.id] || []).map(function(lesson){return RC_LESSON_TEXT[lesson.id]+" "+(typeof RC_ENGLISH_TEXT!=="undefined"?(RC_ENGLISH_TEXT[lesson.id]||""):"");}).join(" ");
}
var topicSearchIndex=Object.create(null);
RC_TOPICS.forEach(function(t){topicSearchIndex[t.id]=searchText(topicSearchText(t));});
function libraryTopics(){
 var q=searchText(state.search.trim());return RC_TOPICS.filter(function(t){return state.section==="all"||t.section===state.section;}).filter(function(t){return state.status==="all"||pstate(t.id)===state.status;}).filter(function(t){return !q||topicSearchIndex[t.id].indexOf(q)>=0;}).sort(function(a,b){return section(a.section).order-section(b.section).order||b.p-a.p||(a.chapter||0)-(b.chapter||0);});
}
function libraryCards(list){return list.length?list.map(cardHtml).join(""):'<div class="empty">Aucune fiche correspondante.</div>';}
function updateLibrary(){var list=libraryTopics();$("#cards").innerHTML=libraryCards(list);$("#library-count").textContent=list.length+" FICHES";bindCards($("#cards"));}
function library(){
 var list=libraryTopics();
 return'<section class="mod"><div class="mh"><h2>Bibliothèque essentielle</h2><span id="library-count" class="src" role="status" aria-live="polite">'+list.length+' FICHES · NOTES</span></div><p class="en-kicker" lang="en">Essential library · search works in French and English.</p><div class="filters"><label class="field-label" for="search">Rechercher · Search<input id="search" type="search" placeholder="DNS, IAM, road surface, rollback…" value="'+esc(state.search)+'"></label><label class="field-label" for="status">Statut · Status<select id="status">'+[["all","Tous · All"],["learn","À apprendre · Learn"],["progress","En cours · Learning"],["mastered","Acquis · Mastered"]].map(function(x){return'<option value="'+x[0]+'"'+(state.status===x[0]?" selected":"")+'>'+x[1]+"</option>";}).join("")+'</select></label></div><div class="tabs"><button class="tab '+(state.section==="all"?"on":"")+'" aria-pressed="'+(state.section==="all")+'" data-section="all">◉ Tout</button>'+RC_SECTIONS.map(function(s){return'<button class="tab '+(state.section===s.id?"on":"")+'" aria-pressed="'+(state.section===s.id)+'" data-section="'+s.id+'">'+s.icon+" "+esc(s.label)+"</button>";}).join("")+'</div><div id="cards" class="grid3">'+libraryCards(list)+"</div></section>";
}
function course(){
 var ordered=orderedLessons(),p=progressFor(ordered),active=activeCourseLevel(),next=ordered.find(function(lesson){return pstate(lesson.id)!=="mastered";}),action=next?(p.mastered||p.inprog?'Continuer · Continue':'Commencer · Start'):'Revoir · Review';next=next||ordered[0];
 return'<section class="mod"><div class="mh"><h2>Parcours de révision</h2><span class="src">'+ordered.length+' ÉTAPES · 3 NIVEAUX</span></div><p class="en-kicker" lang="en">Study path · French for understanding, English for your IT career.</p><p class="source-note">L’ordre suit les prérequis. L’anglais est progressif : 🟢 25 % en Débutant, 🟡 50 % en Intermédiaire, 🔴 75 % en Pro. Le français reste toujours disponible pour vérifier ta compréhension.</p><div class="hero"><span class="src">'+active.icon+" NIVEAU ACTUEL · "+esc(active.label.toUpperCase())+" / "+esc(active.labelEn.toUpperCase())+'</span><h2>'+esc(active.goal)+'</h2><p class="hero-en" lang="en">'+esc(active.goalEn)+'</p><p>'+p.mastered+' étapes acquises · '+p.inprog+' en cours sur 32</p>'+(next?'<button class="btn pri" data-open="'+next.id+'">'+action+' · étape '+studyStep(next.id)+' · '+esc(next.title)+'</button>':'')+'</div><div class="english-ladder"><div><b>🟢 Débutant · Beginner</b><span>25% English · comprendre puis reformuler</span></div><div><b>🟡 Intermédiaire · Intermediate</b><span>50% English · répondre en anglais avec aide FR</span></div><div><b>🔴 Pro</b><span>75% English · simulation d’entretien IT</span></div></div><div class="course-roadmap" aria-label="Progression des niveaux">'+RC_COURSE_LEVELS.map(function(level){return courseRoadmapCard(level,active);}).join("")+'</div><p class="muted">Règle simple · Simple rule: travaille la prochaine étape proposée, puis fais le défi oral English Coach avant de marquer le cours “Acquis / Mastered”.</p><div id="course-chapters" class="course-levels">'+RC_COURSE_LEVELS.map(function(level){return courseLevelSection(level,active);}).join("")+'</div></section>';
}
function review(){
 var d=due(), future=Object.keys(state.review).map(function(id){return{id:id,r:state.review[id],t:topic(id)};}).filter(function(x){return x.t&&x.r.due>today();}).sort(function(a,b){return a.r.due.localeCompare(b.r.due);}).slice(0,10);
 return'<div class="grid2"><section class="mod"><div class="mh"><h2>À revoir aujourd’hui</h2><span class="src">'+d.length+'</span></div><p class="en-kicker" lang="en">Review today</p><p class="muted">Cycle : J+1 · J+3 · J+7 · J+14 · J+30 · J+60.</p>'+(d.length?d.map(reviewRow).join(""):'<div class="empty">Aucune révision due. Passe une fiche en “Acquis” pour démarrer.</div>')+'</section><section class="mod"><div class="mh"><h2>À venir</h2><span class="src">'+future.length+'</span></div>'+(future.length?future.map(function(x){return'<div class="review"><div><b>'+esc(x.t.title)+'</b><small>'+esc(x.r.due)+'</small></div><span></span><span class="due">J+'+Math.max(0,daysBetween(x.r.due,today()))+'</span></div>';}).join(""):'<div class="empty">Rien de planifié.</div>')+"</section></div>";
}
function reviewRow(x){
 return'<div class="review"><div><b>'+esc(x.t.title)+'</b><small>'+section(x.t.section).icon+" "+esc(section(x.t.section).label)+'</small></div><span></span><div class="actions"><button class="btn sm" data-bad="'+x.id+'">À revoir · Again</button><button class="btn sm pri" data-good="'+x.id+'">Bien retenu · Got it</button></div></div>';
}
function privacy(){
 return'<div class="grid2"><section class="mod"><div class="mh"><h2>Sources pédagogiques</h2><span class="src">7 SUPPORTS VÉRIFIÉS</span></div><p>'+RC_LESSONS.length+' chapitres adaptés du cours Race Control, recoupés avec le dossier prod15. Les PDF/DOCX originaux et la sauvegarde privée restent hors de l’application.</p><div id="support-coverage">'+RC_SUPPORTS.map(function(s){return'<article class="support" data-support-id="'+esc(s.id)+'" data-support-status="'+esc(s.status)+'"><h3>'+esc(s.title)+'</h3><p class="muted">'+esc(s.format)+' · '+esc(s.version)+'</p><p>'+esc(s.coverage)+'</p></article>';}).join("")+'</div><h3>Bibliothèque générale à compléter</h3><p class="muted">Les 42 fiches initiales sont des repères synthétiques. Les supports Race Control ne remplacent pas les cours complets de Linux, réseau, pentest, Kubernetes ou sécurité IA. Les références ci-dessous figuraient dans la bibliothèque ; leurs textes complets ne sont pas fournis dans ce lot.</p><ul>'+RC_SOURCES.filter(function(s){return s!=="Race Control expliqué de zéro à DevSecOps";}).map(function(s){return'<li>'+esc(s)+'</li>';}).join("")+'</ul></section><section class="mod"><div class="mh"><h2>Confidentialité</h2><span class="src">BY DESIGN</span></div><div class="privacy"><b>✅ Sources privées conservées hors du site</b><br>Aucun PDF/DOCX brut, aucune URL privée ni donnée de la sauvegarde dans le contenu publié.</div><div class="privacy"><b>✅ Progression locale</b><br>Statuts et révisions restent dans localStorage sur ton appareil.</div><div class="privacy"><b>✅ Aucun analytics / backend</b><br>L’application n’envoie pas ta progression.</div><div class="privacy"><b>✅ Cours hors ligne</b><br>Après un premier chargement complet avec réseau, les cours sont conservés sur l’appareil. Le navigateur peut effacer son cache ; ce n’est pas une sauvegarde de ta progression.</div><div class="actions"><button id="export" class="btn">Exporter</button><button id="import" class="btn">Importer</button><button id="reset" class="btn">Réinitialiser</button></div></section></div>';
}
function detailProgress(ps){
 return'<div class="seg"><button class="learn '+(ps==="learn"?"on":"")+'" data-dprog="learn">À apprendre<small>Learn</small></button><button class="progress '+(ps==="progress"?"on":"")+'" data-dprog="progress">En cours<small>Learning</small></button><button class="mastered '+(ps==="mastered"?"on":"")+'" data-dprog="mastered">Acquis<small>Mastered</small></button></div>';
}
function answerHtml(label,answer){
 return'<details class="answer"><summary>'+esc(label)+'</summary><p>'+esc(answer)+'</p></details>';
}
function relatedHtml(id){
 var related=RC_LESSON_LINKS[id] || [];
 return related.length?'<section class="related-lessons"><h3>Approfondir avec Race Control</h3><p class="muted">Les cours ci-dessous développent une partie de ce repère à partir des supports fournis.</p><div class="actions">'+related.map(function(lesson){return'<button class="btn" data-open="'+esc(lesson.id)+'">Chapitre '+lesson.chapter+' · '+esc(lesson.title)+'</button>';}).join("")+'</div></section>':'';
}
function lessonHtml(lesson,t,s,ps){
 var ordered=orderedLessons(), index=ordered.findIndex(function(item){return item.id===lesson.id;}), previous=ordered[index-1], next=ordered[index+1], level=courseLevelFor(lesson), entry=curriculumItem(lesson.id), step=studyStep(lesson.id);
 var quiz=lesson.quiz || [], glossary=lesson.glossary || [];
 return'<div class="detail lesson-detail" data-lesson-id="'+esc(lesson.id)+'"><span class="src">'+level.icon+" "+esc(level.label.toUpperCase())+" / "+esc(level.labelEn.toUpperCase())+" · ÉTAPE "+step+" / 32 · "+esc(entry.phase.toUpperCase())+'</span><h2 id="detail-title" tabindex="-1">'+esc(t.title)+'</h2><p class="lesson-title-en" lang="en">🇬🇧 '+esc(englishData(lesson.id).title)+'</p><p class="muted">'+esc(t.summary)+'</p>'+detailProgress(ps)+'<p class="study-why"><b>Pourquoi maintenant ? · Why now?</b> Cette étape appartient au bloc « '+esc(entry.phase)+' » et prépare la suite du parcours.</p>'+englishCoachHtml(lesson,level)<p class="source-note">Support prod15 · instantané historique. Le numéro du chapitre source est '+lesson.chapter+' ; l’ordre affiché ici est l’ordre pédagogique de révision.</p><section class="lesson-goals"><h3>À savoir avant de passer à la suite</h3><ul>'+lesson.goals.map(function(goal){return'<li>'+esc(goal)+'</li>';}).join("")+'</ul></section><div class="lesson-sections">'+lesson.sections.map(function(part){return'<section><h3>'+esc(part.title)+'</h3>'+part.body.map(function(paragraph){return'<p>'+esc(paragraph)+'</p>';}).join("")+(part.code?'<pre class="code"><code>'+esc(part.code)+'</code></pre>':'')+'</section>';}).join("")+'</div><section class="box"><h3>Pièges à éviter</h3><ul>'+lesson.pitfalls.map(function(pitfall){return'<li>'+esc(pitfall)+'</li>';}).join("")+'</ul></section><section class="box"><h3>🎙️ Question d’entretien</h3><p>'+esc(lesson.interview.question)+'</p>'+answerHtml("Voir une réponse possible",lesson.interview.answer)+'</section><section class="box"><h3>🧪 Exercice</h3><p>'+esc(lesson.exercise.prompt)+'</p>'+answerHtml("Afficher le corrigé",lesson.exercise.answer)+'</section>'+(quiz.length?'<section class="lesson-quiz"><h3>Révision : teste-toi avant de lire</h3>'+quiz.map(function(item,i){return'<article class="quiz-item"><h4>'+(i+1)+'. '+esc(item.question)+'</h4>'+answerHtml("Voir la réponse "+(i+1),item.answer)+'</article>';}).join("")+'</section>':'')+(glossary.length?'<section class="lesson-glossary"><h3>Glossaire</h3><dl>'+glossary.map(function(item){return'<dt>'+esc(item.term)+'</dt><dd>'+esc(item.definition)+'</dd>';}).join("")+'</dl></section>':'')+'<section class="lesson-sources"><h3>Sources et version</h3><ul>'+lesson.sources.map(function(ref){var support=RC_SUPPORTS.find(function(item){return item.id===ref.id;});return'<li data-source-id="'+esc(ref.id)+'">'+esc(support?support.title:ref.id)+' · p. '+esc(ref.pages)+' · '+esc(support?support.version:"prod15")+'</li>';}).join("")+'</ul><p class="muted">Adaptation pédagogique, sans documents bruts ni données opérationnelles privées.</p></section><div class="actions chapter-navigation" aria-label="Navigation entre étapes">'+(previous?'<button class="btn" data-open="'+esc(previous.id)+'">← Étape '+studyStep(previous.id)+'</button>':'')+(next?'<button class="btn pri" data-open="'+esc(next.id)+'">Étape '+studyStep(next.id)+' →</button>':'')+'</div></div>';
}
function detail(id){
 var t=topic(id); if(!t)return;
 var dlg=$("#dlg"), changingChapter=detailId!==id;if(!dlg.open&&!dlg.hasAttribute("open"))detailOpener=document.activeElement;detailId=id;
 var s=section(t.section), ps=pstate(id);
 var commands={linux:"pwd\nls -lah\nfind . -type f\nsystemctl status ssh\njournalctl -u ssh",network:"ip addr\nip route\nss -lntup\ndig example.com\ncurl -I https://example.com",devsecops:"git status\ngit diff\ngit rev-parse HEAD\ndocker ps\nkubectl get pods",pentest:"nmap -sV TARGET\ndig TARGET\ncurl -I http://TARGET",security:"openssl version\nsha256sum FILE",cloud:"# Vérifie IAM, réseau, chiffrement et logs avant exposition.",ai:"# Traite les contenus externes comme données non fiables.",portfolio:"git rev-parse HEAD\ngit diff BASE...HEAD",fundamentals:"curl -v https://example.com\npython3 --version"}[t.section]||"";
 var lesson=RC_LESSON_MAP[id], linked=RC_LESSON_LINKS[id] || [];
 $("#detail").innerHTML=lesson?lessonHtml(lesson,t,s,ps):'<div class="detail"><span class="src">'+s.icon+" "+esc(s.label)+" · "+stars(t.p)+'</span><h2 id="detail-title">'+esc(t.title)+'</h2><p class="muted">'+esc(t.summary)+'</p>'+detailProgress(ps)+'<p class="source-note">'+(linked.length?'Fiche essentielle : les chapitres liés permettent d’approfondir les notions couvertes par les supports Race Control.':'Repère à compléter : les supports fournis ne contiennent pas de cours complet sur ce sujet.')+'</p><section><h3>À savoir absolument</h3><ul><li>'+esc(t.summary)+'</li><li>'+esc(s.goal)+'</li><li>Savoir expliquer le concept avec un exemple concret et une limite.</li></ul></section><section class="box"><h3>🎙️ Question d’entretien</h3><p>Explique “'+esc(t.title)+'” simplement, puis donne un exemple où ce concept améliore la sécurité ou l’exploitation.</p></section><section class="box"><h3>🧪 Exercice</h3><p>Fais une mini fiche : définition → exemple → risque → contrôle → preuve. Puis explique-la à voix haute en 90 secondes.</p></section>'+(commands?'<section><h3>⌨️ Commandes / repères</h3><div class="code">'+esc(commands)+'</div></section>':"")+relatedHtml(id)+'<section><h3>Source</h3><p class="muted">'+(linked.length?'Approfondissements sourcés dans les chapitres Race Control ci-dessus. La fiche générale reste un repère synthétique.':'Les titres de références figurent dans Sources & privacy ; leurs textes complets ne sont pas présents dans ce lot.')+'</p></section></div>';
 $$("[data-dprog]").forEach(function(b){b.setAttribute("aria-pressed",String(ps===b.dataset.dprog));b.onclick=function(){setProgress(id,b.dataset.dprog);detail(id);};});
 bindCards($("#detail"));
 $(".dialogbox").scrollTop=0;
 if(!dlg.open&&!dlg.hasAttribute("open")){
  if(typeof dlg.showModal==="function")dlg.showModal();
  else{dlg.setAttribute("open","");dlg.classList.add("dialog-fallback");document.body.classList.add("dialog-open");$("#close").focus();}
 }
 if(lesson&&changingChapter)$("#detail-title").focus({preventScroll:true});
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
function render(){var navScroll=$("#nav").scrollLeft, tabs=$(".tabs");if(tabs)libraryTabsScroll=tabs.scrollLeft;nav();var f={cockpit:cockpit,path:path,library:library,course:course,review:review,privacy:privacy}[state.view]||cockpit;$("#app").innerHTML=f();$("#nav").scrollLeft=navScroll;tabs=$(".tabs");if(tabs)tabs.scrollLeft=libraryTabsScroll;bind();storageNotice();}
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).catch(function(){});
render();
})();
