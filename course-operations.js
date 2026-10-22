"use strict";
// Adaptation pédagogique des supports prod-15. Aucun document ni secret original embarqué.
const RC_COURSE_OPERATIONS = [
  {
    id: "rc-22", chapter: 22, section: "portfolio", title: "Le relais cloud GitHub Actions",
    summary: "Comprendre ce que le relais prépare lorsque l’iPhone est fermé, et ce qu’il ne sait pas de ta position réelle.",
    tags: ["GitHub Actions", "relais", "METAR", "notifications", "cron"],
    related: ["race-arch", "cicd", "shared"],
    goals: ["Séparer le rôle du navigateur et celui du worker cloud.", "Lire une planification et expliquer ses limites de confidentialité et de disponibilité."],
    sections: [
      {title: "Deux lieux d’exécution", body: ["Le navigateur est le cockpit interactif : il affiche la météo, déverrouille l’agenda et traite le GPS vivant lorsque l’application est ouverte. Le relais est un programme Node.js exécuté sur une machine éphémère de GitHub Actions. Il peut travailler sans que le téléphone soit allumé. Un frontend statique peut donc avoir un worker cloud : statique ne veut pas dire sans automatisation.", "Au baseline prod-15, src/relay.js collecte des observations METAR, synchronise le calendrier, géocode les lieux, calcule les routes planifiées et leur météo, puis prépare certaines notifications ntfy. Il écrit des observations publiques minimisées et un agenda chiffré. Le même moteur métier est réutilisé, mais des entrées et horaires différents peuvent donner des résultats différents."]},
      {title: "Lire le planning, sans promettre une heure exacte", body: ["Dans un cron, les cinq champs représentent minute, heure, jour du mois, mois et jour de semaine. L’extrait historique ci-dessous demande un passage aux minutes 7 et 37 de chaque heure et un renfort aux minutes 22 et 52 entre 3 h et 5 h UTC. workflow_dispatch permet un déclenchement manuel. Ce planning décrit prod-15 ; les archives prod-8 ne décrivent pas la même cadence.", "Une exécution planifiée GitHub peut être retardée. L’interface doit montrer l’heure réelle de l’observation et son âge, plutôt qu’assimiler le planning à une garantie de fraîcheur. Le workflow du relais réserve l’accès à l’Environment production à main."], code: "# Extrait historique du workflow Race Control prod-15\non:\n  schedule:\n    - cron: '7,37 * * * *'\n    - cron: '22,52 3-5 * * *'\n  workflow_dispatch:"},
      {title: "Notifications et diagnostic minimisés", body: ["Le relais connaît les origines planifiées et les événements lus depuis le flux iCal privé, puis publie l’agenda chiffré. Il ne reçoit pas le GPS vivant du téléphone. Une notification préparée dans le cloud ne reflète donc pas forcément un déplacement décidé localement après sa préparation. Le dossier décrit un quota et une protection contre les doublons ; une notification ne doit pas contenir un titre d’agenda ou une adresse personnelle.", "Les fournisseurs ont des responsabilités précises : AviationWeather pour les METAR, Open-Meteo pour les prévisions, OSRM pour les routes, GeoPF pour le géocodage et ntfy pour les notifications. Les diagnostics publics expliquent un échec sans recopier les données privées qui l’ont provoqué."]}
    ],
    pitfalls: ["Confondre l’app fermée avec un suivi GPS cloud permanent.", "Présenter l’heure cron comme l’heure garantie d’une donnée fraîche.", "Copier un titre d’événement dans une notification ou un log public."],
    interview: {question: "Pourquoi le relais ne recalcule-t-il pas continuellement le départ depuis mon GPS lorsque l’app est fermée ?", answer: "Parce que le GPS vivant n’est pas envoyé à GitHub. Le relais prépare une analyse planifiée, tandis que le navigateur ouvert peut utiliser la position réelle. Cette limite préserve la confidentialité et respecte les contraintes iOS."},
    exercise: {prompt: "Il est 8 h 10, l’app est fermée et la dernière observation date de 7 h 37. Distingue ce que le relais peut mettre à jour de ce qu’il ne peut pas connaître.", answer: "Il peut relire les METAR, prévisions et événements, puis recalculer les routes planifiées lors d’un prochain run. Il ne sait pas si tu as quitté ton domicile. La donnée affichée reste celle de 7 h 37 tant qu’aucun run réussi n’en a fourni une plus récente ; le planning seul ne la rend pas fraîche."},
    sources: [{id: "course-prod15", pages: "24"}, {id: "dossier-prod15", pages: "15, 22–23, 25"}]
  },
  {
    id: "rc-23", chapter: 23, section: "security", title: "Chiffrement : AES-GCM, PBKDF2 et séparation des clés",
    summary: "Distinguer dérivation de clé, chiffrement authentifié et séparation des secrets.",
    tags: ["AES-GCM", "PBKDF2", "sel", "IV", "APP_KEY", "RC_KEY"], related: ["crypto", "secrets", "race-privacy"],
    goals: ["Expliquer le rôle de PBKDF2, du sel, de l’IV et du tag GCM.", "Justifier deux secrets indépendants plutôt qu’une clé universelle."],
    sections: [
      {title: "Le coffre, sa clé et son sceau", body: ["Chiffrer rend le contenu illisible sans la clé. Une phrase secrète n’est pas utilisée directement comme une clé AES : PBKDF2 la transforme avec un sel et de nombreuses itérations. Dans le code prod-15, PBKDF2-SHA256 emploie 600 000 itérations et produit 32 octets pour AES-256. Ce coût ralentit les essais de mots de passe ; il ne rend pas un mot de passe faible invincible.", "Le sel distingue les dérivations de mots de passe identiques. L’IV distingue les opérations de chiffrement ; sa réutilisation avec la même clé est dangereuse en GCM. Sel et IV ne sont pas des mots de passe. Le tag d’authentification permet de refuser un contenu altéré ou une mauvaise clé au lieu d’accepter silencieusement des données corrompues."], code: "// Extrait de sealWith() ; pass, salt et iv ne sont pas des valeurs réelles.\nconst key = crypto.pbkdf2Sync(pass, salt, 600000, 32, 'sha256');\nconst cipher = crypto.createCipheriv('aes-256-gcm', key, iv);"},
      {title: "Deux clés, deux périmètres", body: ["APP_KEY déverrouille l’app et protège l’agenda. RC_KEY ouvre la configuration secrète du relais. GCAL_ICS est l’adresse secrète du flux calendrier, pas une clé AES ni une URL à publier. Les noms de ces variables décrivent leurs rôles ; aucune valeur réelle n’est nécessaire pour apprendre ou tester.", "Le code prod-15 refuse des clés APP_KEY et RC_KEY égales après normalisation. Des tests vérifient que chaque clé n’ouvre que le fichier prévu. Cette séparation réduit le blast radius, c’est-à-dire l’étendue des dégâts d’une fuite. L’archive prod-8 proposait encore de séparer les clés : le dossier prod-15 décrit cette correction comme livrée."]},
      {title: "Le chiffrement ne protège pas tout le contexte", body: ["Un agenda chiffré peut être publié sans son texte clair, mais le code qui possède sa clé peut le déchiffrer. Protéger la clé exige donc aussi une frontière d’exécution : les tests de PR utilisent des secrets fictifs et les jobs autorisés accèdent à l’Environment production. Masquer une variable dans les logs ne suffit pas.", "La sauvegarde Race Control fournie est une enveloppe chiffrée. Elle n’a pas été déchiffrée et ne constitue pas un cours ni une sauvegarde de progression Reconversion Control. L’apprentissage utilise les mécanismes expliqués dans les documents, sans embarquer le fichier chiffré ou demander sa phrase secrète."]}
    ],
    pitfalls: ["Dire que PBKDF2 chiffre : il dérive une clé, AES-GCM chiffre et authentifie.", "Utiliser la même clé pour ouvrir l’agenda et la configuration cloud.", "Croire qu’un fichier chiffré autorise tous les jobs à recevoir la clé."],
    interview: {question: "Pourquoi ne pas réutiliser APP_KEY pour le relais ?", answer: "Une seule fuite ouvrirait alors deux périmètres. Des clés indépendantes et des tests de refus limitent les conséquences. Il faut aussi réserver l’accès aux clés au code de confiance ; leur séparation ne remplace pas cette frontière."},
    exercise: {prompt: "Associe chaque élément à son rôle : PBKDF2, sel, IV, AES-GCM, tag, APP_KEY et RC_KEY. Que doit produire un déchiffrement avec la mauvaise clé ?", answer: "PBKDF2 dérive ; le sel distingue les dérivations ; l’IV distingue les chiffrements ; AES-GCM chiffre avec authentification ; le tag permet de vérifier l’intégrité. APP_KEY ouvre app/agenda, RC_KEY configuration du relais. Une mauvaise clé doit entraîner un refus d’authentification, jamais l’utilisation de données prétendument valides."},
    sources: [{id: "course-prod15", pages: "25"}, {id: "dossier-prod15", pages: "16, 26"}]
  },
  {
    id: "rc-24", chapter: 24, section: "security", title: "Confidentialité : ce qui reste local, ce qui part dehors",
    summary: "Suivre une donnée, sa précision, sa destination et sa durée de conservation avant de parler de confidentialité.",
    tags: ["minimisation", "GPS", "localStorage", "obs.json", "privacy"], related: ["race-privacy", "cia-risk", "hardening"],
    goals: ["Classer données locales, données chiffrées et diagnostics publics.", "Expliquer pourquoi une précision utile varie selon l’action et le destinataire."],
    sections: [
      {title: "Dessiner les sorties de données", body: ["Une application météo et routière doit appeler des fournisseurs. Privacy by design signifie décider ce qui sort, vers qui, avec quelle précision et pendant combien de temps. Il faut distinguer les données présentes sur l’appareil, les appels réseau nécessaires et les fichiers publics servis par GitHub Pages.", "Au prod-15, le GPS courant peut être conservé localement sous twrc.gps. La route vivante reste en mémoire et n’est pas publiée dans GitHub. Son origine OSRM est arrondie à 0,001°, tandis que domicile et travail côté relais sont arrondis à 0,01° avant les appels OSRM. L’arrondi réduit la précision exposée ; il ne garantit pas l’anonymat."]},
      {title: "Agenda privé et diagnostic public", body: ["calendar.sealed.json protège l’agenda et sa géométrie simplifiée avec APP_KEY. obs.json est public : il doit contenir uniquement les observations et diagnostics minimisés prévus, jamais les titres ou lieux personnels d’un déplacement. Un journal d’erreur doit expliquer qu’un géocodage a échoué sans recopier l’adresse responsable.", "La mémoire d’arrivée twrc.tripdone contient des identifiants techniques, un mode et des horodatages sans coordonnées, avec purge après 24 heures dans cette version. Les autres familles locales incluent twrc.settings.v1 pour les réglages, twrc.cache.* pour la météo, twrc.view pour la vue, twrc.outfit.occasion pour l’usage et twrc.tripmap pour la carte. Les clés de déverrouillage et twrc.plain* demandent une attention particulière sur l’appareil."]},
      {title: "La précision suit le besoin", body: ["Un clic volontaire vers Waze utilise la destination exacte locale pour arriver au bon endroit. Le relais peut utiliser une origine arrondie pour préparer un routage météo. Ces actions n’ont pas le même destinataire ni le même besoin de précision. Avant une nouvelle intégration, consigne aussi les quotas, la durée de cache et le comportement si le fournisseur échoue.", "Reconversion Control conserve localement tes statuts, dates de révision, vue, filtres, recherche et préférence de thème ; il ne collecte ni GPS ni agenda. Les adaptations pédagogiques ci-dessous sont publiques, mais les originaux, chemins des pièces jointes et sauvegarde chiffrée restent hors du dépôt. L’export de progression contient les statuts et révisions, sans préférences, adresse ou position GPS."]}
    ],
    pitfalls: ["Affirmer qu’aucune donnée ne sort alors que des API reçoivent des coordonnées.", "Confondre arrondi et anonymisation garantie.", "Exporter automatiquement toutes les clés localStorage d’autres applications du même domaine."],
    interview: {question: "Pourquoi arrondir côté relais mais utiliser le domicile exact pour un clic Waze ?", answer: "Le routage météo cloud n’a pas besoin de la précision de la porte. La navigation choisie sur l’appareil a besoin de la destination exacte. On adapte la précision au besoin, avec une action volontaire et sans publier la route vivante."},
    exercise: {prompt: "Classe : titre d’agenda, état de révision Reconversion, origine GPS OSRM, diagnostic de panne et mémoire d’arrivée. Indique pour chacun une règle de publication.", answer: "Titre : agenda chiffré, jamais log public. Révision : stockage/export local Reconversion. Origine OSRM : appel nécessaire avec arrondi du contexte, pas publication GitHub. Diagnostic : public seulement s’il est minimisé sans valeurs personnelles. Mémoire d’arrivée : identifiant technique et date locaux, sans coordonnées, avec expiration."},
    sources: [{id: "course-prod15", pages: "26–27"}, {id: "dossier-prod15", pages: "17, 22, 30–31"}]
  },
  {
    id: "rc-25", chapter: 25, section: "devsecops", title: "Tests : unitaire, E2E, Chromium, WebKit et contre-tests",
    summary: "Choisir une preuve adaptée et vérifier qu’un test détecte réellement le comportement erroné.",
    tags: ["tests", "E2E", "Chromium", "WebKit", "fixtures", "contre-test"], related: ["race-tests", "cicd"],
    goals: ["Distinguer test moteur, parcours utilisateur, test relais et scanner.", "Construire un scénario positif, un scénario négatif et un contre-test utile."],
    sections: [
      {title: "Plusieurs niveaux, plusieurs preuves", body: ["Un test unitaire appelle directement une fonction avec des entrées contrôlées : test_engine.js vérifie les calculs, test_wardrobe.js les règles de tenue. Un E2E traverse le DOM, les clics, le stockage, le temps et le réseau simulé. Il répond à une question utilisateur comme : une marche de quelques centaines de mètres déclenche-t-elle à tort un départ en voiture ?", "relay-smoke.js exécute le vrai relais avec un agenda, une géographie et des clés fictifs. Le scanner privacy recherche des valeurs privées connues dans les fichiers : il ne prouve pas le bon fonctionnement du GPS. Chaque test a donc une portée et une limite qu’il faut nommer."]},
      {title: "Le navigateur et les données de test", body: ["Les parcours Race Control sont exécutés dans Chromium et WebKit. WebKit couvre beaucoup de différences du moteur utilisé par Safari, mais ne reproduit pas tout un iPhone physique. Les permissions, la reprise PWA, l’économie d’énergie et Waze installé demandent des essais terrain. Les chiffres de suites du PDF sont des preuves historiques prod-15, pas les résultats de la PR qui enrichit Reconversion Control.", "Les tests navigateur ne reçoivent pas de secrets réels. Ils utilisent des fixtures, une horloge maîtrisée et un réseau externe bloqué pour ne pas retomber accidentellement sur l’agenda de production. Une donnée fictive doit être assez réaliste pour déclencher les branches importantes, tout en restant sans lien avec un rendez-vous personnel."], code: "# Commandes Race Control du support historique\nnode tests/run-ci.js\nBROWSER=webkit node tests/run-ci.js\n# Dans Reconversion Control, les scripts de test portent d’autres noms."},
      {title: "Tester le refus et la sensibilité du test", body: ["Un scénario positif prouve qu’un mouvement automobile valide démarre le trajet. Un scénario négatif prouve que marcher, avoir un GPS imprécis ou un saut de position ne suffit pas. Pour un contre-test, on réintroduit temporairement l’ancienne règle dans une copie isolée et on vérifie que le test échoue ; on restaure ensuite l’implémentation correcte.", "Une CI verte prouve uniquement les cas effectivement exécutés sur le code identifié. Un test qui passe aussi avec la vieille erreur n’est pas une bonne protection. Les bugs GPS trouvés après des CI vertes ont motivé des scénarios plus précis, des revues indépendantes et des contre-tests."]}
    ],
    pitfalls: ["Prendre un scanner de secrets pour un test fonctionnel.", "Employer des clés réelles dans un navigateur de PR.", "Présenter WebKit comme une certification complète du téléphone physique."],
    interview: {question: "Pourquoi un contre-test apporte-t-il plus qu’une suite verte seule ?", answer: "Il vérifie que le test échoue lorsque le comportement erroné revient. Cela prouve la sensibilité du scénario à cette régression, en complément de son succès avec le code correct."},
    exercise: {prompt: "Prépare trois preuves pour le bug “450 m de marche déclenchent active”.", answer: "Négatif : des fixes précis à vitesse de marche gardent le trajet hors active. Positif : deux fixes à vitesse automobile et une distance significative déclenchent active. Contre-test : la règle historique basée seulement sur l’éloignement fait échouer le scénario de marche. Tous les fixes et lieux sont fictifs."},
    sources: [{id: "course-prod15", pages: "27–28, 36–37"}, {id: "dossier-prod15", pages: "20, 26, 30–31"}]
  },
  {
    id: "rc-26", chapter: 26, section: "devsecops", title: "CI/CD : de la PR à prod-N",
    summary: "Relier la revue, les contrôles, le build et la version réellement servie en ligne.",
    tags: ["CI", "CD", "jobs", "gates", "SHA", "prod-N"], related: ["cicd", "race-cicd", "git", "supply"],
    goals: ["Lire les dépendances d’un job de déploiement.", "Distinguer code testé, code approuvé, artefact construit et version publiée."],
    sections: [
      {title: "Du commit à la revue", body: ["CI, intégration continue, exécute les tests et contrôles sur une modification. CD organise sa livraison ou son déploiement. Une branche propose une modification, une PR rend son diff et ses checks visibles, et le SHA identifie le commit examiné. Ajouter un commit après un vert change la preuve : il faut contrôler le nouveau SHA.", "Dans Race Control prod-15, les tests PR n’utilisent que des données fictives. Un scanner de confiance peut lire les fichiers de la PR sans exécuter son code avec des secrets. Les contrôles de confidentialité sur main peuvent utiliser les vraies valeurs sensibles après franchissement de la frontière de confiance."]},
      {title: "Les garde-fous du déploiement", body: ["needs exprime les jobs préalables. L’extrait prod-15 exige version, confidentialité, tests et relay-smoke. La condition réserve le déploiement à un push sur main. concurrency regroupe les déploiements, et cancel-in-progress: false évite d’interrompre un déploiement déjà engagé. Ces règles sont celles du projet Race Control historique, pas une autorisation de publier cette PR Reconversion.", "Un build reproductible lit les sources et le lockfile. npm ci installe les versions verrouillées ; tools/build.js produit l’artefact. Le pipeline met à jour les fichiers applicatifs de gh-pages/race-control, crée un tag prod-N et vérifie le HTML servi. Des dépendances verrouillées limitent la variation, sans prouver à elles seules l’absence de vulnérabilités."], code: "# Extrait historique Race Control prod-15\ndeploy:\n  needs: [version, confidentialite, tests, relay-smoke]\n  if: github.event_name == 'push' && github.ref == 'refs/heads/main'\n  concurrency:\n    group: race-control-deploy\n    cancel-in-progress: false"},
      {title: "Vérifier ce qui est réellement publié", body: ["Le commit source, le tag de production, version.json et l’empreinte du fichier servi doivent raconter la même version. Un job vert n’est pas une preuve que le téléphone a reçu la nouvelle page : le cache HTTP et le service worker peuvent encore servir une ancienne ressource. Vérifier le build et la réponse publique complète la chaîne.", "Une bonne description de PR indique le problème, le comportement obtenu, le SHA exact et les tests réellement terminés. Elle ne renvoie pas à un vieux run pour un nouveau HEAD. Les gestes de l’annexe sont : ouvrir la PR, regarder son diff, vérifier le SHA et les deux navigateurs, attendre les contrôles requis et publier uniquement après l’autorisation prévue."]}
    ],
    pitfalls: ["Attribuer la CI d’un ancien commit au HEAD courant.", "Confondre un artefact construit et le fichier effectivement servi.", "Déployer en contournant les dépendances du pipeline."],
    interview: {question: "Quelle différence entre tests de PR et contrôle confidentiel sur main ?", answer: "Les tests PR exécutent du code proposé avec des données fictives. Les jobs de confiance peuvent lire des secrets pour scanner les fichiers, sans exécuter le code non approuvé. Les contrôles main appartiennent au contexte approuvé et restent séparés des navigateurs."},
    exercise: {prompt: "Le commit A est vert. Un correctif B est ajouté et la PR affirme toujours “SHA final A, CI verte”. Que faut-il corriger ?", answer: "Identifier B comme HEAD, lancer ou attendre ses checks, examiner son diff et actualiser les preuves de la PR. Après une publication autorisée, comparer version.json et le fichier servi au build de la version attendue. Le vert de A ne valide pas B."},
    sources: [{id: "course-prod15", pages: "28–29, 36–37"}, {id: "dossier-prod15", pages: "19, 25, 30"}]
  },
  {
    id: "rc-27", chapter: 27, section: "devsecops", title: "Rollback et versionnement",
    summary: "Revenir à un code connu sans effacer les données fraîches produites par le relais.",
    tags: ["rollback", "tag", "prod-N", "gh-pages", "version.json"], related: ["race-cicd", "git", "cicd"],
    goals: ["Expliquer le lien entre tag de production et commit source.", "Distinguer retour du code et conservation des données opérationnelles."],
    sections: [
      {title: "Le tag rend une version retrouvable", body: ["Un tag prod-N pointe vers le commit source de la production correspondante. Il permet de désigner une version précise sans se fier à “la version d’hier”. version.json relie le numéro de production, le SHA et l’heure de publication ; ce sont des indices opérationnels à vérifier, pas des titres de fichiers approximatifs.", "Le support prod-15 décrit un retour contrôlé : on lance le workflow Race Control · tests avec la version prod-N choisie. L’ancien code repasse les contrôles avant publication. Cette procédure est une explication pédagogique ; aucun workflow de production n’est lancé depuis l’application d’apprentissage."], code: "# Geste documenté dans GitHub Actions Race Control\nActions → Race Control · tests → Run workflow\nversion = prod-N\n# Choisir le tag réel de la version visée, puis suivre les contrôles."},
      {title: "Code ancien, observations actuelles", body: ["La branche de publication contient l’application et des fichiers dynamiques écrits par le relais. obs.json et l’agenda chiffré peuvent être plus récents que le code à restaurer. Un reset brutal de toute la branche ferait aussi reculer ces données et pourrait annuler le travail du relais.", "Le pipeline remplace seulement les fichiers applicatifs prévus et conserve les données opérationnelles. Il faut également surveiller les deux writers, déploiement et relais, pour éviter qu’une publication écrase une écriture récente. Ce risque de concurrence est identifié dans la dette du dossier prod-15."]},
      {title: "Une récupération demande des preuves", body: ["Choisir un tag connu ne suffit pas. Les tests doivent passer, les fichiers dynamiques doivent rester présents et la version servie doit correspondre à l’artefact attendu. Le service worker peut retarder la perception du rollback sur un appareil : vérifier la version et la fraîcheur dans la page complète l’analyse.", "Un rollback contrôlé réduit l’impact d’une régression fonctionnelle, mais n’efface pas une fuite de secret ni les copies de données déjà faites. Un incident de confidentialité demande une remédiation dédiée. Retourner au code précédent n’est donc pas une réponse universelle à tous les incidents."]}
    ],
    pitfalls: ["Faire un reset de gh-pages qui emporte les observations récentes.", "Retourner à une version sans repasser les contrôles.", "Croire qu’un rollback révoque un secret déjà exposé."],
    interview: {question: "Pourquoi ne pas faire simplement git reset --hard sur la branche de publication ?", answer: "Elle contient aussi des données fraîches du relais. Le workflow doit restaurer uniquement le code choisi après les contrôles, conserver les données actuelles et vérifier la version réellement servie."},
    exercise: {prompt: "Une régression UI apparaît dans prod-N. La dernière observation et l’agenda ont été rafraîchis il y a cinq minutes. Propose un retour contrôlé.", answer: "Identifier le tag précédent fiable, lancer la procédure documentée avec ses contrôles, remplacer les fichiers applicatifs seulement, préserver obs.json et l’agenda chiffré, puis comparer la version publique à l’artefact attendu. Vérifier aussi les appareils susceptibles de conserver l’ancien cache."},
    sources: [{id: "course-prod15", pages: "29"}, {id: "dossier-prod15", pages: "19, 24–25, 30–31"}]
  },
  {
    id: "rc-28", chapter: 28, section: "security", title: "Incident DevSecOps : comment un test a exposé des données",
    summary: "Comprendre pourquoi la frontière entre code de PR et secrets réels compte davantage qu’un masquage de logs.",
    tags: ["incident", "trust boundary", "pull_request_target", "fixtures", "secrets"], related: ["secrets", "race-tests", "zerotrust", "iam", "cloud-iam"],
    goals: ["Identifier la cause architecturale de l’incident décrit.", "Expliquer une remédiation qui sépare exécution non approuvée et accès aux secrets."],
    sections: [
      {title: "L’incident rapporté par les documents", body: ["Lors du durcissement historique de Race Control, un navigateur CI pouvait sortir de la simulation et atteindre le véritable agenda chiffré alors que son job disposait d’une clé réelle. Les supports rapportent des informations d’agenda brièvement visibles dans les logs publics, puis la suppression des runs concernés. Ils ne décrivent pas une fuite des clés elles-mêmes.", "Le chiffrement n’était pas la cause : le code de test avait le pouvoir de lire la clé et d’ouvrir les données. La frontière de confiance, ou trust boundary, était traversée par du code de PR ou de l’app exécuté dans un contexte secret. Un code capable de déchiffrer peut aussi transmettre le texte clair."]},
      {title: "Redessiner les rôles", body: ["Les navigateurs et relay-smoke utilisent désormais des agendas, géographies et clés fictifs. Le réseau extérieur des tests est bloqué pour éviter un repli sur des données réelles. Les secrets de production sont réservés à des jobs dédiés de confidentialité et à l’Environment production, avec main comme branche autorisée.", "Dans pr-privacy.yml, pull_request_target exécute un scanner provenant de main. Le scanner lit les fichiers proposés comme des données ; il ne lance pas les scripts de la PR avec les secrets. Cet événement n’est pas sûr par sa seule présence : checkout puis exécution du code non approuvé dans ce contexte recréerait le danger."], code: "Code de PR non approuvé\n  → tests avec fixtures et réseau extérieur bloqué\nFichiers de PR\n  → scanner de confiance issu de main\nSecrets de production\n  → jobs autorisés, aucun navigateur ni script de PR"},
      {title: "Prouver la nouvelle frontière", body: ["Les contrôles positifs vérifient qu’un job autorisé réalise le scan attendu. Les contrôles négatifs vérifient qu’une branche non autorisée ne reçoit pas les secrets. Les scanners connus détectent les valeurs privées attendues, mais ne justifient pas l’exécution de code proposé dans leur contexte.", "Masquer une variable dans un log protège seulement cet affichage. Le code pourrait faire un appel réseau, utiliser la clé pour déchiffrer ou révéler indirectement une information par un résultat de test. Le bon récit d’incident expose cause, impact rapporté, correction et preuve, sans republier les données privées de l’incident."]}
    ],
    pitfalls: ["Attribuer l’incident à AES-GCM alors que le job possédait la clé.", "Exécuter les scripts de la PR dans pull_request_target avec des secrets.", "Révéler des extraits d’agenda pour raconter l’incident en portfolio."],
    interview: {question: "Pourquoi masquer les secrets dans les logs ne suffit-il pas ?", answer: "Le code qui peut les lire peut les utiliser autrement : réseau, déchiffrement ou signal indirect. Il faut limiter le code autorisé à recevoir les secrets, et isoler les tests de PR avec des fixtures."},
    exercise: {prompt: "Un job pull_request_target récupère le scanner de main, mais lance aussi npm test depuis la branche proposée. Peut-on lui donner une vraie clé pour le scanner ?", answer: "Non : npm test exécuterait du code de la PR dans le même contexte secret. Séparer les jobs : tests sans secret et scanner de confiance qui lit les fichiers proposés sans les exécuter. Vérifier le refus d’accès pour les branches non autorisées."},
    sources: [{id: "course-prod15", pages: "30"}, {id: "dossier-prod15", pages: "16, 26, 30–31"}]
  },
  {
    id: "rc-29", chapter: 29, section: "devsecops", title: "Déboguer Race Control avec méthode",
    summary: "Transformer un symptôme en reproduction, puis en correction démontrée sur le vrai commit.",
    tags: ["debug", "reproduction", "GPS", "stale", "preuve"], related: ["race-tests", "race-arch", "programming"],
    goals: ["Localiser la couche responsable avant de modifier le code.", "Produire un journal de preuve sans recopier de données personnelles."],
    sections: [
      {title: "Décrire puis réduire", body: ["Note le symptôme avec la vue, la version, l’heure, l’action et le résultat attendu. Un écran immobile peut venir de l’UI, du moteur, d’une API, du GPS, du relais ou du service worker. Identifier la couche probable réduit les modifications inutiles. Pour un problème de cache, vérifier la version réellement chargée avant d’accuser le dernier code.", "Reproduis avec des données fictives et cherche l’état minimal : un fix vieux, une précision insuffisante, une route d’un autre événement, une température inconnue ou une requête tardive. Une observation doit être distinguée d’une hypothèse. Un log utile expose phase, âge, génération et identifiant technique, sans adresse ni titre personnel."]},
      {title: "Le bug de départ anticipé", body: ["Le cours décrit une voiture partie avant l’heure conseillée qui restait en état imminent. La référence GPS était remplacée avant l’heure : la voiture s’éloignait, mais sa référence la suivait. La cause était une transition d’état commandée par le temps et une référence mobile.", "La correction fige la référence de départ et fait dépendre active du mouvement automobile significatif. Les tests couvrent ensuite marche, voiture, vitesse absente et jitter. Un simple clic ou le dépassement de l’heure conseillée ne sont pas des preuves de départ."]},
      {title: "Le journal de preuve et les pannes attendues", body: ["La séquence utile est : reproduction → test rouge → correction ciblée → test vert → contre-test si la règle est subtile → revue sur SHA exact. Exécute Chromium, WebKit et les tests métier concernés. Après une publication autorisée, vérifie le résultat servi. Cette méthode permet de discuter la cause et le compromis plutôt que “ça semble marcher”.", "Le dossier fournit aussi les comportements attendus : GPS ancien sans transition, OSRM vivant tardif avec analyse ancienne explicitement marquée puis repli planifié, météo manquante sans conseil inventé, agenda illisible sans arrêter les vues météo/pneus. Ces états ne sont pas tous des bugs ; un fallback explicite peut être le comportement correct."], code: "# Repères de diagnostic du dépôt local, sans modifier la production\ngit status\ngit diff\ngit rev-parse HEAD\n# Puis lancer le test de reproduction approprié au projet."}
    ],
    pitfalls: ["Changer plusieurs couches avant d’avoir reproduit le symptôme.", "Confondre une donnée inconnue et une valeur nulle au sens numérique.", "Cacher un état ancien pour rendre l’interface rassurante."],
    interview: {question: "Pourquoi reproduire avant de modifier ?", answer: "Pour distinguer le problème réel de l’hypothèse et avoir une preuve qui échoue avant la correction puis passe après. La reproduction permet aussi de vérifier qu’un fallback est attendu plutôt qu’erroné."},
    exercise: {prompt: "Le trajet affiche encore une ancienne météo après un changement GPS. Donne une investigation en quatre étapes.", answer: "1. Identifier version, phase, âge du GPS et route affichée. 2. Simuler OSRM et météo arrivant dans un ordre inversé. 3. Vérifier génération et clé géographique, puis ajouter un test refusant une réponse ancienne. 4. Corriger la bascule atomique et vérifier nouveau vert plus scénario négatif et les deux navigateurs. Ne pas publier les positions du cas réel."},
    sources: [{id: "course-prod15", pages: "30–31"}, {id: "dossier-prod15", pages: "11–12, 23, 25–26"}]
  },
  {
    id: "rc-30", chapter: 30, section: "devsecops", title: "Dette technique, refactor et maintenabilité",
    summary: "Extraire les responsabilités progressivement et évaluer fournisseurs, pannes, exploitation et roadmap.",
    tags: ["dette", "refactor", "observabilité", "fournisseurs", "fallback", "roadmap"], related: ["race-arch", "race-cicd", "supply", "shared"],
    goals: ["Distinguer dette assumée et réécriture risquée.", "Évaluer une évolution avec son besoin, ses données, ses coûts et ses preuves."],
    sections: [
      {title: "Une responsabilité à la fois", body: ["Au prod-15, app.js concentre plus de 2 300 lignes et de nombreuses responsabilités : rendu, état GPS, stockage, calendrier, cartes et réseau. Cette concentration a accéléré les débuts mais augmente le coût de compréhension et le risque d’une modification. La dette technique est ce coût futur, pas la preuve que tout le produit échoue.", "Le dossier recommande des extractions progressives derrière les tests : live-trip.js pour l’automate, routing.js pour OSRM et les replis, calendar.js pour le modèle agenda, weather-route.js pour la météo de route, navigation.js pour Waze et storage.js/privacy.js pour les clés et purges. app.js doit devenir davantage orchestration et rendu. Ce sont des modules cibles historiques, pas une liste de fichiers déjà livrés."]},
      {title: "Chaque fournisseur ajoute un contrat", body: ["Les sources décrivent Open-Meteo et Météo-France pour la prévision, AviationWeather pour les METAR, OSRM pour les routes, GeoPF et des replis pour le géocodage, RainViewer pour le radar, Esri/OSM pour les tuiles, Leaflet pour la mini-carte, Waze pour la navigation et ntfy pour les notifications. SRI vérifie l’intégrité d’une bibliothèque externe ; une empreinte valide ne prouve pas que le code est sans faille.", "Avant d’ajouter un fournisseur, documente besoin précis, précision, fraîcheur, quota, coût, données envoyées, durée de cache, timeout, fallback et test. Le cours cite aussi un service de nom de commune : les listes sont des instantanés de dépendances, pas une garantie exhaustive de la version actuelle. Préférer une donnée existante évite appels et exposition inutiles."]},
      {title: "Dégrader explicitement et observer sans surveiller", body: ["Si OSRM échoue côté relais, une durée et une distance estimées peuvent être signalées par routed=false. Si Open-Meteo échoue, un cache est daté ou l’absence de données est affichée. Un GPS ancien ne déclenche pas une transition. Tenue sans température ne propose pas un vêtement calculé. Le shell offline fonctionne sans rendre les prévisions nouvelles.", "L’exploitation prod-15 utilise Actions, version.json, les tags prod-N, les heures affichées et des diagnostics minimisés, sans plateforme APM personnelle. Des compteurs locaux de durée, cache ou route ancienne sont une piste. S’ils quittent l’appareil, le dossier demande un besoin démontré, une minimisation et un consentement explicite ; ce n’est pas une télémétrie déjà active."]},
      {title: "Ce qui était encore roadmap au prod-15", body: ["Le plan Tenue multi-lieux de la journée, la météo longue distance plus dense, les alertes trafic de corridor et l’IA Race Engineer étaient non livrés dans la référence prod-15. Le renforcement de la reprise iOS, la CSP stricte, les actions pinées par SHA et le découpage d’app.js étaient des chantiers prévus. Une évolution ultérieure exige d’autres preuves ; les PDF n’en certifient pas la livraison.", "Pour prioriser, pose quatre questions : quelle décision utilisateur change, quelle donnée nouvelle est nécessaire, quel coût de confidentialité ou performance apparaît et quel test prouve le comportement et son repli ? Une extraction est acceptée si elle conserve les comportements prouvés. La checklist de maintenance ajoute commentaires à jour, cache offline vérifié, batterie recontrôlée après polling/GPS et tests terrain après une grosse évolution iOS."]}
    ],
    pitfalls: ["Réécrire tout app.js et perdre des comportements jusque-là éprouvés.", "Afficher une fonction prévue comme déjà livrée.", "Ajouter un fournisseur ou une télémétrie avant d’avoir un besoin démontré."],
    interview: {question: "Pourquoi un refactor progressif plutôt qu’une réécriture totale ?", answer: "Une extraction à la fois permet de comparer les comportements et garder les tests comme filet. Une réécriture change trop de choses ensemble, rend la cause des régressions moins claire et peut perdre des cas historiques non documentés."},
    exercise: {prompt: "Tu veux extraire le GPS et ajouter des alertes trafic. Propose deux lots vérifiables sans mélanger leurs risques.", answer: "Lot refactor : extraire l’automate derrière ses interfaces, conserver les scénarios marche/voiture/arrivée/stale et un contre-test. Lot trafic séparé : définir une décision sur le corridor, choisir une source et ses données minimales, prévoir timeout/fallback et tests de pertinence. Au prod-15 les alertes trafic restent roadmap ; les marquer livrées attend une preuve de version."},
    sources: [{id: "course-prod15", pages: "31–32, 38–39"}, {id: "dossier-prod15", pages: "21–25, 27, 30–31"}]
  },
  {
    id: "rc-31", chapter: 31, section: "portfolio", title: "Présenter le projet en entretien",
    summary: "Construire un pitch honnête et raconter un bug, ses preuves et son compromis.",
    tags: ["portfolio", "entretien", "pitch", "assistance IA", "preuves"], related: ["race-arch", "race-privacy", "race-tests", "race-cicd"],
    goals: ["Présenter l’utilité et l’architecture en moins d’une minute.", "Soutenir une affirmation avec une version et un scénario précis."],
    sections: [
      {title: "Un pitch à personnaliser", body: ["Exemple de pitch pédagogique : “Race Control est une PWA personnelle qui croise météo, chaussée estimée, pneus, agenda, routage et GPS pour aider à préparer un déplacement. Le front statique est servi par GitHub Pages et un relais GitHub Actions prépare observations, agenda chiffré et notifications. Le projet utilise des tests Chromium/WebKit, des clés séparées et un déploiement versionné avec retour contrôlé.”", "Ajoute ton rôle réel : conception, priorités produit, revue, reproduction des bugs, tests ou implementation selon ce que tu as effectivement fait. Les documents décrivent un développement assisté par IA ; expliquer comment ses propositions ont été vérifiées est plus solide que prétendre son absence. Ce texte est un modèle d’exercice, pas un CV généré avec des expériences inventées."]},
      {title: "Trois histoires techniques étayées", body: ["Départ GPS : l’horloge conseillait, mais ne devait pas prouver un mouvement. Raconte la référence qui suivait la voiture, le test de départ anticipé, sa correction et les négatifs marche/jitter. Destination Waze : l’arrondi cloud suffisait pour le routage météo mais dégradait le retour exact ; le clic local utilise une précision adaptée au besoin.", "Incident CI : un navigateur de test cohabitait avec une clé réelle. La remédiation a séparé données fictives et jobs de confiance, avec refus d’accès hors branche autorisée. Pour chaque histoire, lie symptôme → cause → test → correction → compromis → preuve. Aucun titre, adresse ou capture d’agenda réel n’est nécessaire pour la raconter."]},
      {title: "Dire aussi la limite", body: ["La température de chaussée est une estimation heuristique et le score pneus une aide à la décision, pas une mesure d’adhérence. La PWA fermée ne suit pas continuellement le GPS sur iOS. WebKit CI complète les essais du téléphone physique. Des tests verts ne prouvent pas une absence totale de bugs.", "Les affirmations de version doivent rester datées : le cours décrit prod-15 et sépare les fonctions prévues. Un projet personnel riche ne devient pas automatiquement plusieurs années d’expérience professionnelle. Mieux vaut savoir lire une condition, suivre un flux et défendre une preuve que réciter des marques de technologies."]}
    ],
    pitfalls: ["Présenter une estimation de chaussée comme une mesure au sol.", "Transformer le projet personnel en expérience professionnelle inventée.", "Masquer l’assistance IA au lieu d’expliquer ses contrôles."],
    interview: {question: "Quel est le meilleur signe de maîtrise : citer des technologies ou expliquer un bug corrigé ?", answer: "Expliquer un bug, sa cause, sa reproduction, le test rouge puis vert et le compromis donne une preuve de compréhension. Les technologies seules ne montrent pas comment tu as pris les décisions ou vérifié le résultat."},
    exercise: {prompt: "Enregistre un pitch de 45 secondes puis une histoire de 90 secondes. Retire toute affirmation que tu ne peux pas prouver.", answer: "Le pitch doit couvrir besoin utilisateur, trois couches principales et une limite. L’histoire doit contenir symptôme, cause, test, correction et preuve de version. Signale ton rôle réel et l’assistance IA. Remplace “aucun bug” par les scénarios testés et “mesure de route” par estimation."},
    sources: [{id: "course-prod15", pages: "32–33"}, {id: "dossier-prod15", pages: "28"}]
  },
  {
    id: "rc-32", chapter: 32, section: "portfolio", title: "Exercices de révision, réponses et glossaire",
    summary: "Vérifier ta compréhension du flux complet avec douze questions, six checkpoints et le vocabulaire des supports.",
    tags: ["révision", "glossaire", "checkpoints", "commandes", "fonctions"], related: ["race-arch", "race-privacy", "race-tests", "race-cicd"],
    goals: ["Répondre sans réciter puis comparer avec le corrigé.", "Retrouver une responsabilité et un mot technique dans le projet."],
    sections: [
      {title: "Six checkpoints de compréhension", body: ["1. Je lis le projet : distinguer HTML/CSS/JS, retrouver engine/app/relay et reconnaître objet et fonction. 2. Je comprends les données : API, JSON, heure météo, cache, localStorage et âge de donnée. 3. Je comprends le moteur : Tr estimée, risque de verglas, pénalités pneus et pire segment.", "4. Je comprends le trajet : calendrier → route → météo → GPS → transitions, sans assimiler horloge et mouvement. 5. Je comprends DevSecOps : branche, PR, SHA, CI, secrets, Environment, version prod-N et rollback. 6. Je peux défendre le projet : raconter reproduction, test, cause, correction, compromis et validation. Un statut “Acquis” est ton appréciation locale, pas une certification automatique."]},
      {title: "Retrouver la fonction responsable", body: ["La carte des fonctions des annexes relie buildHours/makeModel/summarize au modèle météo ; estRoad à la chaussée ; iceRisk au verglas ; tireAssess/windowAssess/hourVerdict aux pneus ; seasonAnalysis à la saison ; legSeq/legCritical aux points de route. Lire le nom ne suffit pas : identifie aussi ses entrées et la portée de sa sortie.", "Pour le trajet vivant, startWatch/onPos acquièrent les fixes, liveFresh/liveSpeed/liveOnFix évaluent leurs qualités et transitions, puis liveRoute/liveTrip/liveApply coordonnent route et météo. loadCalendar/calModel/calTrip concernent l’agenda local ; parseIcs/expand/routeLeg/planLegs/calendarSync le relais ; wardrobeWindow/sartorialAdvice les règles de tenue et renderTenue leur affichage. Les noms décrivent la référence prod-15."]},
      {title: "Les commandes sont des preuves situées", body: ["npm ci installe le lockfile, tools/build.js construit Race Control, et les deux commandes run-ci testent ses navigateurs. Elles appartiennent au dépôt Race Control du support. Dans Reconversion Control, npm test et npm run test:learning exécutent d’autres scripts : ne pas copier une commande sans vérifier le projet et sa branche.", "Avant d’affirmer une livraison, retrouve le SHA, les jobs terminés, le diff et la version servie après publication autorisée. Ces questions et ce glossaire adaptent les annexes lisibles. La sauvegarde chiffrée n’a pas été ouverte et les ouvrages Linux/pentest/IA seulement mentionnés par l’ancienne bibliothèque ne sont pas couverts par ces pièces."], code: "# Repères du cours Race Control historique\nnpm ci\nnode tools/build.js\nnode tests/run-ci.js\nBROWSER=webkit node tests/run-ci.js\n# Gestes : diff de PR → SHA → checks → autorisation → version publiée."}
    ],
    quiz: [
      {question: "Qu’est-ce qu’une PWA ?", answer: "Une application web avec manifest et capacités de service worker, installable sur les plateformes compatibles. Son cache aide hors ligne ; il ne crée pas de météo fraîche."},
      {question: "Pourquoi séparer engine.js et app.js ?", answer: "Pour isoler les calculs métier de l’interface et les tester ou réutiliser dans le relais. Même moteur ne signifie même verdict que si les entrées sont aussi les mêmes."},
      {question: "Pourquoi estimer la chaussée ?", answer: "Les fournisseurs donnent surtout l’air. Le moteur construit une approximation avec inertie, soleil, vent, humidité, pluie et neige, qu’il faut présenter comme estimée."},
      {question: "Pourquoi demander deux relevés GPS ?", answer: "Pour éviter qu’un saut ponctuel de position ou une mesure imprécise ne déclenche à tort certaines transitions de départ ou d’arrivée."},
      {question: "Pourquoi l’heure ne décide-t-elle pas du départ ?", answer: "On peut partir avant ou après le conseil. L’heure sert au planning ; un mouvement automobile significatif démontre le départ."},
      {question: "À quoi sert LIVE.gen ?", answer: "À ignorer une réponse asynchrone appartenant à un état ou trajet déjà remplacé, afin qu’une vieille requête ne rétablisse pas une ancienne route."},
      {question: "Qu’est-ce qu’un rollback contrôlé ?", answer: "Restaurer une version du code identifiée par tag après les contrôles, conserver les données actuelles du relais et vérifier la version servie."},
      {question: "Pourquoi WebKit dans la CI ?", answer: "Pour couvrir de nombreuses différences du moteur utilisé par Safari/iOS. Cela ne remplace pas tous les essais sur un iPhone physique."},
      {question: "Pourquoi deux clés APP_KEY et RC_KEY ?", answer: "Pour distinguer app/agenda et configuration cloud, limiter l’impact d’une fuite et vérifier qu’une clé n’ouvre pas le périmètre de l’autre."},
      {question: "Pourquoi ne pas exécuter la PR avec les vrais secrets ?", answer: "Le code non approuvé pourrait lire et exploiter les secrets. Le scanner trusted doit lire ses fichiers sans lancer ses scripts dans ce contexte."},
      {question: "Pourquoi conserver Waze ?", answer: "Race Control analyse le déplacement, Waze fournit navigation et trafic. Une ouverture volontaire vers la destination évite de reconstruire un guidage complet."},
      {question: "Quelle dette principale identifie prod-15 ?", answer: "La concentration de nombreuses responsabilités dans app.js. Le plan est d’extraire progressivement des modules derrière les tests, pas de tout réécrire."}
    ],
    glossary: [
      {term: "API", definition: "Interface par laquelle des logiciels échangent des données ou des actions."},
      {term: "Async / await", definition: "Syntaxe JavaScript pour organiser des opérations asynchrones ; await ne bloque pas tout le navigateur."},
      {term: "Artefact", definition: "Résultat d’un build : fichier HTML, bundle, image ou archive."},
      {term: "Cache", definition: "Copie temporaire utilisée pour accélérer l’accès ou fournir un repli daté."},
      {term: "CI", definition: "Intégration continue : tests et contrôles automatiques associés aux changements."},
      {term: "CD", definition: "Livraison ou déploiement organisé après validation, selon le pipeline."},
      {term: "Commit", definition: "Instantané versionné du projet relié à ses parents."},
      {term: "Concurrency", definition: "Règles qui organisent les exécutions simultanées d’un workflow."},
      {term: "Déterministe", definition: "Avec les mêmes entrées, le calcul produit la même sortie."},
      {term: "DevOps", definition: "Pratiques reliant développement, automatisation et exploitation."},
      {term: "DevSecOps", definition: "Intégration de la sécurité et de ses contrôles dans ce cycle."},
      {term: "E2E", definition: "Test de bout en bout d’un parcours complet de l’application."},
      {term: "Environment GitHub", definition: "Contexte contenant des secrets et des règles d’accès selon les branches ou validations."},
      {term: "Fallback", definition: "Comportement de repli quand la solution principale échoue."},
      {term: "Git", definition: "Système distribué de gestion de versions."},
      {term: "GitHub Actions", definition: "Service qui exécute workflows et jobs automatisés."},
      {term: "Hash / SHA", definition: "Empreinte utilisée pour identifier un contenu ou un objet Git."},
      {term: "JSON", definition: "Format texte structuré avec objets, tableaux et valeurs."},
      {term: "LocalStorage", definition: "Stockage clé/valeur persistant lié à l’origine web et au contexte du navigateur."},
      {term: "Machine à états", definition: "Modèle qui définit états autorisés et conditions de transition."},
      {term: "PBKDF2", definition: "Fonction de dérivation de clé depuis un secret, un sel et un nombre d’itérations."},
      {term: "PR / Pull Request", definition: "Proposition de fusion avec diff, revue et contrôles."},
      {term: "PWA", definition: "Application web utilisant notamment manifest et service worker pour des capacités d’installation et de cache."},
      {term: "Race condition", definition: "Erreur dont le résultat dépend de l’ordre non maîtrisé d’opérations concurrentes."},
      {term: "Rollback", definition: "Retour contrôlé du code vers une version antérieure identifiée."},
      {term: "Service worker", definition: "Script séparé qui peut intercepter des requêtes dans sa portée et gérer le cache."},
      {term: "SRI", definition: "Empreinte vérifiée par le navigateur pour contrôler l’intégrité d’une ressource externe."},
      {term: "Stale data", definition: "Donnée trop ancienne pour être présentée comme actuelle."},
      {term: "Timeout", definition: "Durée limite au-delà de laquelle une opération est abandonnée ou refusée."},
      {term: "XSS", definition: "Injection de script qui s’exécute dans le contexte d’une page web."},
      {term: "Frontend", definition: "Partie exécutée dans le navigateur et visible par l’utilisateur."},
      {term: "Backend / worker", definition: "Programme exécuté côté serveur ou cloud, comme le relais."},
      {term: "Workflow", definition: "Description YAML de l’automatisation, de ses événements et de ses jobs."},
      {term: "Job", definition: "Unité d’exécution d’un workflow."},
      {term: "Runner", definition: "Machine sur laquelle un job s’exécute."},
      {term: "Secret", definition: "Valeur sensible injectée uniquement au code autorisé, jamais publiée en clair."},
      {term: "Trust boundary", definition: "Frontière entre contextes de confiance différents, par exemple PR proposée et code de main approuvé."},
      {term: "AES-GCM", definition: "Mode de chiffrement authentifié protégeant confidentialité et intégrité du contenu."},
      {term: "Idempotence", definition: "Propriété d’une opération dont la répétition conserve le même résultat prévu."},
      {term: "CSP", definition: "Politique navigateur limitant notamment scripts, ressources et connexions autorisés."},
      {term: "Fixture", definition: "Donnée fictive et stable utilisée pour rendre un test reproductible."},
      {term: "Observabilité", definition: "Capacité à comprendre l’état du système grâce à ses signaux, logs, métriques ou traces."}
    ],
    pitfalls: ["Passer en Acquis après avoir seulement lu le corrigé.", "Appliquer les commandes de Race Control dans un autre dépôt sans adaptation.", "Confondre les preuves historiques du cours et la CI actuelle d’une PR."],
    interview: {question: "Comment montrer que tu comprends le système plutôt que les noms des technologies ?", answer: "Suis une donnée du calendrier au risque, nomme la fonction responsable, explique une limite et retrouve le test et la version correspondants. Les six checkpoints et les questions te servent d’auto-évaluation."},
    exercise: {prompt: "Réponds aux douze questions sans ouvrir les corrigés. Pour deux réponses faibles, retrouve le chapitre et explique un exemple à voix haute.", answer: "Vérifie chaque réponse avec le corrigé, puis reviens aux chapitres 9, 18, 19, 23, 25–28 ou 30 selon la lacune. Passe le chapitre en En cours si tu hésites encore ; en Acquis, il entre dans les révisions espacées locales. Conserve une preuve et une limite pour chaque affirmation."},
    sources: [{id: "course-prod15", pages: "33–39"}, {id: "dossier-prod15", pages: "29–31"}]
  }
];

// Cas récents originaux ; le socle historique et ses identifiants sont conservés.
RC_COURSE_OPERATIONS.push.apply(RC_COURSE_OPERATIONS, [
  {
    "id": "rc-33",
    "chapter": 33,
    "section": "fundamentals",
    "title": "UX mobile · détails sans surcharge",
    "summary": "Le cas prod93 : verdict, décision et action avant les détails, avec des formulaires stables sur iPhone.",
    "tags": [
      "prod93",
      "UX",
      "WebKit",
      "focus"
    ],
    "goals": [
      "Séparer information essentielle, contexte utile et détail expert.",
      "Préserver une saisie et le focus pendant une actualisation.",
      "Distinguer contrôle automatique, capture et essai sur appareil réel."
    ],
    "sections": [
      {
        "title": "Une lecture en trois niveaux",
        "body": [
          "L’interface prod93 conserve Pneus, Météo, Garage, Analyse et Trajet, leurs couleurs F1 et les mêmes moteurs. Le premier niveau donne l’information principale et l’action utile. Les mesures, chronologies et calculs passent dans des détails dépliables : simplifier la présentation ne retire pas une fonction métier.",
          "Un danger utile à la décision doit rester visible. Une pression basse ne devient pas un diagnostic caché pour gagner de la place. Sur Garage, on affiche le compteur réellement enregistré ; l’absence de kilométrage reste une absence, sans échéance fabriquée."
        ]
      },
      {
        "title": "Le rendu fait partie du comportement",
        "body": [
          "Une actualisation peut détruire puis recréer un bouton ou un champ. Le dessin paraît identique, mais un appui en cours, le curseur, un brouillon ou un menu disparaissent. Conserver les nœuds inchangés et restaurer les détails ouverts réduit cette régression.",
          "Sur mobile, les commandes font au moins 44 px et les champs 16 px dans ce projet. Ce sont des choix ergonomiques testés ici, pas une preuve globale de conformité accessibilité. On contrôle les petites largeurs, les textes longs, les détails ouverts et la navigation au clavier."
        ],
        "code": "avant : focus + valeur + section ouverte\nactualisation : ne remplacer que le contenu qui change\naprès : même commande accessible, même brouillon"
      },
      {
        "title": "Ce que les preuves disent vraiment",
        "body": [
          "La PR #118 a validé 146 exécutions : 46 unitaires, 52 Chromium, 48 WebKit, avec trois shards par navigateur. Les rendus 414 × 896, 375 et 320 px et PC complètent les tests de navigation, persistance et hors ligne.",
          "Les captures ont été examinées. WebKit simulé n’est pas un iPhone physique, et la compréhension en trois secondes n’a pas été mesurée auprès d’utilisateurs. Une présentation professionnelle cite cette limite au lieu de transformer un objectif en résultat."
        ]
      }
    ],
    "pitfalls": [
      "Cacher une alerte critique dans une section expert.",
      "Confondre une carte moins haute et une interface mieux comprise.",
      "Annoncer une validation iPhone réelle à partir d’une simulation."
    ],
    "interview": {
      "question": "Comment prouver qu’une simplification mobile conserve les fonctionnalités ?",
      "answer": "Je conserve les mêmes sources et moteurs, puis je teste les mêmes actions avec les détails fermés et ouverts. Je vérifie focus, brouillon, persistance, import et hors ligne sur Chromium et WebKit. Enfin j’examine les captures, et je distingue ces simulations d’un essai sur l’appareil réel."
    },
    "exercise": {
      "prompt": "Décris un formulaire qui reçoit une actualisation météo pendant la saisie. Liste quatre critères de réussite et une limite de tes tests.",
      "answer": "La valeur et le curseur restent cohérents, le focus reste dans le champ, les détails ouverts restent ouverts et aucun débordement horizontal n’apparaît. L’action utile reste atteignable au doigt. Un clavier iOS réel ou un retour depuis Waze reste à vérifier sur appareil physique."
    },
    "sources": [
      {
        "id": "public-ux93",
        "location": "Code, décisions et limites du cas"
      }
    ],
    "related": [
      "web-stack",
      "race-tests",
      "race-arch"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles."
  },
  {
    "id": "rc-34",
    "chapter": 34,
    "section": "portfolio",
    "title": "Garage & F1 · source unique",
    "summary": "Présenter les fonctions réellement livrées sans inventer des mesures, un trajet alternatif ou de la télémétrie.",
    "tags": [
      "Garage",
      "F1",
      "opt-in",
      "source de vérité"
    ],
    "goals": [
      "Nommer les six extensions et leur rôle.",
      "Différencier option de présentation et moteur de décision.",
      "Présenter honnêtement un compteur ou un historique manquant."
    ],
    "sections": [
      {
        "title": "Les six extensions réellement livrées",
        "body": [
          "Race Engineer propose un briefing tiré du verdict et de la confiance existants. Track Conditions présente des secteurs issus des points météo déjà calculés. Tyre Management reprend monte, profondeur déclarée, pression cible et compteur existant.",
          "Strategy A/B compare deux évaluations pneumatiques sur le même parcours. The Garage présente les fiches et relevés déjà renseignés. Telemetry Replay confronte le débrief existant à la prévision : il ne crée ni télémétrie automobile, ni ancien parcours GPS, ni capteur."
        ]
      },
      {
        "title": "Opt-in et cohérence",
        "body": [
          "Les six options ont été livrées individuellement désactivées par défaut. Leurs réglages utilisent les paramètres personnels chiffrés existants. La refonte mobile les conserve ; elle ne force pas leur activation ni un nouveau stockage.",
          "Le module lit un résultat issu du moteur existant. S’il recalculait un second verdict avec des règles différentes, l’utilisateur pourrait recevoir deux recommandations concurrentes. La présentation doit expliquer le verdict, sa source et sa limite."
        ],
        "code": "mesures / réglages existants → moteur unique → verdict\n                                              ↘ modules F1"
      },
      {
        "title": "Garage et maintenance",
        "body": [
          "L’onglet Garage remplace l’ancien onglet Tenue et met le véhicule actif au premier plan. Les deux véhicules et leurs historiques sont conservés. Un kilométrage enregistré n’est pas un kilométrage live : on le libelle selon sa provenance.",
          "Une intervention utile peut être suggérée à partir d’un contrôle existant, mais sans inventer une date ou un compteur. Pour le portfolio, une capture utilise un profil fictif et décrit ce qui est disponible, estimé ou absent."
        ]
      },
      {
        "title": "Complément du 21/10/2026 · un Garage, plusieurs vues",
        "body": [
          "Twin Garage et LIVE ROUTE réutilisent le même contexte de trajet et les fiches existantes. Dans le code publié étudié, la carte n’est pas un second Garage : elle affiche la géométrie routière déjà disponible. Une ligne droite de secours ne devient pas un itinéraire réel.",
          "La simulation avant départ anime le parcours à allure uniforme. Pendant un trajet actif, la vue utilise uniquement le fix GPS accepté par le système. Elle ne déduit jamais le déplacement réel de l’heure prévue. Un cockpit animé démontre une représentation ; il ne démontre ni télémétrie automobile ni navigation avec trafic."
        ]
      }
    ],
    "pitfalls": [
      "Présenter Strategy A/B comme deux itinéraires optimisés.",
      "Dire que Telemetry Replay collecte des capteurs du véhicule.",
      "Créer une seconde copie du kilométrage pour une nouvelle carte."
    ],
    "interview": {
      "question": "Quelle différence fais-tu entre un module F1 et une nouvelle source de données ?",
      "answer": "Le module est une vue sur les résultats et réglages existants. Il apporte une lecture plus pratique sans fabriquer une mesure ou concurrencer le moteur de décision. Je peux expliquer chaque source, signaler les données absentes et vérifier que désactiver l’option ne modifie pas les données métier."
    },
    "exercise": {
      "prompt": "Un véhicule n’a aucun relevé de compteur. Écris le texte de la carte Garage et celui d’une comparaison Strategy A/B.\n\nVariante du 21/10 : la voiture avance sur une carte avant tout départ. Quelle preuve manque pour parler de déplacement réel ?",
      "answer": "Garage : « Kilométrage non renseigné » avec une action pour ouvrir la fiche du véhicule. Strategy A/B : « Comparaison de deux montes sur le même trajet » ; aucun gain de temps ou itinéraire alternatif n’est annoncé sans donnée correspondante.\n\nIl manque un trajet actif et une position GPS valide associée à ce trajet. Le mouvement avant départ doit porter le libellé simulation ; la durée et les distances affichées restent des estimations."
    },
    "sources": [
      {
        "id": "public-f1",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-ux93",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-live-route-20261021",
        "location": "Complément sourcé du 21/10/2026 ; instantané distinct des archives"
      }
    ],
    "related": [
      "race-arch",
      "race-privacy"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles. Complément vérifié le 21/10/2026, avec références figées distinctes ; les exemples précédents restent des instantanés historiques."
  },
  {
    "id": "rc-35",
    "chapter": 35,
    "section": "fundamentals",
    "title": "Données · mesure ou estimation",
    "summary": "Les corrections météo et pneus récentes montrent pourquoi la provenance compte autant que la valeur affichée.",
    "tags": [
      "provenance",
      "estimation",
      "confiance",
      "GPS"
    ],
    "goals": [
      "Distinguer mesure, prévision et estimation.",
      "Relier la fraîcheur au bon relevé ou essieu.",
      "Signaler une donnée absente sans donner un faux verdict rassurant."
    ],
    "sections": [
      {
        "title": "Une valeur doit conserver son origine",
        "body": [
          "Une profondeur saisie est une mesure déclarée. Une usure projetée est un calcul. Une durée de trajet issue d’un fournisseur est une estimation. Ces valeurs peuvent toutes être utiles, mais elles ne justifient pas le même niveau de confiance.",
          "Une date récente sur un essieu ne rend pas l’autre essieu récemment mesuré. Les corrections pneus conservent la provenance de chaque relevé et des projections cohérentes. Le libellé permet de savoir quelle mesure soutient la recommandation."
        ]
      },
      {
        "title": "Une source météo n’est pas une position de passage",
        "body": [
          "La PR #117 clarifie la projection d’Analyse : progression estimée, sans mesure GPS, kilomètres précédés de ≈. Les noms de lieux identifient les sources météo. Ils ne prouvent pas qu’un véhicule est passé à ces coordonnées.",
          "Une vigilance générale et une météo locale ne couvrent pas automatiquement le prochain trajet. L’absence de météo de parcours doit rester explicite. La règle métier et la présentation ne doivent pas transformer « inconnu » en « aucun risque »."
        ],
        "code": "mesuré : relevé déclaré + date + véhicule / essieu\nestimé : méthode + hypothèses + ≈\nindisponible : raison + action possible, sans valeur inventée"
      },
      {
        "title": "La confiance se dégrade proprement",
        "body": [
          "Une prévision vieillissante, un GPS peu précis ou un trajet sans observations demandent un état dégradé compréhensible. La recommandation conserve son contexte plutôt que de masquer le problème avec un zéro.",
          "Pour tester, utiliser des jeux fictifs : relevé avant récent et arrière ancien, météo absente, progression sans GPS. Vérifier les mots affichés, pas seulement que la page se charge. Une capture doit aussi montrer la distinction."
        ]
      },
      {
        "title": "Complément du 21/10/2026 · quatre états pour LIVE ROUTE",
        "body": [
          "Le même panneau distingue simulation, GPS actif, position périmée et position indisponible. Dans cet instantané, LIVE ROUTE exige notamment une précision annoncée d’au plus 60 m et un relevé âgé d’au plus 15 s. Ce sont les seuils de cette application, pas une garantie de précision fournie par tous les téléphones.",
          "MDN distingue les coordonnées de la date de leur acquisition. Recevoir une position maintenant ne suffit donc pas à prouver qu’elle vient d’être mesurée. Quand la source n’est plus valide, la voiture reste figée et les métriques courantes sont retirées ; le temps écoulé ne permet pas de reconstruire la position.",
          "Route Radar conserve les coordonnées et la provenance des prévisions ponctuelles. Leur projection sur la route sert à estimer une distance, jamais à inventer une observation continue. Une prévision ancienne, un point trop éloigné du tracé ou une absence d’événement routier ne deviennent pas une preuve de trajet sans risque."
        ],
        "code": "simulation → animation annoncée\nGPS accepté + trajet actif → position utilisable\nGPS périmé → marqueur figé, métriques retirées\nGPS absent → indisponible, aucune position inventée"
      }
    ],
    "pitfalls": [
      "Appeler une projection « mesure GPS ».",
      "Afficher 0 pour une mesure absente.",
      "Étendre la date d’un relevé à tous les essieux."
    ],
    "interview": {
      "question": "Pourquoi afficher ≈ peut-il être une correction de sécurité fonctionnelle ?",
      "answer": "Parce que le libellé évite qu’un utilisateur traite une estimation comme une observation réelle. Je relie la valeur à sa méthode et à sa fraîcheur ; si la source manque, je garde l’état inconnu. Cela rend la décision explicable sans changer arbitrairement le moteur."
    },
    "exercise": {
      "prompt": "Réécris trois libellés : « parcouru 12 km » sans GPS, « pneus mesurés aujourd’hui » avec un seul essieu relevé, « trajet sans pluie » avec une prévision absente.\n\nVariante du 21/10 : le dernier relevé a 20 secondes, la carte s’anime encore et une station météo prévoit de la pluie. Quels libellés et comportements sont justifiés ?",
      "answer": "« Progression estimée ≈ 12 km, sans mesure GPS » ; « Essieu avant : relevé déclaré aujourd’hui ; arrière : dernier relevé ancien » ; « Météo du trajet indisponible ». Les trois formulations conservent la provenance et ne créent aucune observation.\n\nPour la politique LIVE ROUTE étudiée, le relevé dépasse 15 s : le marqueur est figé et les métriques GPS courantes sont retirées. La pluie reste une prévision ponctuelle sourcée, sans affirmer une observation sur tout le parcours ni transformer l’animation en mouvement réel."
    },
    "sources": [
      {
        "id": "public-provenance",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-ux93",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-live-route-20261021",
        "location": "Complément sourcé du 21/10/2026 ; instantané distinct des archives"
      },
      {
        "id": "public-geolocation-20261021",
        "location": "Complément sourcé du 21/10/2026 ; instantané distinct des archives"
      }
    ],
    "related": [
      "formats",
      "race-tests"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles. Complément vérifié le 21/10/2026, avec références figées distinctes ; les exemples précédents restent des instantanés historiques."
  },
  {
    "id": "rc-36",
    "chapter": 36,
    "section": "devsecops",
    "title": "Agenda · départs personnalisés",
    "summary": "Le choix d’origine d’un rendez-vous s’applique au trajet existant, avec recalcul cohérent et reprise hors ligne.",
    "tags": [
      "agenda",
      "occurrence",
      "hors ligne",
      "état"
    ],
    "goals": [
      "Identifier une préférence liée à une occurrence et un sens.",
      "Garder calendrier, route et météo cohérents.",
      "Décrire un test de reprise après déconnexion."
    ],
    "sections": [
      {
        "title": "Le bon périmètre de préférence",
        "body": [
          "Le bloc Prochain trajet permet de choisir domicile, lieu enregistré, adresse ou GPS ponctuel pour l’occurrence et le sens affichés. Le lieu météo général et le rendez-vous Google Agenda ne sont pas réécrits.",
          "Le choix utilise les réglages chiffrés existants, puis le calcul de trajet central applique tags, chaînes, annulations et retours automatiques. L’interface ne fabrique pas une copie parallèle du calendrier pour afficher une autre origine."
        ]
      },
      {
        "title": "Une transition cohérente",
        "body": [
          "Le choix d’origine entraîne un recalcul cohérent de la route et de la météo. Hors ligne, l’interface annonce l’attente. Il vaut mieux un état d’attente explicite que juxtaposer la nouvelle adresse et la météo calculée pour l’ancienne.",
          "Les commandes actives et le brouillon doivent survivre aux actualisations. Le test vérifie l’occurrence, le sens, la persistance du choix, les confirmations d’annulation et l’absence de modification des autres rendez-vous."
        ],
        "code": "choix origine → réglage de l’occurrence → calcul central\nhors ligne → attente explicite → reconnexion → recalcul"
      },
      {
        "title": "Le cache négatif peut devenir un bug",
        "body": [
          "Une erreur météo obtenue pendant une déconnexion pouvait rester en cache négatif et empêcher une reprise immédiate. Le correctif n’interroge plus la météo de parcours hors ligne et invalide les erreurs de trajet à la reconnexion, sans jeter les modèles valides.",
          "Ce cas montre qu’un test de réseau doit couvrir le retour du réseau. La vérification doit aussi attendre l’écriture effective du coffre avant de recharger, sinon elle mesure une course du test plutôt que la persistance réelle."
        ]
      },
      {
        "title": "Complément du 21/10/2026 · refuser une origine GPS brute",
        "body": [
          "La PR #196 corrige le choix « Ma position » dans Trajet. Le formulaire interroge appCurrentGps(), la source canonique validée, au lieu de reprendre une coordonnée navigateur brute ou une ancienne origine mémorisée. Si cette source manque, programmer le départ est refusé avec une explication.",
          "Le contrôle ne supprime pas les trajets déjà programmés. Il empêche une nouvelle programmation avec une origine qui n’a plus de validité. Le contre-test utilise un GPS brut ancien ou imprécis et aucun fix canonique : aucun trajet ne doit être créé. Un cas positif avec un fix accepté vérifie que le garde-fou ne bloque pas tous les utilisateurs."
        ]
      }
    ],
    "pitfalls": [
      "Changer le lieu global de météo quand on modifie un seul départ.",
      "Dupliquer les règles d’annulation dans la carte.",
      "Tester seulement la déconnexion, jamais la reconnexion."
    ],
    "interview": {
      "question": "Comment éviter une seconde source de vérité quand une carte permet de modifier un trajet ?",
      "answer": "Je stocke la préférence dans le document existant et je laisse le calcul central produire le trajet effectif. La carte lit ce résultat. Je teste l’occurrence, le sens, les annulations, le coffre et la reprise réseau ; je ne recalcule pas des règles parallèles dans le rendu."
    },
    "exercise": {
      "prompt": "Propose un scénario de test pour un départ personnalisé choisi hors ligne, puis suivi d’un retour réseau.\n\nVariante du 21/10 : une coordonnée brute existe mais appCurrentGps() ne fournit aucun fix valide. Peut-on programmer « Ma position » ? Que conserve-t-on ?",
      "answer": "Choisir une origine fictive sur une seule occurrence, couper réellement les requêtes, vérifier l’attente et les autres rendez-vous inchangés. Reconnecter, vérifier route et météo cohérentes, attendre l’écriture du coffre puis recharger. L’origine persiste et une ancienne erreur météo ne bloque pas le recalcul.\n\nRefuser cette nouvelle programmation et proposer un autre départ ou l’attente d’un fix fiable. Ne pas utiliser l’ancienne coordonnée en secours silencieux. Les trajets déjà enregistrés sont conservés ; le test négatif vérifie aussi qu’aucun nouveau trajet n’a été ajouté."
    },
    "sources": [
      {
        "id": "public-calendar",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-ux93",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-gps-gate-20261021",
        "location": "Complément sourcé du 21/10/2026 ; instantané distinct des archives"
      }
    ],
    "related": [
      "cicd",
      "race-tests"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles. Complément vérifié le 21/10/2026, avec références figées distinctes ; les exemples précédents restent des instantanés historiques."
  },
  {
    "id": "rc-37",
    "chapter": 37,
    "section": "security",
    "title": "Coffre · chiffrement & session",
    "summary": "AES-256-GCM et PBKDF2 protègent les données au repos ; la session et l’origine Web restent des frontières importantes.",
    "tags": [
      "AES-GCM",
      "PBKDF2",
      "sessionStorage",
      "audit"
    ],
    "goals": [
      "Expliquer sel, IV, dérivation et intégrité.",
      "Comprendre une migration vérifiée avant suppression du clair.",
      "Distinguer chiffrement au repos et protection d’une session ouverte."
    ],
    "sections": [
      {
        "title": "Du code d’accès à une clé",
        "body": [
          "Cette protection au repos exige le mode chiffré ; le mode sans code peut conserver des données en clair. Le coffre local Race Control prod93 utilise AES-256-GCM et PBKDF2-HMAC-SHA-256 à 600 000 itérations, avec sel de 16 octets et nouvel IV de 12 octets à chaque écriture. Le sel ne remplace pas une phrase secrète longue ; la dérivation augmente le coût des essais.",
          "Un fichier chiffré public peut être copié puis soumis à des essais hors ligne. Une limite d’essais affichée dans une interface ne bloque pas ces essais. La difficulté de deviner la phrase reste essentielle, et un hash d’intégrité ne constitue pas à lui seul un chiffrement."
        ]
      },
      {
        "title": "Ne jamais perdre le dernier état valide",
        "body": [
          "La migration conserve le document en clair jusqu’au chiffrement, à la relecture et à la comparaison réussis. Une mauvaise phrase, un refus de stockage ou un import invalide ne doit pas détruire les données. La concurrence entre onglets et les anciennes écritures font partie des tests.",
          "Un test pertinent compare l’état avant et après une opération refusée. Pour le portfolio, utiliser une sauvegarde synthétique et une phrase de test, jamais le coffre réel, un calendrier ou des coordonnées privées."
        ],
        "code": "lire → chiffrer → écrire → relire → déchiffrer → comparer\n                                               ↓\n                         supprimer le clair seulement si vérifié"
      },
      {
        "title": "Ce que le coffre ne garantit pas",
        "body": [
          "Pendant la session déverrouillée, la clé dérivée est conservée dans sessionStorage et les données sont accessibles au code autorisé. Le verrouillage manuel efface la clé et les données en mémoire. Une fermeture d’application peut restaurer une session selon le navigateur ; aucun verrouillage automatique d’inactivité n’a été confirmé dans cette version.",
          "Race Control, Reconversion Control et Control Vault sont sur l’origine ipoower.github.io : changer seulement le chemin ne cloisonne pas localStorage. L’isolation par origine dédiée et les en-têtes HTTP restent des axes de durcissement, pas des protections déjà acquises. Cet audit ciblé ne prouve pas l’absence de toute vulnérabilité."
        ]
      },
      {
        "title": "Fusion sans perte · conserver les ajouts concurrents",
        "body": [
          "Le moteur SyncMerge préparé dans Race Control calcule une fusion sans réseau, écriture ni chiffrement. Les journaux et relevés additifs sont réunis ; les voitures sont reconnues par leur identifiant, pas par leur position dans une liste. Fusionner deux fois les mêmes copies ne doit pas doubler les enregistrements : c’est l’idempotence.",
          "Pour un réglage, une modification distante n’est retenue que si son horodatage permet de la considérer plus récente. À égalité ou sans preuve de fraîcheur, la valeur locale reste et le conflit est signalé. GPS instantané, trajet actif, caches et clés de session restent propres à chaque appareil. Une suppression n’est pas propagée par cette union : un élément distant peut réapparaître.",
          "Une capacité technique ne justifie pas de couper silencieusement l’historique. Si la réunion dépasse la capacité prévue pour les observations météo, le calcul refuse toute la fusion. Un moteur pur correctement testé constitue une préparation ; il ne prouve ni envoi Drive, ni synchronisation branchée, ni restauration métier réussie."
        ],
        "code": "A possède a, b ; B possède b, c → union a, b, c\nrefaire la fusion → toujours a, b, c\nréglage contradictoire sans date fiable → local conservé + conflit\ncapacité dépassée → refus entier, sources intactes"
      }
    ],
    "pitfalls": [
      "Dire « AES-256 donc impossible à compromettre ».",
      "Confondre clé de session et mot de passe stocké.",
      "Déplacer une application vers une autre origine sans sauvegarde et restauration explicites."
    ],
    "interview": {
      "question": "Quelle limite expliquerais-tu à un utilisateur malgré un coffre chiffré solide ?",
      "answer": "Le chiffrement protège les données au repos, mais le code d’une session déverrouillée peut y accéder. Une phrase courte reste devinable hors ligne, et les applications du même hôte partagent l’origine Web. Je distingue ces limites de vulnérabilités effectivement démontrées et je propose un durcissement vérifiable."
    },
    "exercise": {
      "prompt": "Un import échoue après une écriture refusée. Quelles preuves exiges-tu avant de dire que les données sont intactes ?\n\nCas du 22/10 : deux appareils ont des relevés communs et différents, puis donnent deux valeurs contradictoires au même réglage sans date fiable. Décris le résultat et le cas où l’union dépasse une capacité.",
      "answer": "Comparer le document et les réglages avant et après, vérifier le dernier coffre relu et déchiffré, tester une nouvelle ouverture avec la phrase de test et vérifier qu’aucun clair n’a été supprimé prématurément. Une alerte visuelle seule ne prouve pas que l’état persistant est resté valide.\n\nRéunir les relevés sans doublonner les éléments identiques, pour le même identifiant de véhicule. Garder le réglage local et signaler le conflit ; ne pas inventer un gagnant. Si la capacité empêche la conservation intégrale des observations, refuser toute la fusion et garder les deux sources. Ce calcul ne prouve aucune synchronisation réseau."
    },
    "sources": [
      {
        "id": "public-vault",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-kdf",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-origin",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-sync-merge-20261022",
        "location": "Cas vérifié le 22/10/2026 ; portée et limites explicites"
      }
    ],
    "related": [
      "crypto",
      "hardening",
      "race-privacy"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles. Cas de conservation, livraison ou transport revu le 22/10/2026 ; les instantanés antérieurs restent datés."
  },
  {
    "id": "rc-38",
    "chapter": 38,
    "section": "devsecops",
    "title": "CI · secrets et contrôles",
    "summary": "Une CI fiable sépare code non fiable, données fictives et secrets de production, puis valide le bon SHA.",
    "tags": [
      "GitHub Actions",
      "secrets",
      "shards",
      "protection"
    ],
    "goals": [
      "Identifier la frontière de confiance d’une pull request.",
      "Comprendre les shards et l’agrégation des résultats.",
      "Distinguer un contrôle CI d’une protection GitHub native."
    ],
    "sections": [
      {
        "title": "Une PR est une entrée non fiable",
        "body": [
          "Une contribution peut modifier les scripts qu’un runner exécutera. Exécuter ce code avec des secrets de production transforme une revue en accès aux données. Les tests de PR Race Control utilisent des fixtures fictives ; les clés privées restent dans le contexte de production autorisé.",
          "Le scanner de confidentialité exécuté sur pull_request_target utilise le scanner de la branche de confiance et traite les fichiers de PR comme des données. Le seul nom de cet événement n’est pas une garantie : un checkout puis une exécution du code de PR avec des secrets recréerait le risque."
        ]
      },
      {
        "title": "146 exécutions, pas 146 garanties universelles",
        "body": [
          "Pour prod93, la validation compte 46 suites unitaires, 52 exécutions Chromium et 48 WebKit. Trois shards par navigateur distribuent le travail. L’agrégateur vérifie les rapports et ne doit pas compter un shard absent comme un succès.",
          "L’obligation porte sur le SHA final réellement fusionnable. Une CI verte sur l’ancien commit de la branche ne valide pas le nouveau. Les contrôles de confidentialité, de build et de données complètent les tests d’interface."
        ],
        "code": "PR sans secrets → tests sur SHA exact → rapports complets\n                → revue / protections → fusion\nmain autorisée → vérifications réelles → publication"
      },
      {
        "title": "Prévenir et détecter sont différents",
        "body": [
          "Une protection GitHub native peut empêcher une fusion sans contrôles ou une réécriture de branche. Un gate dans un workflow peut bloquer le déploiement après un push direct, mais ne prouve pas que ce push est impossible.",
          "Race Control expose une branche main protégée et un ruleset gh-pages actif au contrôle natif. Reconversion Control possède un gate de provenance après fusion ; son audit de base n’a pas constaté de protection native active. Ne pas copier une affirmation d’un dépôt vers l’autre. Les actions figées par SHA et les permissions minimales réduisent aussi la surface de risque."
        ]
      }
    ],
    "pitfalls": [
      "Exécuter un script de PR avec les secrets de production.",
      "Déclarer tous les shards verts parce qu’un seul job passe.",
      "Présenter le gate de déploiement comme une protection native de main."
    ],
    "interview": {
      "question": "Pourquoi une CI verte ne suffit-elle pas pour affirmer que la livraison est sûre ?",
      "answer": "Je vérifie le commit exact, les rapports complets, la frontière des secrets, la provenance et les protections réelles. Les tests couvrent des scénarios définis, pas toutes les attaques. Après fusion, je contrôle à nouveau la chaîne et la version effectivement servie."
    },
    "exercise": {
      "prompt": "Une PR modifie un script de test et demande une clé privée pour reproduire un bug. Propose un protocole de validation.",
      "answer": "Construire une fixture fictive qui reproduit le comportement sans la clé. Garder le scanner et les secrets dans les contextes de confiance, vérifier tous les shards sur le SHA final puis contrôler la provenance après fusion. Si une vérification réelle reste nécessaire, la réserver à un contexte main autorisé sans exécuter du code de PR non revu."
    },
    "sources": [
      {
        "id": "public-actions",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-ux93",
        "location": "Code, décisions et limites du cas"
      }
    ],
    "related": [
      "cicd",
      "supply",
      "race-cicd"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles."
  },
  {
    "id": "rc-39",
    "chapter": 39,
    "section": "devsecops",
    "title": "Livraison · vérifier la version servie",
    "summary": "La chaîne PR → CI → publication → HTTP doit confirmer la version livrée, y compris quand des pushes échouent.",
    "tags": [
      "SHA",
      "publication",
      "rollback",
      "preuve"
    ],
    "goals": [
      "Relier PR, commit fusionné, build et version servie.",
      "Faire échouer une publication refusée.",
      "Préparer un retour arrière sans réécriture destructive."
    ],
    "sections": [
      {
        "title": "Les identités à relier",
        "body": [
          "Une PR peut être fusionnée par squash : le commit de main diffère alors de son ancien HEAD. On vérifie l’arbre validé, puis la CI du commit fusionné et les métadonnées de production. Une étiquette de version seule ne prouve pas le contenu servi.",
          "Pour le cas prod93 vérifié : commit fusionné 2183d542, build 7d32a7e22525, publication du 11/10/2026. La vérification HTTP du pipeline a comparé le SHA-256 du HTML servi au build. Ces valeurs constituent un instantané daté, pas une promesse sur toutes les versions futures."
        ]
      },
      {
        "title": "Un faux succès reste un bug",
        "body": [
          "La PR #107 a reproduit un défaut de publication : cinq pushes pouvaient être refusés, les rebases réussir, puis le script finir avec code zéro. Le correctif exige un push réussi avant d’annoncer la publication.",
          "Les scénarios couvrent succès immédiat, collisions puis succès, cinquième tentative réussie, cinq refus, rebase refusé, commit refusé et contenu déjà publié. Le comportement est testé avec un Git fictif ; aucune panne équivalente n’a été affirmée sur une production sans preuve."
        ],
        "code": "si aucun push ne réussit : exit 1\nsi aucun fichier ne change : résultat explicite « déjà publié »\nsinon : identifier le commit publié puis vérifier HTTP"
      },
      {
        "title": "Contrôler le bon artefact",
        "body": [
          "Reconversion Control publie après une validation main réussie et injecte le SHA testé dans l’HTML et le service worker. Le cache dérive de ce build. Contrôler le code de main sans inspecter le déploiement laisserait un écart possible entre dépôt et application.",
          "Un retour arrière prend la forme d’un changement explicite et testé vers une version valide. Il préserve les données et les règles de branches. Le journal doit distinguer fusion confirmée, déploiement confirmé et inspection navigateur indisponible."
        ]
      },
      {
        "title": "Complément du 21/10/2026 · une preuve datée, pas une étiquette",
        "body": [
          "L’instantané de publication consulté le 21/10 fournit un cas plus récent : prod-151, SHA source 120b10d04c63f9cb882157150f647befc287f95c, build 41f1fb5747b9, horodatage 2026-10-21T03:39:52.008Z. Le manifeste est cité à une révision Git figée pour pouvoir retrouver ce cas même après une autre livraison.",
          "Ces identifiants ne prouvent pas seuls qu’un navigateur a chargé ce build. Il faut relier le commit fusionné, ses contrôles achevés, le déploiement, le manifeste et le contenu HTTP réellement servi. Un commit plus récent sur main peut encore attendre sa publication. L’ancien exemple prod93 reste une archive ; aucun de ces instantanés ne prétend désigner indéfiniment la dernière version."
        ]
      },
      {
        "title": "Deux cibles de publication, deux conclusions",
        "body": [
          "Le contrôle du 22/10 fournit un contre-exemple concret : le manifeste public Race Control annonce prod-157, source 6340b45efabe2adac885faec9e41f76c37e6b573 et build 50988798eb7c, également retrouvé dans le HTML servi. Le job GitHub Pages du même run réussit. Le job de publication Cloudflare échoue à son étape de vérification des octets servis, du commit et des en-têtes HTTP.",
          "La conclusion correcte est donc bornée à chaque cible : publication GitHub Pages identifiée ; validation de la cible Cloudflare non obtenue dans ce job. Le workflow entier ne doit pas être présenté comme vert. Sans lecture des causes, on n’attribue pas cet échec à une permission ou à une régression du code. Le détail du job et le manifeste sont des références distinctes, datées, qui peuvent être relues."
        ]
      }
    ],
    "pitfalls": [
      "Annoncer « déployé » dès que la PR est fusionnée.",
      "Ignorer le code de sortie après cinq refus réseau.",
      "Effacer l’historique ou les données pour revenir en arrière."
    ],
    "interview": {
      "question": "Quelle preuve apporte le contrôle HTTP après une CI verte ?",
      "answer": "Il ferme l’écart entre l’artefact testé et ce que l’hébergement sert réellement. Je relie le SHA fusionné, le build publié et le contenu reçu, en tenant compte du cache et du service worker. Si l’inspection visuelle manque, je le dis séparément."
    },
    "exercise": {
      "prompt": "Le job de publication est vert, mais version.json indique un ancien build. Que peux-tu annoncer et que dois-tu vérifier ?\n\nVariante du 21/10 : main est plus récent que le SHA du manifeste public. Quelle conclusion peux-tu écrire sans inventer une livraison ?\n\nCas du 22/10 : la version HTTP GitHub Pages correspond au manifeste, mais un autre job de publication échoue. Peux-tu annoncer « tout est livré et vert » ?",
      "answer": "Je peux annoncer que le job a fini, pas que le nouveau build est servi. Je contrôle le commit attendu, l’artefact, la publication et le cache HTTP avec une requête adaptée. Je compare les identités et le contenu ; tant que l’écart subsiste, le déploiement attendu n’est pas confirmé.\n\nLe changement est fusionné mais sa publication n’est pas démontrée par ce manifeste. Conserver séparément les SHA de main, du déploiement et du contenu servi, avec l’heure de lecture. Attendre les preuves manquantes avant de dire livré.\n\nNon. Nommer la cible dont la publication est prouvée, son SHA et son build. Nommer séparément la cible ou le contrôle en échec, sans supposer sa cause. Un manifeste public, un job réussi et le résultat global du workflow prouvent des choses différentes."
    },
    "sources": [
      {
        "id": "public-deploy",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-ux93",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-reconversion",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-release-20261021",
        "location": "Complément sourcé du 21/10/2026 ; instantané distinct des archives"
      },
      {
        "id": "public-release-20261022",
        "location": "Cas vérifié le 22/10/2026 ; portée et limites explicites"
      },
      {
        "id": "public-delivery-targets-20261022",
        "location": "Cas vérifié le 22/10/2026 ; portée et limites explicites"
      }
    ],
    "related": [
      "git",
      "cicd",
      "race-cicd"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles. Complément vérifié le 21/10/2026, avec références figées distinctes ; les exemples précédents restent des instantanés historiques. Cas de conservation, livraison ou transport revu le 22/10/2026 ; les instantanés antérieurs restent datés."
  },
  {
    "id": "rc-40",
    "chapter": 40,
    "section": "security",
    "title": "Diagnostics · protéger les données",
    "summary": "Conserver un diagnostic utile sans publier les coordonnées ni fusionner des événements sur une simple ressemblance.",
    "tags": [
      "logs",
      "privacy",
      "doublons",
      "débrief"
    ],
    "goals": [
      "Minimiser le contenu des diagnostics publics.",
      "Différencier doublon possible et identité démontrée.",
      "Tester reprise, pause et absence de données comparables."
    ],
    "sections": [
      {
        "title": "L’erreur peut révéler plus que la page",
        "body": [
          "Un HTTP 503 météo écrivait une URL Open-Meteo complète avec les coordonnées de la configuration chiffrée dans des logs GitHub publics. Chiffrer la configuration ne suffit donc pas si le chemin d’erreur réimprime les données sensibles.",
          "Le correctif du relais publie fournisseur et type de panne : HTTP, réseau/délai ou JSON. La panne reste visible et bloque le verdict concerné. On ne cache pas un échec ; on enlève les informations inutiles au diagnostic."
        ],
        "code": "à éviter : erreur + URL complète + coordonnées\nà garder : fournisseur + catégorie + statut utile\nà tester : HTTP 503, délai, JSON invalide, retour normal"
      },
      {
        "title": "Un doublon ressemble, une identité se prouve",
        "body": [
          "Les débriefs pouvaient rouvrir une ancienne entrée à chaque rendu, puis proposer plusieurs questionnaires. Le correctif sollicite une nouvelle arrivée, conserve « Plus tard » et ajoute une pause jusqu’à la fin de journée Europe/Paris dans le contexte existant.",
          "Deux entrées proches avec même nom, origine et destination sont signalées comme doublons possibles. Elles ne sont ni fusionnées ni supprimées automatiquement : deux événements réels peuvent se ressembler."
        ]
      },
      {
        "title": "La comparaison exige des données valides",
        "body": [
          "Telemetry Replay et les débriefs comparent une prévision existante à une observation déclarée. Une prévision absente ou ancienne reste non comparable. Un score inventé rendrait le diagnostic plus joli mais moins vrai.",
          "Pour le portfolio, raconter le symptôme, la frontière de données, le correctif et un scénario négatif. Les exemples, fichiers de test et captures restent fictifs ; un log expurgé doit encore permettre de distinguer une panne réseau d’un JSON invalide."
        ]
      },
      {
        "title": "Complément du 21/10/2026 · Journey Replay garde le contexte historique",
        "body": [
          "Journey Replay projette le débrief enregistré en deux temps : prévision archivée au départ, puis déclaration du conducteur à l’arrivée. Le noyau ne consulte ni la météo réseau actuelle ni le contexte du trajet du jour pour réécrire un déplacement passé. Le parcours dessiné est illustratif, sans échelle et sans trace GPS.",
          "Un départ non archivé, un retour absent ou une prévision trop ancienne produisent une limite explicite. Une comparaison non disponible n’obtient aucun score inventé. La silhouette historique dépend de l’identité figée au départ ; renommer aujourd’hui la voiture du Garage ne prouve pas son identité hier. Ce cas apprend à séparer une photographie enregistrée d’un état actuel."
        ]
      }
    ],
    "pitfalls": [
      "Publier les URL brutes pour faciliter un debug.",
      "Supprimer un doublon sur la seule proximité temporelle.",
      "Donner un score à une prévision absente."
    ],
    "interview": {
      "question": "Comment garder un incident exploitable sans divulguer les données personnelles ?",
      "answer": "Je conserve des catégories stables, le fournisseur et le statut utile, puis je teste les chemins d’erreur avec des données fictives. Les coordonnées, noms et calendriers privés ne sont pas nécessaires dans un log public. Je vérifie aussi la reprise normale pour ne pas masquer le problème."
    },
    "exercise": {
      "prompt": "Deux trajets ressemblent à des doublons et la météo de l’un manque. Que faut-il afficher et conserver ?\n\nVariante du 21/10 : le débrief d’hier n’a pas de prévision archivée, mais la météo actuelle est disponible. Peut-on compléter le replay avec elle ?",
      "answer": "Signaler « doublon possible » sans suppression ni fusion automatique ; conserver les deux événements. Pour le trajet sans prévision comparable, annoncer « comparaison indisponible » sans score. La pause de sollicitation peut être appliquée sans perdre l’historique ni les actions manuelles.\n\nNon : conserver le retour déclaré, signaler la prévision manquante et laisser la comparaison non disponible. La météo actuelle ne reconstitue pas une prévision de départ historique ; une animation ne crée aucune trace GPS."
    },
    "sources": [
      {
        "id": "public-relay",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-debrief",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-replay-20261021",
        "location": "Complément sourcé du 21/10/2026 ; instantané distinct des archives"
      }
    ],
    "related": [
      "race-privacy",
      "vuln",
      "race-tests"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles. Complément vérifié le 21/10/2026, avec références figées distinctes ; les exemples précédents restent des instantanés historiques."
  },
  {
    "id": "rc-41",
    "chapter": 41,
    "section": "portfolio",
    "title": "Reconversion · cours, labs et preuves",
    "summary": "Notre deuxième projet : PWA bilingue, cinq minutes par jour, révisions adaptatives et progression indépendante des preuves.",
    "tags": [
      "Reconversion Control",
      "SRS",
      "Daily Five",
      "portfolio"
    ],
    "goals": [
      "Présenter les trois dimensions cours, lab et preuve.",
      "Expliquer SRS et Daily Five sans confondre XP et compétence.",
      "Décrire la synchronisation optionnelle et ses limites."
    ],
    "sections": [
      {
        "title": "Le produit est un projet IT concret",
        "body": [
          "Reconversion Control est une PWA séparée de Race Control. Ses 42 fiches générales, son socle de 32 chapitres historiques, ses approfondissements et ses nouveaux cas récents forment un parcours Cyber → Cloud/DevSecOps → Pentest → Sécurité IA.",
          "L’English Coach augmente la part d’anglais de 25 % à 50 %, puis 75 %, avec aide française disponible. Les recherches et liens directs permettent de retrouver une notion ; les exemples pédagogiques ne publient aucun livre Drive brut."
        ]
      },
      {
        "title": "Ne pas confondre lecture et preuve",
        "body": [
          "Le statut d’un cours indique une autoévaluation des connaissances. Un lab conserve son propre état. Une preuve portfolio décrit ce qui a été construit, testé ou expliqué, dans un Evidence Locker local. Livrer du code avec une assistance ne valide pas automatiquement ces trois dimensions.",
          "Daily Five propose quiz, mini-mission et English Sprint, avec 14 sessions existantes. La sélection privilégie révision due, erreur récente puis domaine faible. Le SRS fait sortir une notion d’Acquis après deux oublis ; les XP et séries restent des outils d’engagement, pas une certification."
        ]
      },
      {
        "title": "Une synchronisation volontaire",
        "body": [
          "La progression reste locale par défaut. L’utilisateur peut configurer son propre projet Supabase et s’authentifier par Email OTP ; la progression est chiffrée localement avec AES-256-GCM avant envoi. Une révision conditionnelle et un choix explicite traitent les conflits PC/iPhone.",
          "Cette fonction n’active pas un backend par défaut. Un export local de progression contient des traces de portfolio saisies par l’utilisateur : il doit être gardé privé. L’enveloppe cloud chiffrée ne rend pas automatiquement localStorage ou l’export JSON chiffrés."
        ]
      },
      {
        "title": "Complément du 21/10/2026 · Projet 2027 et preuves de décision",
        "body": [
          "La V3 ajoute Projet 2027 : six étapes du socle IT à la sécurité IA, huit démonstrations sans assistance, six actions de dossier et un comparatif d’écoles sur huit questions. Une réponse d’école n’est contrôlée avec preuve que si une trace et une date sont renseignées ; cela reste une déclaration de l’utilisateur, pas une admission accordée par le site.",
          "Une fiche RNCP confirme un titre, un niveau et des dates, sans prouver l’habilitation de chaque centre, l’admission ou le financement individuel. Dans le budget, une case vide reste inconnue et un zéro doit être explicite. L’exercice utile consiste à demander les pièces manquantes plutôt qu’à transformer une marge sous plafond en financement obtenu."
        ]
      }
    ],
    "pitfalls": [
      "Marquer les cours Acquis parce qu’une application a été livrée.",
      "Dire que l’export de progression est toujours chiffré.",
      "Promettre qu’un Supabase est connecté sans vérifier la configuration."
    ],
    "interview": {
      "question": "Quel problème résout Reconversion Control et quelle preuve peux-tu montrer ?",
      "answer": "Il organise l’apprentissage, la révision et les preuves sans les confondre. Je peux montrer un parcours bilingue, un cas SRS, un lab fictif, un export/import et un rechargement hors ligne. Je présente le cloud comme opt-in et je garde les traces personnelles hors du dépôt public."
    },
    "exercise": {
      "prompt": "Tu as terminé un lab mais oublié le concept lors de deux révisions. Quels états devraient changer ?\n\nVariante du 21/10 : le titre figure au RNCP et le coût connu reste sous le budget. Le financement et l’admission sont-ils validés ?",
      "answer": "Le SRS fait passer la connaissance en En cours et retire sa révision Acquis. Le statut du lab et sa preuve restent indépendants. Une session Daily Five complétée peut conserver ses XP ; aucun de ces résultats ne certifie automatiquement une compétence ou un examen.\n\nNon. Vérifier séparément le centre et le titre complet ou les blocs préparés, les conditions de la cohorte, les frais encore inconnus et l’accord individuel de financement. Dater les preuves reçues ; ne modifier ni la maîtrise d’un cours ni une certification sur cette seule base."
    },
    "sources": [
      {
        "id": "public-reconversion",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-project-v3-20261021",
        "location": "Complément sourcé du 21/10/2026 ; instantané distinct des archives"
      }
    ],
    "related": [
      "race-arch",
      "cicd",
      "shared"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles. Complément vérifié le 21/10/2026, avec références figées distinctes ; les exemples précédents restent des instantanés historiques."
  },
  {
    "id": "rc-42",
    "chapter": 42,
    "section": "portfolio",
    "title": "Control Vault · prototype & portfolio",
    "summary": "Notre troisième projet est un prototype avec moteurs réels sur données fictives : il complète les preuves Race et Reconversion.",
    "tags": [
      "Control Vault",
      "prototype",
      "SHA-256",
      "entretien"
    ],
    "goals": [
      "Distinguer prototype, moteur testé et connexion réelle.",
      "Expliquer sérialisation, empreinte, chiffrement et relecture.",
      "Préparer un pitch des trois projets sans survente."
    ],
    "sections": [
      {
        "title": "Ce que Control Vault fait aujourd’hui",
        "body": [
          "Le dépôt public Control-Vault contient la Phase 1 : prototype PWA iPhone/PC. Les données de démonstration sont recréées à l’ouverture ; aucune connexion réelle à Google Drive ou Supabase n’est active dans ce prototype.",
          "Les moteurs de sérialisation, SHA-256, AES-256-GCM, relecture et comparaison fonctionnent réellement contre un Drive de démonstration en mémoire. Hors ligne, session expirée, envoi interrompu et backend indisponible peuvent être simulés pour travailler les états de l’interface."
        ]
      },
      {
        "title": "Une empreinte n’est pas une sauvegarde durable",
        "body": [
          "SHA-256 permet de comparer des octets. AES-GCM peut protéger contenu et intégrité si la gestion des clés est correcte. Il faut encore une destination réelle, des permissions, une récupération durable et une restauration après fermeture pour parler d’un coffre opérationnel.",
          "Dans le prototype, la clé de démonstration est éphémère. La gouvernance du chiffrement durable reste une étude de phase ultérieure avec revue humaine et essais sur appareils réels. Ne pas y confier une sauvegarde personnelle."
        ],
        "code": "objet → sérialisation → empreinte → chiffrement\n      → destination DEMO → relecture → comparaison\nproduction future : identité + permissions + clé durable + récupération"
      },
      {
        "title": "Le portfolio montre décisions et limites",
        "body": [
          "Race Control démontre décision explicable, données privées, tests et UX mobile. Reconversion Control démontre PWA, apprentissage bilingue, états de progression et cloud opt-in. Control Vault démontre prototype, moteurs d’intégrité et scénarios d’échec.",
          "Un pitch dit ce que tu peux expliquer personnellement, le rôle de l’assistance, la preuve publique et la limite restante. Cloud-DevSecOps-Lab reste une idée de prochain projet, sans dépôt ou certification inventés. Le cursus pentest et IA doit encore produire ses propres labs et preuves."
        ]
      },
      {
        "title": "Complément du 21/10/2026 · contrat documenté et service connecté",
        "body": [
          "Le lot 1 fusionné dans Control Vault le 16/10 ajoute un contrat d’intégration et des tests de contrat indépendants. Ce document décrit un paquet opaque déjà chiffré : Control Vault doit contrôler sa structure et son empreinte sans demander le code Race Control. Le contrat ne livre aucune connexion Google, aucun transport réel ni nouvelle restauration personnelle.",
          "L’empreinte cohérente ne prouve pas à elle seule l’authenticité ou la possibilité de restaurer les données. Les blocages B01 à B03 du document décrivent l’état étudié au 16/10 ; les corrections ultérieures de Race Control s’évaluent séparément. Une correction dans un autre dépôt ou une PR encore en brouillon ne rend pas le prototype opérationnel. Le pitch conserve donc Phase 1, données fictives et absence de sauvegarde durable connectée."
        ]
      },
      {
        "title": "Paquet opaque · qui prouve quoi avant une connexion réelle ?",
        "body": [
          "Au contrôle du 22/10, les lots B1 et B2 de Control Vault sont fusionnés comme préparations. Le cache de paquets peut être testé après réouverture et le fournisseur de transport peut vérifier une relecture distante sur un serveur Drive simulé. L’interface publique instancie encore DemoDrive ; ces modules non branchés ne transforment donc pas la démonstration en synchronisation réelle.",
          "Le statut local-only décrit une copie locale, soumise aux limites du navigateur. verified-bytes décrit les octets relus pour une copie précise ; ce statut ne garantit ni leur authenticité, ni la dernière révision du compte, ni l’état global « protégé ». Race Control reste responsable du chiffrement, de l’authentification et des règles métier. Vault transporte les octets sans détenir ni dériver la clé propriétaire, ni déchiffrer le contenu.",
          "Les tests du profil A1 utilisent des instantanés du vrai codec propriétaire, des données fictives et des empreintes de provenance. Cette interopérabilité est une preuve plus précise qu’un faux fichier fabriqué pour réussir le lecteur. Elle ne remplace pas le consentement OAuth, les permissions réellement accordées et les essais PC/iPhone sur le service réel. La documentation Google définit drive.file comme un accès limité aux fichiers créés ou ouverts avec l’application, ou partagés avec elle par une sélection autorisée ; il ne donne pas accès à tout le Drive."
        ]
      }
    ],
    "pitfalls": [
      "Présenter un Drive mémoire comme une connexion Google réelle.",
      "Confondre empreinte SHA-256 et chiffrement.",
      "Inscrire une certification ou un projet recommandé comme déjà acquis."
    ],
    "interview": {
      "question": "Comment présenterais-tu un prototype de coffre à un recruteur ?",
      "answer": "Je décris la Phase 1 et ses données fictives, puis les moteurs effectivement exécutés et les scénarios d’échec. Je montre une preuve de relecture et d’intégrité, et je précise que l’authentification, la destination réelle et les clés durables restent à livrer. Je peux expliquer mes décisions sans prétendre exploiter un coffre production."
    },
    "exercise": {
      "prompt": "Écris un pitch de trois phrases, une par projet, avec une limite explicite pour Control Vault.\n\nVariante du 21/10 : un schéma et ses tests sont fusionnés. Peut-on annoncer que les sauvegardes sont synchronisées avec Google Drive ?\n\nCas du 22/10 : un test relit les mêmes octets après réouverture et réussit un échange entre deux profils sur un faux serveur Drive. Quelles preuves peux-tu présenter, et lesquelles manquent encore ?",
      "answer": "Race Control : cockpit mobile de décision météo/trajet, avec données chiffrées et livraison vérifiée. Reconversion Control : parcours bilingue et révisions, avec cours, labs et preuves indépendants. Control Vault : prototype de coffre testant intégrité et chiffrement sur données fictives, sans connexion réelle ni sauvegarde durable active.\n\nNon : un contrat précise ce qui doit être compatible, pas l’existence d’un transport authentifié et durable. Il manque les preuves de connexion réelle, de permissions, de conservation après fermeture et de restauration. Une empreinte correcte ne remplace pas les contrôles d’authenticité et de conservation.\n\nPrésenter la conservation locale, l’intégrité des octets et le scénario de transport simulé avec son périmètre. Il reste à prouver le consentement et les droits réels, le service Drive, les deux appareils et la restauration métier. Ni local-only ni verified-bytes ne signifient synchronisation complète ou authenticité des données."
    },
    "sources": [
      {
        "id": "public-control-vault",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-reconversion",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-ux93",
        "location": "Code, décisions et limites du cas"
      },
      {
        "id": "public-cv-crypto",
        "location": "Statut et tests requis avant sauvegardes réelles"
      },
      {
        "id": "public-vault-contract-20261021",
        "location": "Complément sourcé du 21/10/2026 ; instantané distinct des archives"
      },
      {
        "id": "public-vault-transport-20261022",
        "location": "Cas vérifié le 22/10/2026 ; portée et limites explicites"
      },
      {
        "id": "public-vault-profile-20261022",
        "location": "Cas vérifié le 22/10/2026 ; portée et limites explicites"
      },
      {
        "id": "public-drive-scope-20261022",
        "location": "Cas vérifié le 22/10/2026 ; portée et limites explicites"
      }
    ],
    "related": [
      "race-arch",
      "crypto",
      "race-tests"
    ],
    "provenance": "Cas récent · sources publiques vérifiées le 12/10/2026. Le socle historique prod15 reste disponible ; cette extension décrit les réalisations et leurs limites actuelles. Complément vérifié le 21/10/2026, avec références figées distinctes ; les exemples précédents restent des instantanés historiques. Cas de conservation, livraison ou transport revu le 22/10/2026 ; les instantanés antérieurs restent datés."
  }
]);
