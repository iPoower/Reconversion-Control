"use strict";

// Adaptations pédagogiques des supports fournis : aucun document privé embarqué.
const RC_SUPPORTS = [
  {id:"architecture-fiche",title:"Fiche d’architecture Race Control V3.3",format:"PDF",version:"prod-8 · historique",status:"duplicate",coverage:"Variante de la fiche d’architecture prod-8. Recoupée avec la fiche V3.3, sans compter les mêmes notions deux fois."},
  {id:"course-prod15",title:"Race Control expliqué de zéro à DevSecOps",format:"PDF · 39 pages",version:"prod15 · instantané historique",status:"course",coverage:"Les 32 chapitres constituent le cours guidé. Explications, pièges, questions et exercices ont été adaptés pour cette application."},
  {id:"architecture-prod8",title:"Race Control V3.3 — Fiche d’architecture",format:"PDF",version:"prod-8 · historique",status:"historical",coverage:"Ancien instantané d’architecture utilisé pour vérifier l’évolution du projet. Il ne décrit pas la version actuelle de production."},
  {id:"dossier-prod15-docx",title:"Race Control — Dossier complet prod15",format:"DOCX",version:"prod15 · même dossier que le PDF",status:"duplicate",coverage:"Recoupé avec la version PDF du dossier. Un même contenu fourni sous deux formats ne constitue pas deux cours."},
  {id:"backup-private",title:"Sauvegarde Race Control",format:"JSON chiffré",version:"Privé · hors cours",status:"excluded",coverage:"Sauvegarde opérationnelle exclue du contenu pédagogique. Ni déchiffrée ni publiée ; aucune donnée de cette sauvegarde n’est embarquée."},
  {id:"architecture-v32",title:"Race Control V3.2 — Fiche d’architecture",format:"PDF",version:"Historique · intitulé V3.2, corps V3.3",status:"historical",coverage:"Le titre et le corps de ce support portent des versions différentes. Recoupé avec les autres fiches ; les capacités historiques ne valent pas pour la production actuelle."},
  {id:"dossier-prod15",title:"Race Control — Dossier complet prod15",format:"PDF · 31 pages",version:"prod15 · instantané historique",status:"reference",coverage:"Architecture, exploitation, confidentialité, incident et annexes recoupent les chapitres du cours. La feuille de route est distinguée des fonctions livrées à cette version."}
];

const RC_LESSONS = RC_COURSE_FOUNDATIONS.concat(RC_COURSE_RACE, RC_COURSE_OPERATIONS).sort(function(a,b){return a.chapter-b.chapter;});
const RC_LESSON_MAP = Object.create(null);
const RC_LESSON_LINKS = Object.create(null);
const RC_LESSON_TEXT = Object.create(null);
function rcLearningText(value){
  if(typeof value === "string")return value;
  if(Array.isArray(value))return value.map(rcLearningText).join(" ");
  if(value && typeof value === "object")return Object.keys(value).map(function(key){return rcLearningText(value[key]);}).join(" ");
  return "";
}
RC_LESSONS.forEach(function(lesson){
  RC_LESSON_MAP[lesson.id]=lesson;
  RC_LESSON_TEXT[lesson.id]=rcLearningText(lesson);
  (lesson.related || []).forEach(function(id){(RC_LESSON_LINKS[id] || (RC_LESSON_LINKS[id]=[])).push(lesson);});
  RC_TOPICS.push({id:lesson.id,section:lesson.section,title:lesson.title,p:4,summary:lesson.summary,tags:lesson.tags,chapter:lesson.chapter});
});
