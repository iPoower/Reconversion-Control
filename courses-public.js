"use strict";
/* Public teaching catalog only. No storage, Auth, analytics, imports or service worker. */
(()=>{
 const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const list=document.querySelector("#public-courses"),article=document.querySelector("#public-lesson"),search=document.querySelector("#public-search");
 const title=l=>{const t=RC_TOPICS.find(t=>t.id===l.id);return t?t.title:l.title||l.id;};
 const answer=(name,text)=>'<details><summary class="btn">'+esc(name)+'</summary><p>'+esc(text)+'</p></details>';
 function sourceHTML(s){
  const id=typeof s==="string"?s:s.id,source=RC_SUPPORTS.find(p=>p.id===id)||(typeof s==="object"?s:{}),text=(source.title||id||"Source")+(s.pages?" · p. "+s.pages:""),href=source.url;
  return '<li>'+(/^https:\/\//.test(href)?'<a class="btn" target="_blank" rel="noopener noreferrer" href="'+esc(href)+'">'+esc(text)+'</a>':esc(text))+'</li>';
 }
 function show(id){
  const l=RC_LESSONS.find(l=>l.id===id);if(!l)return;
  article.hidden=false;
  article.innerHTML='<h2 tabindex="-1">'+esc(title(l))+'</h2><p class="muted">'+esc(l.provenance||"Support historique · adapté pour apprendre")+'</p><h3>Objectifs</h3><ul>'+l.goals.map(g=>'<li>'+esc(g)+'</li>').join("")+'</ul>'+l.sections.map(p=>'<section><h3>'+esc(p.title)+'</h3>'+p.body.map(t=>'<p>'+esc(t)+'</p>').join("")+(p.code?'<pre class="code"><code>'+esc(p.code)+'</code></pre>':"")+'</section>').join("")+'<h3>Pièges</h3><ul>'+l.pitfalls.map(t=>'<li>'+esc(t)+'</li>').join("")+'</ul><h3>Entretien</h3><p>'+esc(l.interview.question)+'</p>'+answer("Voir la réponse",l.interview.answer)+'<h3>Exercice</h3><p>'+esc(l.exercise.prompt)+'</p>'+answer("Voir le corrigé",l.exercise.answer)+(l.quiz||[]).map(q=>'<h3>'+esc(q.question)+'</h3>'+answer("Réponse",q.answer)).join("")+'<h3>Glossaire</h3><dl>'+(l.glossary||[]).map(g=>'<dt>'+esc(g.term)+'</dt><dd>'+esc(g.definition)+'</dd>').join("")+'</dl><h3>Sources</h3><ul>'+l.sources.map(sourceHTML).join("")+'</ul>';
  article.querySelector("h2").focus();
 }
 function render(){const q=search.value.toLocaleLowerCase("fr");list.innerHTML=RC_LESSONS.filter(l=>(title(l)+" "+l.sections.map(p=>p.title+" "+p.body.join(" ")).join(" ")).toLocaleLowerCase("fr").includes(q)).map(l=>'<button class="btn" data-public-lesson="'+esc(l.id)+'">'+esc(title(l))+'</button>').join("");list.querySelectorAll("[data-public-lesson]").forEach(b=>b.onclick=()=>show(b.dataset.publicLesson));}
 search.oninput=render;render();
})();
