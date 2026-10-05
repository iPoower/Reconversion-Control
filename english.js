"use strict";

const RC_ENGLISH = {
  "rc-01": {
    title: "Race Control at a glance",
    summary: "Understand how Race Control turns weather, route and tyre data into an explainable decision aid.",
    phrase: "Race Control combines context, deterministic rules and clear evidence before giving a recommendation.",
    phraseFr: "Race Control combine le contexte, des règles déterministes et des preuves claires avant de donner une recommandation.",
    vocab: [["decision aid","aide à la décision"],["data flow","flux de données"],["deterministic rule","règle déterministe"],["evidence","preuve"]],
    question: "How would you explain Race Control to a recruiter in one minute?"
  },
  "rc-02": {
    title: "Repository map: who does what?",
    summary: "Find the layer responsible for a symptom before changing the project code.",
    phrase: "Before fixing a bug, I identify which layer owns the faulty behavior.",
    phraseFr: "Avant de corriger un bug, j’identifie la couche responsable du comportement défaillant.",
    vocab: [["repository","dépôt"],["responsibility","responsabilité"],["codebase","base de code"],["root cause","cause racine"]],
    question: "How do you decide which file or layer should be investigated first?"
  },
  "rc-03": {
    title: "HTML, CSS and JavaScript: the three visible layers",
    summary: "Separate structure, presentation and behavior in a web interface.",
    phrase: "HTML provides structure, CSS controls presentation, and JavaScript handles behavior.",
    phraseFr: "HTML fournit la structure, CSS contrôle la présentation et JavaScript gère le comportement.",
    vocab: [["structure","structure"],["presentation","présentation"],["behavior","comportement"],["accessibility","accessibilité"]],
    question: "What is the role of HTML, CSS and JavaScript in a web application?"
  },
  "rc-04": {
    title: "JavaScript basics with real Race Control code",
    summary: "Understand variables, objects, functions and conditions from the live trip state.",
    phrase: "A function takes inputs, applies logic and returns a result.",
    phraseFr: "Une fonction reçoit des entrées, applique une logique et renvoie un résultat.",
    vocab: [["variable","variable"],["object","objet"],["function","fonction"],["condition","condition"]],
    question: "Can you explain the difference between a variable, an object and a function?"
  },
  "rc-05": {
    title: "HTTP, APIs and JSON: how the app talks to the outside world",
    summary: "Connect a network request, a JSON response and an internal data model.",
    phrase: "The application sends an HTTP request and converts the JSON response into a stable internal model.",
    phraseFr: "L’application envoie une requête HTTP et transforme la réponse JSON en un modèle interne stable.",
    vocab: [["request","requête"],["response","réponse"],["endpoint","point d’accès API"],["fallback","solution de repli"]],
    question: "What happens between an API request and the data displayed in the interface?"
  },
  "rc-06": {
    title: "Async code, timeouts and errors: never freeze the app",
    summary: "Wait for remote data without blocking the interface or accepting stale results.",
    phrase: "A timeout prevents the application from waiting forever for a remote service.",
    phraseFr: "Un timeout empêche l’application d’attendre indéfiniment un service distant.",
    vocab: [["asynchronous","asynchrone"],["timeout","délai d’expiration"],["abort","annuler"],["stale response","réponse périmée"]],
    question: "Why do asynchronous requests need timeouts and cancellation?"
  },
  "rc-07": {
    title: "Git and GitHub: commit, branch, PR, SHA and merge",
    summary: "Understand what is reviewed, tested and merged, and why the exact SHA matters.",
    phrase: "The tested commit SHA must match the code that is actually merged and deployed.",
    phraseFr: "Le SHA du commit testé doit correspondre au code réellement fusionné et déployé.",
    vocab: [["commit","commit"],["branch","branche"],["pull request","demande de fusion"],["merge","fusion"]],
    question: "Why is the exact commit SHA important when validating a change?"
  },
  "rc-08": {
    title: "Build: how source files become index.html",
    summary: "Follow source files until they become a reproducible static artifact.",
    phrase: "A reproducible build should generate the same artifact from the same source and dependencies.",
    phraseFr: "Un build reproductible doit générer le même artefact à partir des mêmes sources et dépendances.",
    vocab: [["build","construction"],["artifact","artefact"],["dependency","dépendance"],["reproducible","reproductible"]],
    question: "What makes a build reproducible?"
  },
  "rc-09": {
    title: "PWA, service worker, cache and offline mode",
    summary: "Understand what works offline, what must stay fresh and what iOS restricts.",
    phrase: "A service worker can cache the application shell, but live weather data still requires a network connection.",
    phraseFr: "Un service worker peut mettre en cache le shell de l’application, mais la météo en direct nécessite toujours le réseau.",
    vocab: [["service worker","service worker"],["cache","cache"],["offline","hors ligne"],["freshness","fraîcheur"]],
    question: "What can a PWA keep working offline, and what still needs the network?"
  },
  "rc-10": {
    title: "The hourly weather model",
    summary: "Normalize provider arrays into coherent hourly objects shared by the engines.",
    phrase: "Normalization gives the rest of the application a stable data contract.",
    phraseFr: "La normalisation fournit au reste de l’application un contrat de données stable.",
    vocab: [["normalization","normalisation"],["data contract","contrat de données"],["timestamp","horodatage"],["missing value","valeur manquante"]],
    question: "Why should weather data be normalized before business rules use it?"
  },
  "rc-11": {
    title: "Estimating road surface temperature",
    summary: "Understand a deterministic thermal estimate, its inputs, bounds and limitations.",
    phrase: "An estimated road temperature is a model output, not a measured observation.",
    phraseFr: "Une température de chaussée estimée est la sortie d’un modèle, pas une mesure observée.",
    vocab: [["road surface","chaussée"],["estimate","estimation"],["thermal inertia","inertie thermique"],["measurement","mesure"]],
    question: "How would you explain the difference between an estimate and a measurement?"
  },
  "rc-12": {
    title: "Calculating black-ice risk",
    summary: "Combine cold, moisture and refreezing mechanisms into an explainable score.",
    phrase: "A risk score is not automatically a probability.",
    phraseFr: "Un score de risque n’est pas automatiquement une probabilité.",
    vocab: [["black ice","verglas"],["risk score","score de risque"],["moisture","humidité"],["refreezing","regel"]],
    question: "Why should a risk score not be presented as a probability unless it was calibrated as one?"
  },
  "rc-13": {
    title: "The tyre engine and its score",
    summary: "Understand explained penalties and the worst segment of a route.",
    phrase: "The recommendation must explain which conditions caused each penalty.",
    phraseFr: "La recommandation doit expliquer quelles conditions ont provoqué chaque pénalité.",
    vocab: [["tyre","pneu"],["penalty","pénalité"],["grip","adhérence"],["worst segment","segment le plus défavorable"]],
    question: "How does an explainable tyre score differ from a black-box score?"
  },
  "rc-14": {
    title: "Summer and winter tyre season logic",
    summary: "Anticipate a multi-day tyre transition without treating 7°C as an absolute physical switch.",
    phrase: "A seasonal threshold is a decision aid, not a law of physics.",
    phraseFr: "Un seuil saisonnier est une aide à la décision, pas une loi physique.",
    vocab: [["seasonal threshold","seuil saisonnier"],["winter tyre","pneu hiver"],["forecast","prévision"],["transition","transition"]],
    question: "Why should tyre season decisions use trends instead of a single temperature threshold?"
  },
  "rc-15": {
    title: "iCal calendar, recurrence and geocoding",
    summary: "Expand calendar occurrences and geocode places without assuming every event is a trip.",
    phrase: "A calendar event is context, not proof that a physical trip will happen.",
    phraseFr: "Un événement d’agenda est un contexte, pas une preuve qu’un trajet physique aura lieu.",
    vocab: [["recurrence","récurrence"],["occurrence","occurrence"],["geocoding","géocodage"],["calendar event","événement d’agenda"]],
    question: "Why must the application distinguish a calendar event from an actual trip?"
  },
  "rc-16": {
    title: "Building a chain of trips",
    summary: "Turn successive appointments into coherent legs with precise departure and arrival meanings.",
    phrase: "Each leg needs a clear origin, destination, departure time and arrival time.",
    phraseFr: "Chaque segment a besoin d’une origine, d’une destination, d’une heure de départ et d’une heure d’arrivée claires.",
    vocab: [["trip leg","segment de trajet"],["origin","origine"],["destination","destination"],["buffer","marge"]],
    question: "What information is required to build a reliable chain of trips?"
  },
  "rc-17": {
    title: "Sampling weather along a route",
    summary: "Match route points with passage times and identify the most difficult weather point.",
    phrase: "Route weather must follow where the vehicle will be, not only the weather at home.",
    phraseFr: "La météo du trajet doit suivre l’endroit où sera le véhicule, pas seulement la météo du domicile.",
    vocab: [["sampling","échantillonnage"],["route point","point de trajet"],["passage time","heure de passage"],["critical point","point critique"]],
    question: "Why is destination weather alone insufficient for a long trip?"
  },
  "rc-18": {
    title: "Live GPS and the state machine",
    summary: "Use reliable position and confirmed movement to drive live-trip state transitions.",
    phrase: "A state machine makes allowed transitions explicit instead of scattering conditions everywhere.",
    phraseFr: "Une machine à états rend les transitions autorisées explicites au lieu de disperser les conditions partout.",
    vocab: [["state machine","machine à états"],["transition","transition"],["location accuracy","précision de localisation"],["arrival","arrivée"]],
    question: "What problem does a state machine solve in live trip tracking?"
  },
  "rc-19": {
    title: "Adaptive departure and route-weather atomicity",
    summary: "Recalculate from the real position without mixing a new route with old-route weather.",
    phrase: "Route and weather updates must be committed together so the interface never combines incompatible generations.",
    phraseFr: "Les mises à jour route et météo doivent être validées ensemble afin que l’interface ne mélange jamais des générations incompatibles.",
    vocab: [["atomic update","mise à jour atomique"],["race condition","condition de concurrence"],["generation","génération"],["stale data","données périmées"]],
    question: "What could happen if a new route is displayed with weather from the previous route?"
  },
  "rc-20": {
    title: "Waze: delegate navigation instead of rebuilding it",
    summary: "Create an intentional navigation deep link while limiting shared precision.",
    phrase: "Race Control prepares the decision; Waze remains responsible for turn-by-turn navigation.",
    phraseFr: "Race Control prépare la décision ; Waze reste responsable de la navigation virage par virage.",
    vocab: [["deep link","lien profond"],["turn-by-turn","guidage virage par virage"],["delegate","déléguer"],["precision","précision"]],
    question: "Why is delegating navigation to Waze better than rebuilding a navigation engine?"
  },
  "rc-21": {
    title: "Outfit advice: a separate deterministic engine",
    summary: "Reuse weather already in memory for testable clothing advice with a separate pure engine.",
    phrase: "A pure decision engine is easier to test because the same inputs produce the same outputs.",
    phraseFr: "Un moteur de décision pur est plus facile à tester car les mêmes entrées produisent les mêmes sorties.",
    vocab: [["outfit","tenue"],["pure function","fonction pure"],["deterministic","déterministe"],["partial data","données partielles"]],
    question: "Why should outfit logic be separated from the user interface?"
  },
  "rc-22": {
    title: "The GitHub Actions cloud relay",
    summary: "Understand what the relay can prepare while the iPhone is closed and what it cannot know.",
    phrase: "The cloud relay can process scheduled data, but it does not continuously know the phone's live GPS position.",
    phraseFr: "Le relais cloud peut traiter les données planifiées, mais il ne connaît pas en continu la position GPS réelle du téléphone.",
    vocab: [["cloud relay","relais cloud"],["scheduled job","tâche planifiée"],["runner","machine d’exécution"],["availability","disponibilité"]],
    question: "What can the cloud relay do while the application is closed?"
  },
  "rc-23": {
    title: "Encryption: AES-GCM, PBKDF2 and key separation",
    summary: "Separate key derivation, authenticated encryption and secret separation.",
    phrase: "Encryption protects confidentiality, while authentication also detects tampering.",
    phraseFr: "Le chiffrement protège la confidentialité, tandis que l’authentification détecte aussi les modifications.",
    vocab: [["key derivation","dérivation de clé"],["authenticated encryption","chiffrement authentifié"],["salt","sel"],["tampering","altération"]],
    question: "What are the different roles of PBKDF2 and AES-GCM?"
  },
  "rc-24": {
    title: "Privacy: what stays local and what leaves the device",
    summary: "Trace data by precision, destination and retention before making privacy claims.",
    phrase: "Privacy starts with data minimization and a clear understanding of where every field goes.",
    phraseFr: "La confidentialité commence par la minimisation des données et une compréhension claire de la destination de chaque champ.",
    vocab: [["data minimization","minimisation des données"],["retention","conservation"],["local data","donnée locale"],["data exposure","exposition des données"]],
    question: "How would you perform a simple privacy review of a feature?"
  },
  "rc-25": {
    title: "Testing: unit, E2E, Chromium, WebKit and negative tests",
    summary: "Choose the right proof and verify that tests can detect incorrect behavior.",
    phrase: "A useful test must fail when the behavior is wrong, not only pass when everything is correct.",
    phraseFr: "Un test utile doit échouer lorsque le comportement est incorrect, pas seulement réussir lorsque tout va bien.",
    vocab: [["unit test","test unitaire"],["end-to-end test","test de bout en bout"],["fixture","jeu de données de test"],["negative test","contre-test"]],
    question: "How do you know that a test actually protects against a regression?"
  },
  "rc-26": {
    title: "CI/CD: from pull request to production",
    summary: "Connect review, automated checks, build and the exact version served online.",
    phrase: "A deployment gate prevents unverified code from reaching production.",
    phraseFr: "Une barrière de déploiement empêche du code non vérifié d’atteindre la production.",
    vocab: [["pipeline","pipeline"],["deployment gate","barrière de déploiement"],["continuous integration","intégration continue"],["production","production"]],
    question: "What should happen between opening a pull request and deploying to production?"
  },
  "rc-27": {
    title: "Rollback and versioning",
    summary: "Return to known-good code without deleting fresh data produced by the relay.",
    phrase: "A rollback restores a known-good application version while preserving data that should remain current.",
    phraseFr: "Un rollback restaure une version applicative connue comme saine tout en préservant les données qui doivent rester à jour.",
    vocab: [["rollback","retour arrière"],["known-good version","version connue comme saine"],["release","version publiée"],["versioning","gestion de versions"]],
    question: "What should a safe rollback restore, and what should it preserve?"
  },
  "rc-28": {
    title: "DevSecOps incident: how a test exposed data",
    summary: "Understand why the trust boundary between pull-request code and real secrets matters.",
    phrase: "Untrusted pull-request code must never receive production secrets.",
    phraseFr: "Du code de pull request non fiable ne doit jamais recevoir de secrets de production.",
    vocab: [["trust boundary","frontière de confiance"],["secret","secret"],["untrusted code","code non fiable"],["exposure","exposition"]],
    question: "Why is running untrusted pull-request code with secrets dangerous?"
  },
  "rc-29": {
    title: "Debugging Race Control methodically",
    summary: "Turn a symptom into a reproduction, a root cause, a fix and proof on the real commit.",
    phrase: "I reproduce the bug first, identify the root cause, apply the smallest safe fix and verify the exact commit.",
    phraseFr: "Je reproduis d’abord le bug, j’identifie la cause racine, j’applique le correctif minimal sûr et je vérifie le commit exact.",
    vocab: [["reproduction","reproduction"],["root cause","cause racine"],["regression","régression"],["verification","vérification"]],
    question: "Walk me through your debugging process from symptom to verified fix."
  },
  "rc-30": {
    title: "Technical debt, refactoring and maintainability",
    summary: "Extract responsibilities gradually and evaluate providers, failures and operational trade-offs.",
    phrase: "Refactoring changes the structure of code without intentionally changing its behavior.",
    phraseFr: "Le refactoring modifie la structure du code sans modifier volontairement son comportement.",
    vocab: [["technical debt","dette technique"],["refactoring","refactorisation"],["maintainability","maintenabilité"],["observability","observabilité"]],
    question: "How do you decide whether a refactor is worth doing now?"
  },
  "rc-31": {
    title: "Presenting the project in an interview",
    summary: "Build an honest pitch and explain a bug, its evidence and its trade-offs.",
    phrase: "I can explain what I built, what I learned, what failed and how I proved the fix.",
    phraseFr: "Je peux expliquer ce que j’ai construit, ce que j’ai appris, ce qui a échoué et comment j’ai prouvé le correctif.",
    vocab: [["portfolio","portfolio"],["trade-off","compromis"],["evidence","preuve"],["ownership","prise en charge"]],
    question: "Can you present one difficult Race Control problem using situation, action and result?"
  },
  "rc-32": {
    title: "Review exercises, answers and glossary",
    summary: "Check your understanding of the complete flow with questions, checkpoints and technical vocabulary.",
    phrase: "If I can explain a concept clearly in both French and English, I probably understand it more deeply.",
    phraseFr: "Si je peux expliquer clairement un concept en français et en anglais, je le comprends probablement plus profondément.",
    vocab: [["review","révision"],["checkpoint","point de contrôle"],["glossary","glossaire"],["fluency","aisance"]],
    question: "Which Race Control concept can you now explain confidently in English?"
  }
};

function rcEnglishText(value){
  if(typeof value === "string") return value;
  if(Array.isArray(value)) return value.map(rcEnglishText).join(" ");
  if(value && typeof value === "object") return Object.keys(value).map(function(key){return rcEnglishText(value[key]);}).join(" ");
  return "";
}

const RC_ENGLISH_TEXT = Object.create(null);
Object.keys(RC_ENGLISH).forEach(function(id){RC_ENGLISH_TEXT[id]=rcEnglishText(RC_ENGLISH[id]);});
