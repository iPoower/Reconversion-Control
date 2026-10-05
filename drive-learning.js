"use strict";

/*
  Curated from the user's private Google Drive library.
  Only bibliographic references and original teaching adaptations are published here.
  No Drive IDs, private URLs, or reproduced book chapters are included.
*/
const RC_DRIVE_SOURCES=[
 {id:"src-python-crash",title:"Python Crash Course",author:"Eric Matthes",domain:"Programmation",covers:"Variables, structures de données, conditions, fonctions, fichiers, exceptions, tests, API et Git."},
 {id:"src-eloquent-js",title:"Eloquent JavaScript",author:"Marijn Haverbeke",domain:"Programmation Web",covers:"Valeurs, contrôle de flux, fonctions, objets, tableaux, JSON, abstraction et asynchrone."},
 {id:"src-linux-hackers",title:"Linux Basics for Hackers",author:"OccupyTheWeb",domain:"Linux",covers:"Terminal Linux, fichiers, permissions, processus, réseau, scripting et bases sécurité."},
 {id:"src-networking-basics",title:"Networking Basics",author:"KodeKloud",domain:"Réseau",covers:"Interfaces, adressage IP, routage, gateway, IP forwarding, résolution de noms et DNS."},
 {id:"src-security-plus",title:"CompTIA Security+ Guide to Network Security Fundamentals",author:"Mark Ciampa",domain:"Cybersécurité",covers:"Menaces, vulnérabilités, IAM, durcissement, segmentation, attaques applicatives et sécurité IA."},
 {id:"src-api-security",title:"API Security in Action",author:"Neil Madden",domain:"API Security",covers:"Threat models, validation, authentification, autorisation, chiffrement, audit, rate limiting, cookies, tokens et OAuth2."},
 {id:"src-devops-prereq",title:"DevOps Pre-Requisites",author:"KodeKloud",domain:"DevOps",covers:"Linux CLI, services, packages, applications, réseau, JSON/YAML et prérequis opérationnels."},
 {id:"src-12factor",title:"12 Factor App",author:"KodeKloud / 12factor.net",domain:"Cloud / DevOps",covers:"Codebase, dépendances, config, backing services, build-release-run, processus, logs et dev/prod parity."},
 {id:"src-web-security",title:"Web Application Security",author:"Andrew Hoffman",domain:"Web Security",covers:"Architecture Web, reconnaissance défensive, APIs, dépendances, validation, XSS, injection et défenses."},
 {id:"src-ai-python",title:"Artificial Intelligence with Python",author:"Teik Toe Teoh & Zheng Rong",domain:"IA",covers:"Python, bases IA/ML, classification, régression, deep learning et exercices progressifs."}
];

const RC_LABS=[
 {id:"lab-01",level:"beginner",section:"fundamentals",topic:"programming",minutes:20,title:"Python · logique de base",enTitle:"Python · basic program logic",sources:["src-python-crash"],
 goal:"Passer d’un besoin simple à une fonction lisible avec variables, liste, condition et retour.",
 steps:["Crée une liste de températures fictives : 4, 7, 11 et -1 °C.","Écris une fonction qui renvoie « gel », « froid » ou « doux » selon la valeur.","Parcours la liste et construis un nouvel objet contenant température + verdict.","Ajoute au moins un cas limite et explique ce que ta fonction doit renvoyer."],
 expected:"Tu sais expliquer variable, liste, condition, fonction, argument et valeur de retour sans réciter une définition.",
 check:["Le code est découpé en une fonction.","Chaque entrée produit un résultat déterministe.","Tu peux expliquer en anglais : input, condition, function, return value."],
 english:"Explain what your function receives, what decision it makes, and what it returns."},

 {id:"lab-02",level:"beginner",section:"fundamentals",topic:"formats",minutes:20,title:"JavaScript · objets, tableaux et JSON",enTitle:"JavaScript · objects, arrays and JSON",sources:["src-eloquent-js"],
 goal:"Comprendre comment une application transforme des données JSON en objets utilisables.",
 steps:["Pars de trois objets météo fictifs contenant time, temperature et rain.","Place-les dans un tableau puis filtre uniquement les heures avec pluie.","Transforme le résultat pour ne garder que time + temperature.","Convertis le résultat en JSON puis explique la différence entre l’objet JavaScript et sa sérialisation."],
 expected:"Tu sais lire une petite structure JSON et suivre filter → map → stringify.",
 check:["Tu distingues objet, tableau et chaîne JSON.","Le résultat contient seulement les éléments pluvieux.","Tu peux expliquer data structure, filter et serialization."],
 english:"Describe the difference between a JavaScript object and a JSON string."},

 {id:"lab-03",level:"beginner",section:"linux",topic:"linux-fs",minutes:20,title:"Linux · retrouver un fichier sans se perdre",enTitle:"Linux · find a file without getting lost",sources:["src-linux-hackers","src-devops-prereq"],
 goal:"Naviguer, créer et retrouver des fichiers depuis le terminal dans un environnement de test.",
 steps:["Dans un dossier de lab dédié, crée app/config/logs avec mkdir -p.","Crée config/app.conf et logs/app.log sans utiliser l’explorateur graphique.","Retrouve app.conf avec find puis cherche un mot précis dans le fichier avec grep.","Affiche ton chemin courant et explique la différence entre chemin absolu et relatif."],
 expected:"Tu peux retrouver un fichier depuis le terminal et expliquer chaque commande utilisée.",
 check:["Aucune commande n’a besoin de sudo.","Le lab reste dans ton dossier de test.","Tu peux expliquer pwd, find, grep et path."],
 english:"Explain how you would locate a configuration file from the Linux terminal."},

 {id:"lab-04",level:"beginner",section:"linux",topic:"linux-perms",minutes:25,title:"Linux · permissions et moindre privilège",enTitle:"Linux · permissions and least privilege",sources:["src-linux-hackers","src-devops-prereq"],
 goal:"Lire puis modifier des permissions dans un dossier de lab sans utiliser sudo inutilement.",
 steps:["Crée un fichier secret.txt dans ton dossier de lab.","Observe son propriétaire et ses permissions avec ls -l.","Retire les droits au groupe et aux autres, puis vérifie le résultat.","Explique pourquoi « donner 777 pour que ça marche » est une mauvaise stratégie."],
 expected:"Tu sais lire rwx et relier chmod au principe du moindre privilège.",
 check:["Tu peux convertir rw------- en idée de droits utilisateur/groupe/autres.","Tu sais dire quand sudo est réellement nécessaire.","Tu peux expliquer permissions, owner et least privilege."],
 english:"Why is least privilege safer than giving every user full permissions?"},

 {id:"lab-05",level:"beginner",section:"network",topic:"routing",minutes:25,title:"Réseau · lire une route avant de diagnostiquer",enTitle:"Networking · read the route before troubleshooting",sources:["src-networking-basics"],
 goal:"Comprendre interface, adresse, route locale et gateway sans modifier le réseau de la machine.",
 steps:["Observe les interfaces et adresses avec ip addr ou l’équivalent de ton OS.","Observe la table de routage avec ip route ou route print.","Identifie la route par défaut et son next hop.","Dessine le chemin logique PC → gateway → Internet et explique ce qui se passe si la gateway est absente."],
 expected:"Tu sais lire une table de routage simple avant de lancer des hypothèses.",
 check:["Tu identifies interface, réseau local et default route.","Tu distingues destination et next hop.","Tu peux expliquer route, gateway et interface."],
 english:"What is a default gateway, and when does a host use it?"},

 {id:"lab-06",level:"beginner",section:"network",topic:"dns",minutes:20,title:"Réseau · suivre une résolution DNS",enTitle:"Networking · trace a DNS resolution",sources:["src-networking-basics"],
 goal:"Distinguer nom, adresse IP, résolution locale et serveur DNS.",
 steps:["Choisis un domaine public de test et résous-le avec nslookup ou dig.","Observe au minimum le nom demandé et l’adresse retournée.","Compare le rôle du fichier hosts local avec celui d’un résolveur DNS.","Explique pourquoi « le ping marche par IP mais pas par nom » oriente vers un problème de résolution."],
 expected:"Tu sais séparer connectivité IP et résolution de noms.",
 check:["Tu n’assimiles plus DNS à Internet lui-même.","Tu sais expliquer cache et résolution.","Tu peux expliquer hostname, resolver et DNS record."],
 english:"If an IP address works but the hostname does not, what would you investigate first?"},

 {id:"lab-07",level:"intermediate",section:"security",topic:"cia-risk",minutes:20,title:"Cyber · transformer un incident en analyse de risque",enTitle:"Cyber · turn an incident into a risk analysis",sources:["src-security-plus"],
 goal:"Passer d’un symptôme à menace, vulnérabilité, impact et priorité.",
 steps:["Imagine qu’un token d’API soit visible dans un dépôt public de démonstration.","Sépare : actif, menace, vulnérabilité, impact et contrôles.","Indique quels axes CIA sont touchés et pourquoi.","Propose trois actions dans l’ordre : contenir, corriger, prévenir la récidive."],
 expected:"Tu ne confonds plus vulnérabilité, menace, incident et risque.",
 check:["L’impact est concret, pas seulement « c’est dangereux ».","La remédiation inclut prévention et détection.","Tu peux expliquer asset, threat, vulnerability et impact."],
 english:"Explain the difference between a threat, a vulnerability, and a risk."},

 {id:"lab-08",level:"intermediate",section:"security",topic:"iam",minutes:25,title:"API · authentification ≠ autorisation",enTitle:"API · authentication is not authorization",sources:["src-api-security","src-security-plus"],
 goal:"Concevoir les contrôles d’un endpoint fictif sans écrire de mécanisme dangereux.",
 steps:["Imagine GET /vehicles/{id} et POST /vehicles/{id}/delete dans une API de lab.","Décris comment l’utilisateur s’authentifie.","Définis qui a le droit de lire et qui a le droit de supprimer.","Ajoute les événements qui doivent être journalisés et une limite de débit raisonnable.","Explique ce qu’il se passe si un utilisateur authentifié demande la ressource d’un autre utilisateur."],
 expected:"Tu sais séparer identité, authentification, autorisation, audit et disponibilité.",
 check:["Une identité valide ne donne pas tous les droits.","Le contrôle d’accès est côté serveur.","Tu peux expliquer authentication, authorization, audit log et rate limit."],
 english:"Why does successful authentication not automatically grant access to every resource?"},

 {id:"lab-09",level:"intermediate",section:"pentest",topic:"web",minutes:25,title:"Web Security · revue défensive d’un endpoint",enTitle:"Web Security · defensive endpoint review",sources:["src-web-security","src-api-security"],
 goal:"Analyser un endpoint fictif du point de vue défense : entrée, sortie, identité et dépendances.",
 steps:["Prends un endpoint fictif qui reçoit name, email et comment.","Liste les validations attendues côté serveur.","Décide comment encoder ou traiter la sortie avant affichage HTML.","Vérifie où doivent être appliqués authentification et contrôle d’accès.","Liste les dépendances tierces et ce que tu voudrais connaître avant une mise en production."],
 expected:"Tu raisonnes contrôle défensif avant de penser exploitation.",
 check:["Validation et encodage sont distingués.","Le navigateur n’est pas considéré comme une frontière de confiance.","Tu peux expliquer input validation, output encoding et dependency."],
 english:"What defensive checks would you require before exposing a new web endpoint?"},

 {id:"lab-10",level:"intermediate",section:"devsecops",topic:"cicd",minutes:25,title:"DevOps · séparer build, release et run",enTitle:"DevOps · separate build, release and run",sources:["src-devops-prereq","src-12factor"],
 goal:"Comprendre pourquoi un artefact construit ne doit pas changer entre validation et production.",
 steps:["Dessine une pipeline minimale : source → build → tests → release → deploy/run.","Place les variables de configuration hors du code et indique à quel moment elles sont injectées.","Associe chaque étape à une preuve : SHA, artefact, résultat de test ou version.","Explique pourquoi reconstruire différemment juste avant la prod affaiblit la traçabilité."],
 expected:"Tu sais relier reproductibilité, configuration et promotion d’un artefact.",
 check:["Build, release et run ont des rôles distincts.","La configuration sensible n’est pas codée en dur.","Tu peux expliquer artifact, release, configuration et deployment gate."],
 english:"Why should the artifact tested in CI be the same artifact promoted to production?"},

 {id:"lab-11",level:"intermediate",section:"devsecops",topic:"docker",minutes:25,title:"12‑Factor · préparer une app conteneurisable",enTitle:"12‑Factor · prepare an app for containers",sources:["src-12factor","src-devops-prereq"],
 goal:"Identifier ce qui empêche une petite application d’être portable et jetable.",
 steps:["Imagine une app qui stocke config, sessions et logs dans des fichiers locaux.","Classe chaque élément : config, processus, backing service ou log.","Déplace mentalement la config vers des variables d’environnement.","Propose une stratégie pour que le processus soit stateless et que les logs aillent vers stdout.","Explique comment l’app doit réagir à un arrêt propre."],
 expected:"Tu comprends pourquoi conteneuriser n’est pas seulement écrire un Dockerfile.",
 check:["La configuration est séparée du code.","Les sessions ne dépendent pas du disque local du processus.","Tu peux expliquer stateless, environment variable, stdout et graceful shutdown."],
 english:"What makes an application stateless and easier to run in containers?"},

 {id:"lab-12",level:"intermediate",section:"cloud",topic:"secrets",minutes:20,title:"Cloud · cartographier config, secrets et données",enTitle:"Cloud · map configuration, secrets and data",sources:["src-12factor","src-security-plus"],
 goal:"Décider ce qui peut être public, configurable, secret ou chiffré.",
 steps:["Liste cinq valeurs fictives : URL d’API, mot de passe, feature flag, clé de chiffrement et région cloud.","Classe-les en code, config non sensible ou secret.","Décris où elles devraient vivre en développement et en production.","Ajoute rotation, accès minimal et journalisation pour les secrets critiques."],
 expected:"Tu ne mets plus toutes les variables d’environnement dans la catégorie « secret ».",
 check:["Tu distingues configuration et secret.","Une rotation est prévue pour les credentials.","Tu peux expliquer secret rotation, access control et configuration."],
 english:"What is the difference between application configuration and a secret?"},

 {id:"lab-13",level:"pro",section:"security",topic:"hardening",minutes:30,title:"Security Engineering · défense en profondeur d’une API",enTitle:"Security Engineering · defense in depth for an API",sources:["src-api-security","src-security-plus","src-web-security"],
 goal:"Assembler plusieurs contrôles complémentaires au lieu de chercher un contrôle miracle.",
 steps:["Pour une API fictive, liste les actifs et principaux objectifs de sécurité.","Ajoute validation, authentification, autorisation, chiffrement en transit, audit et rate limiting.","Pour chaque contrôle, note une défaillance qu’il ne couvre pas à lui seul.","Ajoute un mécanisme de détection ou de réponse pour les événements anormaux."],
 expected:"Tu sais expliquer pourquoi la sécurité repose sur plusieurs couches.",
 check:["Chaque contrôle répond à un risque précis.","Tu identifies au moins une limite par contrôle.","Tu peux expliquer defense in depth, security control et threat model."],
 english:"How would you design defense in depth for a public API?"},

 {id:"lab-14",level:"pro",section:"ai",topic:"mlops",minutes:30,title:"IA · provenance et promotion d’un modèle",enTitle:"AI · model provenance and promotion",sources:["src-ai-python","src-security-plus"],
 goal:"Appliquer les réflexes CI/CD et supply chain aux données et modèles.",
 steps:["Imagine un modèle v3 entraîné sur dataset D7 avec code C12.","Définis les identifiants à conserver pour reproduire le résultat.","Ajoute une évaluation avant promotion et un critère de rejet.","Décris comment tracer un changement de dataset, de code ou de modèle.","Ajoute un risque lié à des données d’entraînement altérées et un contrôle préventif."],
 expected:"Tu traites données, code et modèle comme une chaîne de provenance.",
 check:["Une version du modèle seule n’est pas considérée suffisante.","La promotion dépend d’une évaluation explicite.","Tu peux expliquer provenance, evaluation, promotion et training data."],
 english:"What information do you need to reproduce and trust a machine-learning model?"},

 {id:"lab-15",level:"pro",section:"portfolio",topic:"race-tests",minutes:30,title:"Portfolio · raconter une régression Race Control",enTitle:"Portfolio · explain a Race Control regression",sources:["src-devops-prereq","src-web-security"],
 goal:"Transformer un incident réel en preuve d’ingénierie compréhensible en entretien.",
 steps:["Choisis une régression déjà corrigée dans Race Control.","Écris le symptôme observable sans expliquer encore la cause.","Décris reproduction → cause racine → correctif minimal → tests → vérification du SHA.","Ajoute ce que tu as changé dans la CI pour empêcher la récidive.","Présente le tout à voix haute en 90 secondes, d’abord en français puis en anglais."],
 expected:"Tu sais raconter une investigation technique avec preuves et limites.",
 check:["Le récit distingue symptôme et cause racine.","Le résultat cite une preuve de test ou de déploiement.","Tu peux expliquer regression, root cause, fix, test et verification."],
 english:"Walk me through a regression you diagnosed, fixed, tested and verified in production."}
];

function rcDriveSource(id){return RC_DRIVE_SOURCES.find(function(source){return source.id===id;})||null;}
