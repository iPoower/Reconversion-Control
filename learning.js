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

// Réalisations publiques vérifiées, séparées des sept pièces historiques privées.
RC_SUPPORTS.push.apply(RC_SUPPORTS, [
  {
    "id": "public-ux93",
    "title": "Race Control · audit UX mobile",
    "format": "GitHub public",
    "version": "prod93 · 2183d542 · 11/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/2183d54295ccde2366d14c1b93a4ba7f277c5bb9/docs/mobile-ux-precision-20261011.md",
    "coverage": "Cinq onglets, niveaux de lecture, focus, 146 exécutions et limites des essais simulés."
  },
  {
    "id": "public-f1",
    "title": "Race Control · six modules F1",
    "format": "PR fusionnée",
    "version": "#109 · 10/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/pull/109",
    "coverage": "Six extensions opt-in, moteurs existants, absence de télémétrie inventée."
  },
  {
    "id": "public-provenance",
    "title": "Race Control · données mesurées et projections",
    "format": "PR fusionnée",
    "version": "#117 · 11/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/pull/117",
    "coverage": "Progression estimée, sources météo et limites de la mesure."
  },
  {
    "id": "public-calendar",
    "title": "Race Control · départ personnalisé d’un rendez-vous",
    "format": "PR fusionnée",
    "version": "#92 · 09/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/pull/92",
    "coverage": "Occurrence, sens, origine, annulations, recalcul et reprise hors ligne."
  },
  {
    "id": "public-vault",
    "title": "Race Control · coffre local",
    "format": "Code public",
    "version": "prod93 · 2183d542",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/2183d54295ccde2366d14c1b93a4ba7f277c5bb9/src/session-vault.js",
    "coverage": "AES-GCM, PBKDF2, relecture, concurrence et limites de session."
  },
  {
    "id": "public-deploy",
    "title": "Race Control · publication qui échoue réellement",
    "format": "PR fusionnée",
    "version": "#107 · 10/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/pull/107",
    "coverage": "Cinq pushes refusés, retour d’erreur et sept scénarios de régression."
  },
  {
    "id": "public-relay",
    "title": "Race Control · diagnostics sans coordonnées",
    "format": "PR fusionnée",
    "version": "#104 · 10/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/pull/104",
    "coverage": "Ne pas écrire une URL météo privée dans les logs publics."
  },
  {
    "id": "public-debrief",
    "title": "Race Control · débriefs et doublons possibles",
    "format": "PR fusionnée",
    "version": "#108 · 10/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/pull/108",
    "coverage": "Pause quotidienne, pas de fusion automatique et comparaison météo honnête."
  },
  {
    "id": "public-reconversion",
    "title": "Reconversion Control · apprentissage et preuves",
    "format": "Code public",
    "version": "V2.1 · 2ccf288 · base vérifiée",
    "status": "public",
    "url": "https://github.com/iPoower/Reconversion-Control/blob/2ccf288103afbb8a3f308ad92929d9ae8bc8950f/README.md",
    "coverage": "SRS, Daily Five, labs, preuves locales et synchronisation chiffrée opt-in."
  },
  {
    "id": "public-control-vault",
    "title": "Control Vault · prototype et limites",
    "format": "Code public",
    "version": "Phase 1 · 0647b4f · 09/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/Control-Vault/blob/0647b4f666533447e6f549de0cffc3a1bf6d44e4/README.md",
    "coverage": "Moteurs réels sur données fictives ; Google et Supabase non connectés."
  },
  {
    "id": "public-origin",
    "title": "MDN · origine Web et stockage",
    "format": "Documentation publique",
    "version": "Consultée le 12/10/2026",
    "status": "public",
    "url": "https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy",
    "coverage": "Même protocole, hôte et port : deux chemins ne cloisonnent pas localStorage."
  },
  {
    "id": "public-kdf",
    "title": "OWASP · dérivation de mots de passe",
    "format": "Documentation publique",
    "version": "Consultée le 12/10/2026",
    "status": "public",
    "url": "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
    "coverage": "Coût des essais, phrase secrète et PBKDF2-HMAC-SHA-256."
  },
  {
    "id": "public-actions",
    "title": "GitHub · utilisation sûre des Actions",
    "format": "Documentation publique",
    "version": "Consultée le 12/10/2026",
    "status": "public",
    "url": "https://docs.github.com/en/actions/reference/security/secure-use",
    "coverage": "Secrets, permissions minimales, code non fiable et versions d’actions."
  },
  {
    "id": "public-cv-crypto",
    "title": "Control Vault · gouvernance du chiffrement",
    "format": "Étude publique",
    "version": "Phase future · 0647b4f",
    "status": "public",
    "url": "https://github.com/iPoower/Control-Vault/blob/0647b4f666533447e6f549de0cffc3a1bf6d44e4/docs/CRYPTO.md",
    "coverage": "Clé éphémère du prototype ; sauvegardes durables et récupération non activées."
  }
]);
const RC_PROJECTS = [
  {
    "id": "race-control",
    "title": "Race Control",
    "status": "Application publiée · prod93 vérifiée",
    "summary": "Cockpit F1, météo, pneus, Garage, agenda et trajets. Six modules optionnels, coffre local et UX mobile simplifiée.",
    "skills": "Front-end · UX mobile · tests · DevSecOps · confidentialité",
    "limit": "Simulation Chromium/WebKit ; aucun essai sur iPhone physique revendiqué. Origine partagée et session ouverte : durcissement à poursuivre.",
    "url": "https://ipoower.github.io/iPoower/race-control/",
    "repository": "https://github.com/iPoower/iPoower",
    "sources": [
      "public-ux93",
      "public-f1",
      "public-vault"
    ],
    "lesson": "rc-33"
  },
  {
    "id": "reconversion-control",
    "title": "Reconversion Control",
    "status": "Application publiée · parcours enrichi",
    "summary": "PWA bilingue, Daily Five, SRS adaptatif, cours, labs et preuves indépendants. Synchronisation chiffrée facultative.",
    "skills": "PWA · JavaScript · pédagogie · validation · cloud opt-in",
    "limit": "Les statuts sont déclarés par l’utilisateur ; XP et lecture ne certifient pas une compétence. Aucun Supabase configuré par défaut.",
    "url": "https://ipoower.github.io/Reconversion-Control/",
    "repository": "https://github.com/iPoower/Reconversion-Control",
    "sources": [
      "public-reconversion"
    ],
    "lesson": "rc-41"
  },
  {
    "id": "control-vault",
    "title": "Control Vault",
    "status": "Phase 1 · prototype de démonstration",
    "summary": "Interface de coffre et moteurs de sérialisation, SHA-256, AES-GCM et relecture sur un Drive fictif en mémoire.",
    "skills": "TypeScript · architecture · intégrité · scénarios d’échec",
    "limit": "Données fictives recréées à l’ouverture, clé éphémère. Aucune connexion Google/Supabase ni sauvegarde personnelle durable active.",
    "url": "https://ipoower.github.io/Control-Vault/",
    "repository": "https://github.com/iPoower/Control-Vault",
    "sources": [
      "public-control-vault",
      "public-cv-crypto"
    ],
    "lesson": "rc-42"
  }
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
