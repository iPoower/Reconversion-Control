const RC_COURSE_FOUNDATIONS = [
  {
    id: 'rc-01', chapter: 1, title: 'Race Control en une image mentale', section: 'portfolio',
    summary: 'Comprendre comment Race Control transforme météo, trajet et pneus en une aide à la décision explicable.',
    tags: ['PWA', 'décision', 'moteur déterministe', 'architecture', 'Waze'],
    goals: ['Distinguer aide à la décision et navigation.', 'Suivre la chaîne qui relie les données à une action.', 'Identifier ce que le navigateur et le relais peuvent faire.'],
    sections: [
      { title: 'Un ingénieur de course avant le départ', body: [
        'Imagine un ingénieur qui vérifie la météo, la piste et les pneus avant de laisser partir une voiture. Race Control applique cette image à un déplacement quotidien : ce véhicule est-il adapté à ce trajet, à cette heure et dans ces conditions ? Le produit croise plusieurs signaux au lieu de réduire la réponse à la seule température de l’air.',
        'Le dossier décrit un instantané historique prod-15. À cette version, le cockpit rassemble Pneus, Météo et Tenue. Ce cours explique les responsabilités et les principes de cet instantané ; une idée classée dans sa roadmap ne constitue pas une fonctionnalité déjà livrée.'
      ] },
      { title: 'Lire la chaîne de décision', body: [
        'La position et l’agenda servent à identifier un trajet et des heures de passage. La météo est ensuite associée à ces lieux et à ces heures. Le moteur estime la température de chaussée, analyse les conditions de verglas et tient compte des pneus du véhicule. Il produit un score, un niveau de risque et des raisons lisibles.',
        'Cette chaîne explique pourquoi une route et sa météo doivent rester cohérentes. Une prévision à destination ne décrit pas nécessairement le point le plus exposé du parcours. Une température de chaussée estimée reste une estimation : l’interface doit conserver cette distinction au lieu de la présenter comme une mesure sur la route.'
      ], code: 'Position / agenda\n  → trajet et heures de passage\n  → météo, chaussée estimée, verglas\n  → pneus et contraintes\n  → score et explication\n  → action utilisateur' },
      { title: 'Déterministe signifie explicable', body: [
        'Un moteur déterministe applique des règles explicites : à entrées identiques et configuration identique, il renvoie le même résultat. Il ne demande pas à un modèle de langage d’improviser le verdict. Cela permet de rejouer un cas dans un test et de discuter une pénalité précise plutôt que de chercher pourquoi une phrase a changé.',
        'Le navigateur gère le contexte immédiat lorsque l’application fonctionne : interface, GPS et trajet vivant. Le relais GitHub Actions prépare des observations, trajets planifiés et notifications dans le cloud. Cette séparation répond aux restrictions de l’iPhone sur l’exécution continue d’une PWA fermée.'
      ] },
      { title: 'Décider puis naviguer', body: [
        'Race Control aide à préparer une décision ; Waze guide ensuite vers la destination. Ouvrir Waze ne signifie pas que Race Control reçoit son trafic en temps réel. Une nouvelle fonction doit donc améliorer une décision ou réduire une incertitude, plutôt qu’accumuler des informations sans effet sur le trajet.'
      ] }
    ],
    pitfalls: ['Confondre un score explicable avec une garantie de sécurité sur toute la route.', 'Présenter une estimation de chaussée comme une mesure réelle.', 'Déduire du lien Waze que le trafic Waze est reçu par le moteur.'],
    interview: { question: 'Quelle est la valeur technique de Race Control ?', answer: 'Le projet associe des données de lieu et de temps à un moteur déterministe, explique son verdict et sépare contexte navigateur, calcul métier et continuité cloud. Il complète la navigation en préparant la décision.' },
    exercise: { prompt: 'Un trajet paraît sec au départ, mais un point de passage est froid et humide. Pourquoi une simple carte météo du domicile ne suffit-elle pas ?', answer: 'Le risque dépend du lieu et de l’heure d’exposition. Il faut examiner le parcours, ses heures de passage, la chaussée estimée et les pneus ; la météo du domicile ne prouve rien pour le point froid.' },
    sources: [{ id: 'course-prod15', pages: '5' }, { id: 'dossier-prod15', pages: '3–4, 6' }],
    related: ['race-arch', 'programming', 'cia-risk']
  },
  {
    id: 'rc-02', chapter: 2, title: 'Cartographie du dépôt : qui fait quoi ?', section: 'portfolio',
    summary: 'Trouver la couche responsable d’un symptôme avant de modifier le code du projet.',
    tags: ['dépôt', 'responsabilités', 'engine.js', 'app.js', 'relay.js', 'débogage'],
    goals: ['Distinguer interface, calcul et worker cloud.', 'Orienter une investigation vers le bon fichier.', 'Comprendre pourquoi le code source et le build sont séparés.'],
    sections: [
      { title: 'Commencer par le symptôme', body: [
        'Un dépôt est l’ensemble versionné des fichiers du projet. Lire sa carte évite de chercher au hasard. Si un bouton manque, on commence par l’interface et son rendu. Si le bouton s’affiche mais que le risque est faux, on examine le moteur et les données qui l’alimentent. Si une notification ne part pas alors que l’application est fermée, on enquête côté relais et workflow.',
        'Les tailles de fichiers données dans le dossier sont celles de prod-15, pas des limites à reproduire. Leur intérêt est de montrer que app.js concentre déjà beaucoup de responsabilités. La maintenance consiste à isoler progressivement ces responsabilités en conservant les tests, plutôt qu’à réécrire tout le projet.'
      ] },
      { title: 'Les pièces qui font fonctionner le produit', body: [
        'src/app.js orchestre l’interface, l’agenda local, les interactions et le GPS vivant. src/engine.js contient les calculs météo, chaussée, verglas, pneus et route météo. src/wardrobe.js porte le conseil sartorial déterministe. Une règle métier doit pouvoir être examinée indépendamment de la façon dont sa carte est dessinée.',
        'src/relay.js est exécuté par GitHub Actions : il prépare observations METAR, agenda, routes planifiées et notifications. src/shell.html décrit les zones de la page ; src/style.css règle leur présentation. src/sw.js apporte le cache de secours PWA. Les fichiers du relais restent séparés du JavaScript livré au navigateur.'
      ], code: 'Symptôme                    Première piste\nMauvais risque de verglas    engine.js → iceRisk() + données horaires\nBouton invisible            app.js / shell.html / style.css\nNotification cloud absente  relay.js + race-control.yml\nAncienne page hors ligne    sw.js + cache + version du build' },
      { title: 'L’atelier et le banc d’essai', body: [
        'tools/build.js assemble les sources en fichiers publiables. tests/ contient les contrôles du moteur, les parcours navigateur et le harnais du relais. .github/workflows/ automatise les tests, contrôles de confidentialité, exécution cloud et publication. Ce sont des outils de fabrication et de vérification, distincts de l’interface utilisée sur l’iPhone.',
        'Pour retrouver une fonction, l’annexe cite buildHours et makeModel pour les prévisions, estRoad pour la chaussée, iceRisk pour le verglas et tireAssess pour les pneus. Les fonctions render* appartiennent au rendu. Cette nomenclature fournit une piste d’investigation ; elle ne dispense pas de vérifier les entrées et l’état qui déclenchent le problème.'
      ] },
      { title: 'Séparer responsabilité et dépendance', body: [
        'Une interface peut appeler le moteur sans contenir elle-même toutes ses règles. Un relais peut réutiliser un calcul métier sans simuler le DOM du navigateur. Cette séparation facilite les tests : un faux GPS vérifie le comportement de l’interface, tandis que des objets horaires fictifs vérifient directement un calcul.'
      ] }
    ],
    pitfalls: ['Corriger la carte visuelle alors que son moteur reçoit une mauvaise donnée.', 'Chercher une notification cloud dans le service worker de l’iPhone.', 'Modifier uniquement le fichier assemblé sans corriger ses sources.'],
    interview: { question: 'Comment abordes-tu un bug dans un dépôt que tu connais peu ?', answer: 'Je décris précisément le symptôme, identifie la couche responsable, consulte sa cartographie puis reproduis le cas avec des données fictives. J’examine la fonction et ses entrées avant de modifier le code.' },
    exercise: { prompt: 'L’interface reste utilisable, mais le niveau de verglas est trop élevé. Quels deux éléments examines-tu d’abord ?', answer: 'La fonction iceRisk() dans engine.js, puis les données horaires transmises à cette fonction. Cela distingue une règle incorrecte d’une entrée absente, ancienne ou mal interprétée.' },
    sources: [{ id: 'course-prod15', pages: '5–6, 37' }, { id: 'dossier-prod15', pages: '5–6' }],
    related: ['race-arch', 'programming', 'linux-fs']
  },
  {
    id: 'rc-03', chapter: 3, title: 'HTML, CSS et JavaScript : les trois couches visibles', section: 'fundamentals',
    summary: 'Lire la structure, la présentation et le comportement d’une interface web sans confondre leurs rôles.',
    tags: ['HTML', 'CSS', 'JavaScript', 'DOM', 'accessibilité', 'responsive'],
    goals: ['Reconnaître structure, style et comportement.', 'Comprendre comment un rendu remplit une zone HTML.', 'Relier accessibilité et usage tactile à des choix concrets.'],
    sections: [
      { title: 'Le squelette : HTML', body: [
        'HTML décrit les éléments d’une page : titres, sections, paragraphes, boutons et formulaires. Le navigateur construit à partir de cette structure un DOM, c’est-à-dire une représentation des éléments que JavaScript peut lire ou modifier. Dans Race Control, le shell réserve une section pour le briefing ; elle peut être vide avant son premier rendu.',
        'L’attribut id permet de retrouver une zone précise. Une classe sert notamment à appliquer des styles. aria-label donne un nom accessible à la région lorsqu’une description est nécessaire aux technologies d’assistance. Il ne remplace pas un titre visible ou un bouton correctement nommé lorsque ceux-ci sont attendus.'
      ], code: '<!-- Extrait simplifié du shell prod-15 -->\n<section class="mod brf" id="secBrf"\n         aria-label="Briefing du trajet"></section>' },
      { title: 'La présentation : CSS', body: [
        'CSS règle la couleur, la typographie, l’espacement et la disposition des éléments. Une règle sélectionne des éléments puis leur attribue des propriétés. Le sélecteur ci-dessous vise les boutons placés dans un composant de contrôle de tenue. min-height impose une hauteur minimale, même si le texte est court.',
        'Un écran étroit oblige à prévoir le retour à la ligne, les grilles et les zones sûres de l’iPhone. Le dossier prod-15 recommande une approche mobile-first, une hiérarchie qui place le verdict avant les détails et le respect du réglage de réduction des mouvements. La cible tactile de 44 px évite des commandes trop petites pour un doigt.'
      ], code: '.outfit-controls .seg button {\n  font-size: 14px;\n  min-height: 44px;\n  padding: 9px 12px;\n}' },
      { title: 'Le comportement : JavaScript', body: [
        'JavaScript lit les données, réagit à une action et met l’interface à jour. Dans l’extrait du cours, renderAll() calcule le contexte puis appelle plusieurs fonctions de rendu. C’est un orchestrateur : il organise le travail sans devoir réaliser tous les calculs ni dessiner chaque détail lui-même.',
        'Une carte affichée résulte donc de deux opérations différentes : obtenir un état cohérent, puis représenter cet état. Cette distinction aide à diagnostiquer un bug. Une mauvaise couleur peut relever du CSS ; un briefing absent peut venir du rendu ; un score erroné peut venir du moteur plutôt que de la page.'
      ], code: 'function renderAll() {\n  CX = computeCtx();\n  renderView();\n  renderStatus();\n  renderBrf();\n  renderCal();\n  renderCurrent();\n  renderTenue();\n}' },
      { title: 'Une interface indique aussi l’incertitude', body: [
        'Le dossier demande des états explicites : chargement, GPS ancien, cache ancien, route périmée ou données partielles. Le design ne consiste pas seulement à embellir un chiffre. Il doit aider l’utilisateur à comprendre quelle donnée est disponible et quelle décision reste incertaine.'
      ] }
    ],
    pitfalls: ['Attendre du CSS qu’il décide quel trajet est pertinent.', 'Mettre un calcul métier dans le HTML affiché.', 'Supposer qu’un test WebKit remplace toutes les vérifications sur un iPhone physique.'],
    interview: { question: 'Comment expliques-tu HTML, CSS et JavaScript à un débutant ?', answer: 'HTML donne la structure et les éléments accessibles, CSS leur présentation et leur disposition, JavaScript les réactions et les mises à jour à partir de l’état. Le rendu relie des données cohérentes à cette structure.' },
    exercise: { prompt: 'Un bouton existe et déclenche la bonne action, mais il mesure 25 px de haut sur mobile. Quelle couche modifies-tu et que vérifies-tu ensuite ?', answer: 'Je corrige son CSS pour obtenir au moins 44 px de cible tactile, puis vérifie la largeur disponible, le retour à la ligne et l’utilisation au clavier comme au toucher. La logique métier ne change pas.' },
    sources: [{ id: 'course-prod15', pages: '6–7' }, { id: 'dossier-prod15', pages: '20–21' }],
    related: ['web-stack', 'programming', 'race-arch']
  },
  {
    id: 'rc-04', chapter: 4, title: 'JavaScript de base avec le vrai code Race Control', section: 'fundamentals',
    summary: 'Comprendre variables, objets, fonctions et conditions à partir de l’état du trajet vivant.',
    tags: ['JavaScript', 'const', 'let', 'objet', 'fonction', 'null', 'condition'],
    goals: ['Lire une constante et une variable réassignable.', 'Suivre les propriétés d’un objet d’état.', 'Distinguer absence de donnée, zéro et condition valide.'],
    sections: [
      { title: 'Une référence stable et une valeur qui évolue', body: [
        'const déclare une variable dont la référence ne sera pas réassignée. let permet une réassignation ultérieure. Dans l’extrait du cours, LIVE_CAR est un seuil de configuration ; FIX et FIXPREV sont les relevés GPS actuel et précédent, donc leurs valeurs peuvent évoluer.',
        'Une précision importante : const ne rend pas tout un objet immuable. Un objet déclaré avec const peut conserver la même référence tout en voyant ses propriétés changer. Ainsi LIVE.phase peut évoluer sans remplacer l’objet LIVE lui-même. Cette distinction évite de croire qu’un état déclaré avec const reste forcément figé.'
      ], code: 'const LIVE_CAR = 2;\nlet FIX = null, FIXPREV = null;\n\nconst LIVE = {\n  key: null,\n  phase: "idle",\n  startFix: null,\n  carN: 0,\n  route: null\n};' },
      { title: 'Objets, tableaux et fonctions', body: [
        'Un objet regroupe des valeurs nommées qui décrivent une même chose. LIVE.phase lit la phase du suivi ; LIVE.carN lit son compteur de relevés à vitesse automobile. Un tableau représente une collection ordonnée, par exemple plusieurs prévisions horaires. On ne choisit pas entre objet et tableau au hasard : ils décrivent des organisations différentes des données.',
        'Une fonction reçoit des paramètres, exécute des instructions et peut retourner une valeur. Les petites fonctions de calcul constituent des briques réutilisables ; les fonctions render* produisent plutôt l’interface. Le nom distKm indique une distance en kilomètres, ce qui aide à suivre les unités sans remplacer leur documentation.'
      ] },
      { title: 'Une condition protège une transition', body: [
        'if exécute un bloc uniquement quand son expression est vraie. L’opérateur === compare sans convertir implicitement les types. L’extrait montre qu’en phase advice, les compteurs liés à l’arrivée sont remis à zéro. La syntaxe sert ici une règle produit : un aperçu ne doit pas être interprété comme une arrivée réelle.',
        'Une affectation change une valeur : LIVE.arrN = 0. Une comparaison pose une question : LIVE.phase === "advice". Les confondre peut modifier l’état au moment où l’on voulait seulement le vérifier. Lire le code en phrases simples aide à repérer cette différence.'
      ], code: 'if (LIVE.phase === "advice") {\n  LIVE.arrN = 0;\n  LIVE.near = null;\n}' },
      { title: 'null évite une vitesse inventée', body: [
        'null représente explicitement l’absence de valeur. Une vitesse inconnue n’est pas une vitesse de zéro : zéro peut indiquer une mesure valide à l’arrêt. La condition v != null du cours exclut une donnée absente ; dans ce test volontairement souple, elle exclut aussi undefined. Il faut ensuite vérifier que la vitesse dépasse le seuil.',
        'Le ternaire condition ? valeurSiVrai : valeurSiFaux choisit l’une de deux valeurs. Ici, une vitesse présente et suffisante incrémente la série automobile ; sinon le compteur repart à zéro. Un GPS incomplet ne devient donc pas une preuve de mouvement.'
      ], code: 'const v = liveSpeed(LIVE.lastFix, fix);\nLIVE.carN = v != null && v > LIVE_CAR\n  ? LIVE.carN + 1\n  : 0;' }
    ],
    pitfalls: ['Confondre const et immutabilité profonde d’un objet.', 'Remplacer une vitesse inconnue par zéro sans conserver son absence.', 'Confondre affectation = et comparaison ===.'],
    interview: { question: 'Quelle différence fais-tu entre LIVE.phase et LIVE_CAR ?', answer: 'LIVE.phase est une propriété mutable de l’état courant du suivi. LIVE_CAR est une constante de configuration utilisée pour reconnaître un mouvement automobile. L’état décrit la situation ; la constante fixe une règle.' },
    exercise: { prompt: 'LIVE.carN vaut 2. Quel résultat produit l’expression du cours si v vaut null, puis si v vaut 3 et LIVE_CAR vaut 2 ?', answer: 'Avec null, v != null est faux et le résultat est 0. Avec 3, les deux conditions sont vraies et le compteur passe de 2 à 3. La donnée absente interrompt la série au lieu de confirmer un départ.' },
    sources: [{ id: 'course-prod15', pages: '7–9' }],
    related: ['programming', 'formats', 'race-arch']
  },
  {
    id: 'rc-05', chapter: 5, title: 'HTTP, API et JSON : comment l’app parle au monde extérieur', section: 'network',
    summary: 'Relier une requête réseau, une réponse JSON et un modèle métier en tenant compte des fournisseurs.',
    tags: ['HTTP', 'API', 'JSON', 'Open-Meteo', 'OSRM', 'fallback', 'données'],
    goals: ['Expliquer requête, réponse et format JSON.', 'Distinguer fournisseur météo, routage et géocodage.', 'Comprendre les données envoyées et les limites d’une réponse.'],
    sections: [
      { title: 'L’API est un guichet structuré', body: [
        'Une API fournit une interface permettant à un programme de demander un service. Une requête HTTP transporte la demande vers une adresse ; la réponse contient un statut et, lorsque le service répond comme prévu, des données. Race Control ne connaît pas la météo à l’avance : il la demande notamment à Open-Meteo.',
        'Les paramètres latitude, longitude et hourly précisent le lieu et les variables attendues. Ils font partie de la demande transmise au fournisseur. Une API publique ne signifie donc pas que les informations envoyées restent uniquement sur l’appareil. La documentation du fournisseur et les règles de minimisation comptent autant que le format de réponse.'
      ] },
      { title: 'JSON transporte les données', body: [
        'JSON est un format textuel de données composé notamment d’objets, de tableaux, de nombres et de chaînes. Les noms de propriétés et les chaînes sont entre guillemets doubles. L’exemple fictif du cours associe deux heures à deux températures ; leur correspondance dépend du même indice dans les tableaux.',
        'Recevoir ce JSON n’est pas encore obtenir un conseil. Le moteur construit des objets horaires adaptés à ses calculs puis applique ses règles. Il faut vérifier les champs, les unités, les dates et les valeurs absentes. Une réponse techniquement lisible peut rester inutilisable si les tableaux sont incomplets ou concernent une période différente.'
      ], code: '{\n  "hourly": {\n    "time": ["2026-10-03T08:00", "2026-10-03T09:00"],\n    "temperature_2m": [8.1, 9.0]\n  }\n}\n// Exemple fictif : index 0 → 08:00 et 8,1 °C.' },
      { title: 'Chaque fournisseur a un rôle', body: [
        'Open-Meteo fournit les prévisions et certaines données complémentaires. OSRM fournit route et durée ; il ne mesure pas la chaussée. IGN/GeoPF et les services de géocodage traduisent une adresse ou un point en localisation. AviationWeather fournit au relais des observations METAR de stations, qui ne sont pas des mesures sur chaque portion de route.',
        'RainViewer apporte le radar, Waze ouvre la navigation et ntfy transporte les notifications. La liste des fournisseurs est celle de l’instantané prod-15. Le dossier distingue leurs données envoyées, rappelle l’arrondi de certaines positions et demande de documenter précision, fraîcheur, quota, confidentialité et fallback avant toute nouvelle intégration.'
      ] },
      { title: 'Une panne doit rester compréhensible', body: [
        'Un service peut être lent, indisponible ou retourner une erreur. Un fallback est un comportement de secours prévu : cache identifié comme ancien, estimation explicitement signalée ou fonction temporairement indisponible. Le dossier préfère cette dégradation visible à un conseil inventé. Un service externe absent ne doit pas empêcher toutes les autres parties de l’interface de fonctionner.'
      ] }
    ],
    pitfalls: ['Confondre JSON valide et donnée métier fiable.', 'Présenter une durée OSRM comme une prévision de trafic Waze.', 'Envoyer des données au fournisseur sans examiner ce qui quitte l’appareil.'],
    interview: { question: 'Pourquoi prévois-tu un fallback autour d’une API ?', answer: 'Le fournisseur peut échouer ou répondre avec des données anciennes ou partielles. Je définis un délai maximal, valide la réponse et affiche un état de secours explicite, afin que l’application reste utilisable sans transformer une incertitude en certitude.' },
    exercise: { prompt: 'L’API répond avec deux heures et une seule température. Peut-on calculer librement la seconde heure ?', answer: 'Non. La seconde température manque. Il faut conserver cette absence, éviter un accès supposé valide et afficher les données partielles ou un secours identifié. Répéter arbitrairement la première valeur fabriquerait une prévision.' },
    sources: [{ id: 'course-prod15', pages: '9–10' }, { id: 'dossier-prod15', pages: '22–23' }],
    related: ['http-tls', 'formats', 'race-privacy']
  },
  {
    id: 'rc-06', chapter: 6, title: 'Asynchrone, timeout et erreurs : ne jamais bloquer l’app', section: 'fundamentals',
    summary: 'Attendre une réponse sans figer l’interface et empêcher un résultat périmé de remplacer l’état courant.',
    tags: ['async', 'await', 'Promise', 'timeout', 'AbortController', 'finally', 'réponse périmée'],
    goals: ['Lire une fonction async et ses points d’attente.', 'Limiter une requête avec AbortController.', 'Distinguer annulation réseau et validation du résultat courant.'],
    sections: [
      { title: 'Attendre sans immobiliser la page', body: [
        'Une requête réseau prend un temps variable. async déclare une fonction qui renvoie une promesse ; await suspend la suite de cette fonction jusqu’à la résolution de la promesse. Cette attente permet au navigateur de traiter d’autres événements. Elle ne transforme cependant pas un long calcul JavaScript synchrone en travail exécuté dans un autre thread.',
        'Dans fetchJSON(), l’application attend la réponse HTTP puis le décodage JSON. Le contrôle r.ok distingue un statut de succès d’une erreur HTTP. Une réponse 404 ou 500 ne doit pas devenir une donnée météo valide sous prétexte que fetch a obtenu une réponse réseau.'
      ] },
      { title: 'Un timeout donne une durée maximale', body: [
        'AbortController expose un signal transmis à fetch. Le timer appelle abort() lorsque le délai maximal est atteint. Le délai de 12 000 ms montré par le cours est un exemple pédagogique de son helper, pas une garantie de temps de réponse d’un fournisseur. Le système abandonne l’attente au lieu de laisser un chargement infini.',
        'Le bloc finally exécute son nettoyage si le travail réussit ou échoue. clearTimeout supprime le timer devenu inutile lorsque la requête se termine. Sans cette discipline, des callbacks conservés pourraient déclencher un abandon après la fin du travail et rendre les erreurs plus difficiles à comprendre.'
      ], code: '// Version pédagogique du helper montré dans le cours\nasync function fetchJSON(url, ms) {\n  const ctl = new AbortController();\n  const to = setTimeout(() => ctl.abort(), ms || 12000);\n  try {\n    const r = await fetch(url, { signal: ctl.signal });\n    if (!r.ok) throw new Error("HTTP " + r.status);\n    return await r.json();\n  } finally {\n    clearTimeout(to);\n  }\n}' },
      { title: 'Une bonne réponse peut arriver pour le mauvais trajet', body: [
        'Imagine que l’utilisateur demande le trajet A, puis choisit B avant la réponse. Si A arrive après B et remplace la carte, le résultat est périmé malgré une réponse HTTP correcte. Le cours mentionne une génération et une clé de trajet : elles permettent de vérifier que le résultat appartient encore à la demande courante.',
        'Le dossier précise aussi les conditions d’une route actuelle : même trajet, origine compatible avec le fix GPS, fraîcheur suffisante et météo disponible. La nouvelle route et sa météo basculent ensemble. Afficher la route B avec la météo A mélangerait deux états qui n’ont jamais été calculés comme un ensemble cohérent.'
      ] },
      { title: 'L’échec fait partie du comportement normal', body: [
        'Une erreur réseau, un abandon par timeout et une donnée devenue périmée sont des situations différentes. L’interface doit les traiter avec un état explicite et un secours adapté. Par exemple, une ancienne analyse peut rester visible avec un avertissement avant un retour au planifié ; elle ne doit pas être silencieusement qualifiée d’actuelle.'
      ] }
    ],
    pitfalls: ['Croire que fetch rejette automatiquement toutes les erreurs HTTP.', 'Vérifier seulement la réussite réseau sans vérifier la clé du trajet courant.', 'Afficher une nouvelle route avec la météo calculée pour l’ancienne.'],
    interview: { question: 'Pourquoi un timeout ne suffit-il pas à éviter les réponses périmées ?', answer: 'Il borne une attente, mais une réponse encore dans le délai peut concerner une ancienne demande. Il faut aussi comparer génération, clé et contexte avant d’appliquer le résultat, puis conserver la cohérence route–météo.' },
    exercise: { prompt: 'La requête A commence avant B, mais se termine après B. Quelle réponse peut mettre à jour l’écran et pourquoi finally reste-t-il utile pour A ?', answer: 'Seule celle dont la clé et la génération correspondent encore à la demande courante peut être appliquée : ici B. A doit être ignorée si elle est obsolète. Son finally nettoie tout de même son timer, même si son résultat ne sera jamais affiché.' },
    sources: [{ id: 'course-prod15', pages: '10–11' }, { id: 'dossier-prod15', pages: '6, 23' }],
    related: ['programming', 'http-tls', 'race-tests']
  },
  {
    id: 'rc-07', chapter: 7, title: 'Git et GitHub : commit, branche, PR, SHA et merge', section: 'devsecops',
    summary: 'Comprendre ce qui est revu, testé et intégré, et pourquoi la preuve doit porter sur le SHA exact.',
    tags: ['Git', 'GitHub', 'commit', 'branche', 'PR', 'SHA', 'merge', 'tag'],
    goals: ['Définir commit, branche, PR et tag.', 'Relier une CI à la version précise qu’elle vérifie.', 'Distinguer proposition de changement, fusion et publication.'],
    sections: [
      { title: 'Les mots décrivent des objets différents', body: [
        'Git suit l’évolution d’un dépôt de code. Un commit est une version cohérente enregistrée avec un identifiant SHA. Une branche est une ligne de travail qui pointe vers des commits. Elle permet de préparer une modification sans l’intégrer immédiatement à main, la branche de référence du projet.',
        'Une pull request, ou PR, présente une proposition de fusion sur GitHub : elle contient notamment un diff, une discussion et des contrôles. Le diff montre les changements. Le merge intègre le travail à la branche cible. Un tag est une étiquette attachée à une version ; les tags prod-N servent dans le projet de repères de publication et de retour arrière.'
      ] },
      { title: 'Une chaîne de contrôle avant main', body: [
        'Le cours décrit une branche dédiée, des commits, une PR, les contrôles Chromium/WebKit et confidentialité, une revue, des corrections éventuelles, puis une vérification du nouveau SHA. La fusion est une action distincte qui intervient après validation. Ensuite, la CI de main et le déploiement contrôlé établissent ce qui est réellement publié.',
        'Dans le dossier prod-15, main constitue aussi une frontière de confiance pour l’Environment de production. Le code proposé en PR est traité avec des contrôles adaptés, sans lui donner automatiquement les capacités des workflows de production. Cette différence relie les gestes Git à la sécurité du pipeline.'
      ], code: 'Branche → commits → PR\n  → CI Chromium + WebKit + confidentialité\n  → revue → corrections éventuelles\n  → CI du SHA exact\n  → fusion autorisée → CI main → publication contrôlée' },
      { title: 'Le vert appartient à un commit', body: [
        'Une CI verte prouve que les contrôles exécutés ont réussi pour une version précise et dans leur périmètre. Si deux nouveaux commits sont ajoutés après le vert, ce vert n’établit pas le comportement du nouveau HEAD. Il faut vérifier le run attaché au SHA actuel et relire les changements qui ont été ajoutés.',
        'La même logique concerne une revue : un avis sur un ancien diff ne couvre pas automatiquement du code ajouté ensuite. Quand plusieurs PR modifient un point d’intégration commun, leurs tests isolés ne suffisent pas à prouver la combinaison. Le code réellement destiné à la fusion doit être construit et contrôlé comme un ensemble.'
      ] },
      { title: 'Déploiement et rollback restent traçables', body: [
        'Le dossier montre une publication après contrôles et une vérification du hash du fichier en ligne. Le rollback récupère une version taguée, repasse les contrôles et reconstruit les fichiers applicatifs. Il ne consiste pas à effacer arbitrairement l’historique ou les données récentes du relais. Un retour arrière reste ainsi une opération auditée.'
      ] }
    ],
    pitfalls: ['Assimiler PR ouverte, PR fusionnée et version déployée.', 'Annoncer une CI finale verte à partir d’un ancien SHA.', 'Considérer deux PR vertes isolément comme une preuve de leur intégration.'],
    interview: { question: 'Quelle preuve demandes-tu avant de considérer une PR prête ?', answer: 'Le SHA exact du HEAD, son diff actuel, les jobs obligatoires terminés sur cette version et une revue correspondant à ces changements. Une proposition prête reste distincte de l’autorisation de fusionner ou de déployer.' },
    exercise: { prompt: 'Un rapport donne le SHA A avec CI verte. GitHub affiche désormais le SHA B après une correction. Le rapport est-il suffisant ?', answer: 'Non. Il décrit une preuve sur A. Il faut vérifier les contrôles et le diff de B, puis mettre à jour le rapport avec le SHA exact et les résultats réellement terminés pour cette version.' },
    sources: [{ id: 'course-prod15', pages: '11–12, 36–37' }, { id: 'dossier-prod15', pages: '19' }],
    related: ['git', 'cicd', 'race-cicd', 'race-tests']
  },
  {
    id: 'rc-08', chapter: 8, title: 'Build : comment les sources deviennent index.html', section: 'devsecops',
    summary: 'Suivre l’assemblage des sources jusqu’à un artefact statique reproductible et publiable.',
    tags: ['build', 'artefact', 'index.html', 'GitHub Pages', 'npm ci', 'sources'],
    goals: ['Distinguer fichiers source et artefacts déployés.', 'Comprendre l’ordre de chargement des modules.', 'Relier reproductibilité, CI et contrôle des sources.'],
    sections: [
      { title: 'Les pièces, l’atelier et le produit terminé', body: [
        'Les fichiers src/ sont les pièces du projet. tools/build.js est l’atelier qui les assemble ; dist/ contient le résultat prêt à publier. Un build est la transformation des sources en artefacts déployables. Un artefact peut être un fichier HTML final ou un ensemble incluant scripts, styles, icônes et manifest.',
        'Dans Race Control prod-15, le build combine le shell HTML, les styles et plusieurs fichiers JavaScript. GitHub Pages sert ensuite des fichiers statiques. Le fait d’utiliser Node.js pour fabriquer ces fichiers ne signifie pas qu’un serveur Node exécute l’interface pour chaque visiteur. Le relais Node a, lui, sa propre exécution dans GitHub Actions.'
      ] },
      { title: 'L’ordre est une dépendance concrète', body: [
        'L’extrait source concatène engine.js, demo.js, wardrobe.js et app.js. engine.js doit être disponible avant que l’interface appelle les fonctions du moteur. wardrobe.js doit aussi précéder les appels de rendu de la tenue. Un assemblage dans un ordre différent peut produire un fichier valide en syntaxe mais défaillant au moment de l’exécution.',
        'Cette liste représente l’instantané prod-15 fourni. Lorsqu’un projet ajoute un nouveau moteur, la liste de build et les points d’intégration doivent évoluer ensemble. Il serait incorrect de prendre une ancienne liste documentaire comme preuve que tous les modules d’une version future ont été intégrés.'
      ], code: '// Ordre réel montré par le support prod-15\nconst js = [\n  r("src/engine.js"),\n  r("src/demo.js"),\n  r("src/wardrobe.js"),\n  r("src/app.js")\n].join("\\n");' },
      { title: 'Reconstruire la même application', body: [
        'Un build reproductible permet à la CI de fabriquer l’application à partir des sources connues et de tester cet artefact avant publication. Le lockfile fixe les versions de dépendances ; npm ci installe les dépendances attendues par ce fichier. Cela réduit les différences entre une machine locale et une exécution automatisée.',
        'Le dossier précise que le build public peut être réalisé à partir des fichiers chiffrés sans injecter un secret dans le bundle. Un secret utile au relais n’a pas à devenir une constante JavaScript publique. La reproductibilité concerne l’assemblage du produit ; elle ne justifie jamais de publier des configurations déchiffrées.'
      ], code: '# Commandes du projet Race Control décrites dans le cours\nnpm ci\nnode tools/build.js\nnode tests/run-ci.js\nBROWSER=webkit node tests/run-ci.js' },
      { title: 'Prouver le lien entre source et production', body: [
        'Le workflow sources-check documenté reconstruit sans secrets et compare les artefacts avec la production. Le déploiement vérifie aussi le hash de index.html en ligne. Ces vérifications rendent détectable un écart entre code revu et code servi. Corriger seulement le fichier final casserait cette traçabilité si les sources produisent encore l’ancienne erreur.'
      ] }
    ],
    pitfalls: ['Modifier l’artefact publié sans corriger le fichier source qui le génère.', 'Confondre outil de build Node.js et serveur Node.js en production.', 'Oublier un module dans l’assemblage lors de l’intégration de plusieurs fonctions.'],
    interview: { question: 'À quoi sert un build reproductible dans une CI ?', answer: 'Il relie une version de sources et ses dépendances à un artefact que la CI peut reconstruire et tester avant publication. Cela permet de vérifier que le produit servi correspond au code revu, sans incorporer de secret dans les fichiers publics.' },
    exercise: { prompt: 'Un nouveau module est appelé par app.js mais absent de la liste d’assemblage. Quelle correction est nécessaire et quelle preuve faut-il obtenir ?', answer: 'Ajouter le module avant ses utilisateurs selon ses dépendances, reconstruire l’artefact puis tester le produit assemblé. Une vérification de syntaxe seule ne prouve pas que les fonctions appelées sont disponibles à l’exécution.' },
    sources: [{ id: 'course-prod15', pages: '12, 36–37' }, { id: 'dossier-prod15', pages: '5, 19' }],
    related: ['cicd', 'git', 'supply', 'race-cicd']
  },
  {
    id: 'rc-09', chapter: 9, title: 'PWA, service worker, cache et mode hors ligne', section: 'fundamentals',
    summary: 'Comprendre ce que le cache permet hors réseau, ses limites pour la météo et les restrictions de l’iPhone.',
    tags: ['PWA', 'service worker', 'cache', 'hors ligne', 'network-first', 'iPhone', 'fraîcheur'],
    goals: ['Distinguer shell conservé et météo disponible.', 'Expliquer réseau d’abord et cache en secours.', 'Reconnaître les limites de l’exécution en arrière-plan sur iOS.'],
    sections: [
      { title: 'Une application web installable', body: [
        'Une PWA est une application web qui peut utiliser un manifest, des icônes et un service worker pour proposer une expérience installable et des capacités de cache. Le service worker agit entre certaines demandes de l’application et le réseau. Il peut répondre avec une ressource conservée lorsque le réseau échoue.',
        'Le cours montre un shell contenant notamment index.html, des icônes, le manifest et la base de pneus. Ce pré-cache aide à ouvrir l’interface après une installation réussie. Il ne fabrique pas une prévision météo pour un lieu que l’application n’a jamais chargé et ne remplace pas une réponse fournisseur manquante.'
      ], code: '// Shell illustré dans l’instantané prod-15\nconst C = "twrc-v5";\nconst SHELL = [\n  "./", "./index.html", "./apple-touch-icon.png",\n  "./icon-192.png", "./manifest.webmanifest", "./tiredb.json"\n];' },
      { title: 'Réseau d’abord, cache en secours', body: [
        'La stratégie network-first demande d’abord la ressource au réseau. En cas de succès, une copie peut mettre le cache à jour ; si le réseau échoue, une copie conservée sert de secours. Pour la navigation HTML, le support prod-15 indique cache: no-store afin de favoriser la version publiée plutôt qu’une ancienne réponse du cache HTTP.',
        'Le dossier distingue cette stratégie des polices, qui utilisent cache-first : leur copie locale est préférée. Les noms de cache versionnés permettent de remplacer les ressources d’une ancienne version à l’activation. Les détails varient selon l’application ; on ne doit pas copier un nom de cache historique en supposant qu’il convient à tous les sites.'
      ], code: '// Logique simplifiée du cours, sans détail du stockage\nself.addEventListener("fetch", e => {\n  const fresh = e.request.mode === "navigate"\n    ? fetch(e.request, { cache: "no-store" })\n    : fetch(e.request);\n  e.respondWith(\n    fresh.then(r => r)\n         .catch(() => caches.match(e.request))\n  );\n});' },
      { title: 'Au travail sans réseau : afficher ce qui est connu', body: [
        'Le shell disponible hors ligne ne suffit pas à garantir une météo actuelle ailleurs. Une analyse déjà chargée peut être utile si son lieu, sa période et son âge restent visibles. Une route ou une météo jamais obtenue doit rester indisponible. Le dossier attend un état explicite pour les caches anciens et préfère un mode dégradé à un conseil inventé.',
        'Le GPS et Internet sont également deux capacités distinctes. Un téléphone peut obtenir un point alors qu’il ne peut pas demander une nouvelle route ou météo. Ce point ne rend pas automatiquement fiable une analyse calculée pour un autre lieu. À la reprise du réseau, la fraîcheur et la cohérence des données doivent être réévaluées.'
      ] },
      { title: 'L’iPhone impose une limite d’arrière-plan', body: [
        'Une PWA fermée sur iOS ne peut pas promettre du JavaScript et du GPS continus sans restriction. L’architecture prod-15 confie le planifié au relais cloud et le contexte réel à l’application au premier plan. Le dossier classe un renforcement Background & Resume parmi les travaux futurs de cet instantané, notamment reprise de visibilité, retour réseau et âge des données ; cela ne prouve pas leur livraison.'
      ] }
    ],
    pitfalls: ['Confondre ouverture hors ligne du shell et météo fraîche pour tous les lieux.', 'Promettre un suivi GPS permanent lorsque la PWA iPhone est fermée.', 'Présenter une donnée ancienne ou d’un autre lieu comme actuelle.'],
    interview: { question: 'Que peux-tu promettre avec le service worker décrit dans les supports ?', answer: 'Une ouverture de certaines ressources déjà mises en cache et un secours lorsque le réseau échoue. Je distingue ce shell des données météo externes et j’affiche leurs limites de fraîcheur. Le travail cloud planifié appartient au relais, pas à un GPS continu de PWA fermée.' },
    exercise: { prompt: 'L’interface s’ouvre sans réseau au travail. La météo d’un rendez-vous lointain n’a jamais été chargée. Quel état doit-elle présenter ?', answer: 'La météo locale de ce rendez-vous doit rester non disponible, avec une indication du manque de réseau. La météo du domicile ou une ancienne route ne constitue pas un substitut fiable. Une donnée conservée ne peut être utilisée qu’en identifiant son lieu, sa période et son âge.' },
    sources: [{ id: 'course-prod15', pages: '13' }, { id: 'dossier-prod15', pages: '18, 23' }],
    related: ['web-stack', 'http-tls', 'race-arch', 'race-privacy']
  }
];
