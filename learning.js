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
  },
  {
    "id": "public-gps-gate-20261021",
    "title": "Race Control · origine GPS validée",
    "format": "PR fusionnée",
    "version": "#196 · 20/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/pull/196",
    "coverage": "Origine canonique, refus explicite et conservation des trajets déjà programmés."
  },
  {
    "id": "public-live-route-20261021",
    "title": "Race Control · LIVE ROUTE et prévisions ponctuelles",
    "format": "Code et documentation publics",
    "version": "120b10d · publié dans prod-151 · relevé le 21/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/120b10d04c63f9cb882157150f647befc287f95c/docs/live-route-premium.md",
    "coverage": "Simulation et GPS séparés, fraîcheur, tracé réel, météo ponctuelle et limites des essais."
  },
  {
    "id": "public-replay-20261021",
    "title": "Race Control · noyau Journey Replay",
    "format": "Code public",
    "version": "120b10d · instantané publié relevé le 21/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/120b10d04c63f9cb882157150f647befc287f95c/src/app/journey-replay-core.js",
    "coverage": "Prévision archivée et retour déclaré, contexte historique, données manquantes et parcours illustratif."
  },
  {
    "id": "public-release-20261021",
    "title": "Race Control · manifeste de publication figé",
    "format": "Manifeste public",
    "version": "prod-151 · 120b10d · 21/10/2026 à 03:39 UTC",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/dc858644760c1455631bde25f9b01c2e45e8f37a/race-control/version.json",
    "coverage": "SHA source et build 41f1fb5747b9 du cas daté ; une autre livraison peut le remplacer."
  },
  {
    "id": "public-project-v3-20261021",
    "title": "Reconversion Control · Projet 2027",
    "format": "Code et documentation publics",
    "version": "V3 · 82dfcb5 · 15/10/2026 · relu le 21/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/Reconversion-Control/blob/82dfcb5489ee19bd216448d2ae185c88c9bf7f62/README.md",
    "coverage": "Décision de formation, preuves datées et montants inconnus ; aucun financement ni acquis automatiques."
  },
  {
    "id": "public-vault-contract-20261021",
    "title": "Control Vault · contrat d’intégration V1, lot 1",
    "format": "Contrat public",
    "version": "07d6de0 · 16/10/2026 · relu le 21/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/Control-Vault/blob/07d6de09e60ff36061a9b45bc5bbc07ecdee68a2/docs/INTEGRATION.md",
    "coverage": "Contrat et tests indépendants ; aucune connexion Google réelle ni activation de sauvegarde durable."
  },
  {
    "id": "public-geolocation-20261021",
    "title": "MDN · coordonnées et date d’acquisition",
    "format": "Documentation publique",
    "version": "Consultée le 21/10/2026",
    "status": "public",
    "url": "https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPosition",
    "coverage": "La date du relevé est distincte de sa réception ; les seuils d’acceptation appartiennent à l’application."
  },
  {
    "id": "public-sync-merge-20261022",
    "title": "Race Control · fusion pure et conservation",
    "format": "Code et documentation publics",
    "version": "6340b45 · relu le 22/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/6340b45efabe2adac885faec9e41f76c37e6b573/docs/sync-pc-iphone.md",
    "coverage": "Union idempotente, identités, conflits, limites et refus entier ; moteur non branché au réseau."
  },
  {
    "id": "public-vault-transport-20261022",
    "title": "Control Vault · transport opaque préparé",
    "format": "Documentation publique",
    "version": "8a3cf03 · relu le 22/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/Control-Vault/blob/8a3cf03571274f80cfa69e51296fc67754207b10/docs/OPAQUE_DRIVE_LOT_B2.md",
    "coverage": "Copie locale et octets vérifiés ne valent pas synchronisation ; Drive simulé et fournisseur produit encore fictif."
  },
  {
    "id": "public-vault-profile-20261022",
    "title": "Control Vault · interopérabilité du profil A1",
    "format": "Tests publics",
    "version": "8a3cf03 · relu le 22/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/Control-Vault/blob/8a3cf03571274f80cfa69e51296fc67754207b10/tests/unit/race-sync-profile.test.ts",
    "coverage": "Instantanés propriétaires et empreintes, lecture de paquets identiques ; aucune clé RC dans les composants de transport."
  },
  {
    "id": "public-release-20261022",
    "title": "Race Control · publication GitHub Pages observée",
    "format": "Manifeste public figé",
    "version": "prod-157 · 6340b45 · 22/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/6120bc7f4c720e86e31c249f6b0dba0fccaf1e26/race-control/version.json",
    "coverage": "Source et build 50988798eb7c confirmés par HTTP ; ne prouve pas la réussite de toutes les cibles."
  },
  {
    "id": "public-delivery-targets-20261022",
    "title": "Race Control · contrôle de la cible Cloudflare en échec",
    "format": "Job public",
    "version": "Run 39716832859 · job 119628436882 · lu le 22/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/actions/runs/39716832859/job/119628436882",
    "coverage": "Échec du contrôle des octets, du commit et des en-têtes de la cible dédiée ; distinguer les résultats par cible."
  },
  {
    "id": "public-drive-scope-20261022",
    "title": "Google Drive · portée des permissions",
    "format": "Documentation officielle",
    "version": "Consultée le 22/10/2026",
    "status": "public",
    "url": "https://developers.google.com/workspace/drive/api/guides/api-specific-auth",
    "coverage": "drive.file limite l’accès aux fichiers autorisés pour l’application ; le nom du scope ne prouve aucun consentement obtenu."
  },
  {
    "id": "public-sync-revisions-20261023",
    "title": "Race Control · révisions, têtes et collisions",
    "format": "Code et documentation publics",
    "version": "61da14f · relu le 23/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/61da14f353ace95e8a477d651eca8678ac3ced0f/docs/sync-revisions.md",
    "coverage": "Deux têtes concurrentes, égalité du contenu authentifié et blocage de collision ; moteur non assemblé."
  },
  {
    "id": "public-sync-outbox-20261023",
    "title": "Race Control · file locale et statuts prouvés",
    "format": "Code et documentation publics",
    "version": "61da14f · relu le 23/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/61da14f353ace95e8a477d651eca8678ac3ced0f/docs/sync-guarantees.md",
    "coverage": "Reprise du même travail, un transfert, actions explicites et preuve de relecture ; raccord et persistance encore à faire."
  },
  {
    "id": "public-ci-run-20261023",
    "title": "Race Control · CI exacte du cas étudié",
    "format": "Run public achevé",
    "version": "39883415398 · 61da14f · 23/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/actions/runs/39883415398",
    "coverage": "Unitaires, confidentialité, six lots navigateur, agrégateur et job de publication réussis ; version HTTP contrôlée séparément."
  },
  {
    "id": "public-playwright-image-20261023",
    "title": "Playwright · image et version du paquet",
    "format": "Documentation officielle",
    "version": "Consultée le 23/10/2026",
    "status": "public",
    "url": "https://playwright.dev/docs/docker",
    "coverage": "Navigateurs et bibliothèques système dans l’image ; paquet installé séparément et version correspondante."
  },
  {
    "id": "public-vault-a2-20261023",
    "title": "Control Vault · transport des révisions A2",
    "format": "Code et documentation publics",
    "version": "74ba9d8 · relu le 23/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/Control-Vault/blob/74ba9d89537e8582cf4916c566f7f53c5da1c530/docs/OPAQUE_DRIVE_SYNC_A2.md",
    "coverage": "Métadonnées figées et relues, concurrence conservée ; authentification finale côté propriétaire, réseau fictif et build produit de démonstration."
  },
  {
    "id": "public-drive-properties-20261023",
    "title": "Google Drive · propriétés personnalisées",
    "format": "Documentation officielle",
    "version": "Consultée le 23/10/2026",
    "status": "public",
    "url": "https://developers.google.com/workspace/drive/api/guides/properties",
    "coverage": "properties et appProperties ; limite UTF-8 clé et valeur, accès authentifié aux propriétés privées."
  },
  {
    "id": "public-rc-drive-runtime-20261024",
    "title": "Race Control · raccord coffre, file durable et Drive",
    "format": "Code et documentation publics",
    "version": "c9c8339 · relu le 24/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/c9c833944f7da45d3a74394c5bcd6040582e302b/docs/drive-runtime.md",
    "coverage": "Raccord #229 fusionné, copie avant fusion, transport direct et activation réelle distincte des tests simulés."
  },
  {
    "id": "public-cv-drive-connection-20261024",
    "title": "Control Vault · espace Drive opaque distinct de la démo",
    "format": "Code et documentation publics",
    "version": "25c2992 · relu le 24/10/2026",
    "status": "public",
    "url": "https://github.com/iPoower/Control-Vault/blob/25c299272d7ac4aa8a0c8f9f3b6d2e93b305f809/docs/DRIVE_CONNECTION.md",
    "coverage": "Raccord #14 fusionné ; rôle opaque, configuration absente par défaut et limites des tests Google fictifs."
  },
  {
    "id": "public-progress-snapshot-20261024",
    "title": "Reconversion Control · N03, instantané avant envoi",
    "format": "PR fusionnée",
    "version": "#24 · 23/10/2026 · relue le 24/10",
    "status": "public",
    "url": "https://github.com/iPoower/Reconversion-Control/pull/24",
    "coverage": "Capture indépendante avant await, acquittement des seuls octets transmis, quinze cas fictifs dont la première sauvegarde."
  },
  {
    "id": "public-pages-provenance-20261024",
    "title": "Reconversion Control · N02, provenance Pages",
    "format": "PR fusionnée",
    "version": "#25 · 23/10/2026 · relue le 24/10",
    "status": "public",
    "url": "https://github.com/iPoower/Reconversion-Control/pull/25",
    "coverage": "Chemin manuel supprimé ; validation du SHA, de la fusion et de l’artefact du run, puis vérification des fichiers servis."
  },
  {
    "id": "public-gis-token-20261024",
    "title": "Google Identity Services · jeton et action utilisateur",
    "format": "Documentation officielle",
    "version": "Consultée le 24/10/2026",
    "status": "public",
    "url": "https://developers.google.com/identity/oauth2/web/guides/use-token-model",
    "coverage": "Modèle de jeton navigateur, consentement volontaire, expiration et nouvelle demande par geste utilisateur."
  },
  {
    "id": "public-release-20261024",
    "title": "Race Control · manifeste public prod-159",
    "format": "Artefact public figé",
    "version": "prod-159 · c9c8339 · HTTP relu le 24/10",
    "status": "public",
    "url": "https://github.com/iPoower/iPoower/blob/7cf2ef91f4ee3acfb9e0c6577edb4d24ae565ec2/race-control/version.json",
    "coverage": "Manifeste GitHub Pages prod-159 et build 31f687d0433d observés ; cette preuve ne valide pas une autre origine ou Google."
  }
]);
const RC_PROJECTS = [
  {
    "id": "race-control",
    "title": "Race Control",
    "status": "Application publiée · manifeste prod-159 du 23/10/2026",
    "summary": "Cockpit météo et pneus, Twin Garage, LIVE ROUTE et Journey Replay. Simulation, GPS accepté et prévisions restent explicitement distingués.",
    "skills": "Front-end · UX mobile · tests · DevSecOps · confidentialité",
    "limit": "Manifestes et cas historiques conservés dans les sources. La lecture HTTP GitHub Pages du 24/10 retrouve prod-159, source c9c8339 et build 31f687d0433d. Le raccord Drive #229 est fusionné ; configuration, Google réel, restauration isolée et iPhone physique ne sont pas validés par les tests simulés. L’identité HTTP Cloudflare n’est pas déduite de cette seule preuve GitHub Pages.",
    "url": "https://race-control-ipoower.pages.dev/",
    "repository": "https://github.com/iPoower/iPoower",
    "sources": [
      "public-ux93",
      "public-f1",
      "public-vault",
      "public-live-route-20261021",
      "public-replay-20261021",
      "public-release-20261021",
      "public-release-20261022",
      "public-sync-revisions-20261023",
      "public-sync-outbox-20261023",
      "public-ci-run-20261023",
      "public-release-20261024",
      "public-rc-drive-runtime-20261024"
    ],
    "lesson": "rc-33"
  },
  {
    "id": "reconversion-control",
    "title": "Reconversion Control",
    "status": "Application publiée · parcours enrichi",
    "summary": "PWA bilingue, Daily Five, SRS adaptatif, cours, labs et preuves indépendants. Synchronisation chiffrée facultative. Projet 2027 : décision de formation et preuves datées. N02 et N03 sont fusionnés : provenance Pages et conservation des saisies pendant les envois.",
    "skills": "PWA · JavaScript · pédagogie · validation · cloud opt-in",
    "limit": "Les statuts sont déclarés par l’utilisateur ; XP et lecture ne certifient pas une compétence. Aucun Supabase configuré par défaut.",
    "url": "https://ipoower.github.io/Reconversion-Control/",
    "repository": "https://github.com/iPoower/Reconversion-Control",
    "sources": [
      "public-reconversion",
      "public-project-v3-20261021",
      "public-pages-provenance-20261024",
      "public-progress-snapshot-20261024"
    ],
    "lesson": "rc-41"
  },
  {
    "id": "control-vault",
    "title": "Control Vault",
    "status": "Phase 1 · prototype de démonstration, espace Drive raccordé",
    "summary": "Les écrans historiques restent des démonstrations. Un espace Drive séparé est raccordé par la PR #14 fusionnée : archives chiffrées opaques, file durable, relecture et téléchargement vers Race Control.",
    "skills": "TypeScript · architecture · intégrité · scénarios d’échec",
    "limit": "Aucune connexion Google/Supabase ni sauvegarde personnelle durable active n’est attestée par cette revue. La configuration est absente par défaut. Les PR #16 à #19 restent ouvertes au contrôle du 24/10 ; leur code ne fait pas partie de main. Les tests du raccord emploient Google fictif ; la visibilité réelle, la restauration et l’iPhone physique restent à vérifier. Vault ne déchiffre pas et n’authentifie pas GCM.",
    "url": "https://control-vault-ipoower.pages.dev/",
    "repository": "https://github.com/iPoower/Control-Vault",
    "sources": [
      "public-control-vault",
      "public-cv-crypto",
      "public-vault-contract-20261021",
      "public-vault-transport-20261022",
      "public-vault-profile-20261022",
      "public-vault-a2-20261023",
      "public-cv-drive-connection-20261024",
      "public-gis-token-20261024"
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
