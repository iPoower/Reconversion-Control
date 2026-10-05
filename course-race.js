// Adaptations pédagogiques des supports fournis, instantané prod-15.
// Les exemples sont fictifs et ces cours ne contiennent aucune configuration personnelle.
const RC_COURSE_RACE = [
  {
    id: 'rc-10', chapter: 10, section: 'portfolio',
    title: 'Le modèle météo horaire',
    summary: 'Transformer les tableaux d’un fournisseur météo en objets horaires cohérents que les moteurs peuvent partager.',
    tags: ['météo', 'JSON', 'normalisation', 'buildHours', 'données manquantes'],
    goals: ['Lire un modèle horaire et relier chaque valeur à son instant.', 'Séparer données fournisseur, données normalisées et valeurs calculées.'],
    sections: [
      { title: 'Des tiroirs séparés à une fiche par heure', body: [
        'Une API météo peut envoyer un tableau d’heures, un tableau de températures et un tableau de rafales. L’élément numéro 4 de chaque tableau doit décrire la même heure. Imagine un dossier dont les pages ont été réparties dans plusieurs tiroirs : buildHours() reconstitue une fiche complète pour chaque instant.',
        'Dans engine.js, cette normalisation crée notamment t pour l’horodatage, date pour le jour, hh pour l’heure, T pour la température de l’air, RH pour l’humidité relative, Td pour le point de rosée, Tapp pour le ressenti, P pour la précipitation, snow pour la neige, vis pour la visibilité, wind pour le vent et gust pour les rafales.'
      ], code: "const hs = t.map((ts, i) => ({\n  t: ts,\n  date: ts.slice(0, 10),\n  hh: +ts.slice(11, 13),\n  T: g('temperature_2m', i),\n  Tapp: g('apparent_temperature', i),\n  P: g('precipitation', i),\n  gust: g('wind_gusts_10m', i)\n}));" },
      { title: 'Un contrat interne stable', body: [
        'Le reste du programme consulte x.T ou x.gust au lieu de connaître les noms et positions de tous les tableaux externes. Si le fournisseur change son JSON, la correction peut se concentrer sur cette couche d’adaptation. C’est un contrat de données : le moteur métier s’appuie sur une structure interne dont les champs ont une signification connue.',
        'Le dossier décrit aussi des champs de code météo, pression, nuages, radiation et UV, ainsi qu’une fusion possible avec une variante Météo-France seamless. Fusionner deux sources exige de conserver la correspondance des heures et des unités ; juxtaposer des tableaux de longueur identique ne prouve pas qu’ils parlent du même instant.'
      ] },
      { title: 'Observation, prévision et estimation', body: [
        'Le modèle horaire est ensuite enrichi : Tr représente une température de chaussée estimée et ice un risque de verglas calculé. Ces résultats ne deviennent pas des observations simplement parce qu’ils figurent dans le même objet que la température. Une interface correcte conserve le statut de chaque information : prévue, observée ou estimée.',
        'Une valeur absente ne signifie pas zéro. Une précipitation inconnue ne permet pas d’affirmer que la route est sèche. Dans un test fictif, prépare deux heures avec des températures différentes, puis vérifie que chaque rafale reste associée à son heure et qu’un champ absent ne reçoit pas une certitude artificielle.'
      ] }
    ],
    pitfalls: ['Confondre l’index d’un tableau avec une preuve d’alignement temporel entre fournisseurs.', 'Afficher Tr comme une température de route mesurée.', 'Remplacer systématiquement les données inconnues par zéro.'],
    interview: { question: 'Pourquoi normaliser les données avant de calculer un conseil ?', answer: 'La normalisation isole le format externe et fournit un contrat métier stable. Elle centralise les contrôles d’heures, de champs et d’unités, puis permet aux moteurs pneus et Tenue de réutiliser le même contexte.' },
    exercise: { prompt: 'Une API change temperature_2m en air_temperature. Quelle couche modifier, et quels contrôles conserver ?', answer: 'Adapter l’extraction dans la normalisation. Vérifier que les températures gardent la bonne unité et correspondent aux bons horodatages, puis vérifier les résultats métier sans changer arbitrairement leurs règles.' },
    sources: [{ id: 'course-prod15', pages: '13–14' }, { id: 'dossier-prod15', pages: '7' }],
    related: ['formats', 'programming', 'race-arch']
  },
  {
    id: 'rc-11', chapter: 11, section: 'portfolio',
    title: 'Estimer la température de chaussée',
    summary: 'Comprendre une estimation thermique déterministe, ses facteurs, ses bornes et la différence avec une mesure.',
    tags: ['chaussée', 'estRoad', 'inertie', 'heuristique', 'estimation'],
    goals: ['Expliquer pourquoi la route et l’air peuvent avoir des températures différentes.', 'Lire une moyenne pondérée et identifier les limites d’un modèle.'],
    sections: [
      { title: 'La route garde la mémoire de la chaleur', body: [
        'Une chaussée ne suit pas instantanément la température de l’air. Elle a une inertie thermique : le refroidissement ou le réchauffement récent continue à compter. estRoad() commence par combiner l’heure courante et les cinq heures précédentes avec les poids 0,40 ; 0,25 ; 0,15 ; 0,10 ; 0,06 ; 0,04. Les informations les plus récentes ont le plus d’influence.',
        'Le calcul additionne chaque température disponible multipliée par son poids, puis divise par la somme des poids réellement utilisés. Ce dénominateur compte : si une ancienne heure manque, il faut raisonner sur les contributions disponibles plutôt que considérer l’absence comme une température de 0 °C.'
      ], code: 'const w = [0.40, 0.25, 0.15, 0.10, 0.06, 0.04];\nlet s = 0, ws = 0;\nfor (let k = 0; k < w.length; k++) {\n  const y = hs[i - k];\n  if (y && y.T != null) {\n    s += w[k] * y.T;\n    ws += w[k];\n  }\n}\nconst Tb = s / ws; // extrait : base thermique' },
      { title: 'Corriger la base thermique', body: [
        'Le soleil peut chauffer la route au-dessus de l’air. Le gain dépend du rayonnement et il est modulé par le vent ; dans l’extrait prod-15, la correction solaire utilise un facteur 7,5 et réduit le gain lorsque la chaussée est mouillée. La nuit, un ciel clair favorise une perte radiative, tandis que les nuages et le vent modifient cet effet.',
        'Le modèle tient également compte de l’humidité, de l’évaporation et de la neige. Quand la neige est présente au-delà du seuil 0,05 montré dans l’extrait, Tr est ramenée au maximum à T + 0,2 avant la borne finale. Ce sont des règles empiriques lisibles, pas une simulation physique exhaustive de tous les revêtements.'
      ] },
      { title: 'Des garde-fous et une limite produit', body: [
        'La borne finale conserve Tr entre T − 4 et T + 9 °C. Le moteur évite ainsi certains résultats extrêmes de son heuristique. Une borne améliore la stabilité du modèle mais ne prouve pas que la route réelle a exactement cette température : ponts, ombre locale et propriétés du revêtement ne deviennent pas des mesures connues.',
        'Les observations METAR peuvent améliorer le contexte météorologique local. Elles ne sont toujours pas des sondes plantées dans la chaussée. Dans le cockpit et une notification, le mot « estimée » fait partie de la qualité de l’information. Le supprimer rendrait le résultat plus certain qu’il ne l’est.'
      ] },
      { title: 'Archive prod-8 : incertitude et tendance', body: [
        'La fiche historique prod-8 présente une bande d’incertitude de ±2 °C autour de la chaussée estimée. Le message dépend de toute la bande : borne haute sous zéro pour une surface sous 0 °C considérée quasi certaine dans cette heuristique, borne basse sous zéro pour une incertitude de gel, puis borne basse sous 2 °C pour une marge faible. Cette bande reste un repère du modèle, pas un intervalle de confiance statistiquement calibré.',
        'Cette même archive compare une prévision à la consultation précédente : variation de plus de ±20 points de probabilité de pluie, visibilité divisée par deux, variation de plus de ±2 °C de chaussée ou changement de verdict. Une tendance décrit une révision de prévision, pas un relevé de capteur. Ces règles sont citées comme comportements historiques prod-8 ; leur présence actuelle demande de vérifier le code et la version.'
      ] }
    ],
    pitfalls: ['Présenter une formule déterministe comme une mesure physique exacte.', 'Diviser par la somme théorique des poids lorsque certaines heures sont absentes.', 'Interpréter une borne comme une garantie d’absence de verglas.'],
    interview: { question: 'Comment présenter une estimation de chaussée en entretien ?', answer: 'Elle combine une mémoire thermique pondérée et des corrections météorologiques bornées. Je peux expliquer chaque facteur et tester le calcul, tout en précisant que Tr est une estimation utile à la décision et non une observation instrumentée.' },
    exercise: { prompt: 'Avec seulement deux heures disponibles, 4 °C maintenant et 2 °C une heure plus tôt, calcule la base pondérée.', answer: '(0,40 × 4 + 0,25 × 2) / (0,40 + 0,25) = 2,10 / 0,65, soit environ 3,23 °C. Les corrections météo restent ensuite à appliquer ; ce nombre seul n’est pas la température finale de chaussée.' },
    sources: [{ id: 'course-prod15', pages: '14–15' }, { id: 'dossier-prod15', pages: '7' }, { id: 'architecture-fiche', pages: '12–13' }],
    related: ['programming', 'race-arch', 'race-tests']
  },
  {
    id: 'rc-12', chapter: 12, section: 'portfolio',
    title: 'Calculer le risque de verglas',
    summary: 'Associer froid, humidité et mécanismes de regel dans un score expliqué, sans confondre score et probabilité.',
    tags: ['verglas', 'iceRisk', 'score', 'humidité', 'explicabilité'],
    goals: ['Lire les niveaux de risque et leur explication.', 'Distinguer froid sec, eau disponible et précipitation verglaçante annoncée.'],
    sections: [
      { title: 'Du froid et de l’eau', body: [
        'Du froid seul ne décrit pas tous les mécanismes du verglas. iceRisk() combine la température de chaussée estimée avec l’humidité disponible : pluie actuelle ou récente, point de rosée, humidité relative, neige, passage sous 0 °C, refroidissement rapide et certains brouillards froids. Plusieurs signaux peuvent se renforcer.',
        'Dans l’extrait prod-15, P ≥ 0,1 et Tr ≤ 1,5 donnent une contribution d’humidité de 35 ; une précipitation récente cumulée wet6 ≥ 0,3 avec Tr ≤ 1,5 donne 30. Une route estimée proche du point de rosée, Tr ≤ Td + 0,5, avec humidité relative ≥ 75, donne une autre contribution. Ces valeurs appartiennent à ce modèle précis.'
      ] },
      { title: 'Un signal explicite reste prioritaire', body: [
        'Lorsque le code météo annonce pluie ou bruine verglaçante, le moteur retourne directement un score de 100, un niveau 3 et un facteur explicite. Il évite qu’une moyenne de signaux moins inquiétants dilue cette alerte. C’est une règle de priorité métier que l’on peut tester directement avec un objet météo fictif.',
        'Pour les autres cas, le score est borné entre 0 et 100. Dans cet instantané, un score inférieur à 20 correspond au niveau 0, de 20 à 44 au niveau 1, de 45 à 69 au niveau 2 et à partir de 70 au niveau 3. Un score de 70 n’est pas une probabilité scientifique de 70 % : c’est une échelle heuristique utilisée par le produit.'
      ], code: "if (FZ_CODES.has(x.code)) {\n  return {\n    score: 100,\n    level: 3,\n    factors: ['Pluie ou bruine verglaçante annoncée par le modèle']\n  };\n}" },
      { title: 'Rendre la décision vérifiable', body: [
        'La liste factors conserve les causes du résultat. Elle permet d’expliquer une alerte et de vérifier qu’une hausse de score provient bien de la pluie récente ou du passage sous zéro. Sans cette liste, un nombre peut sembler précis tout en restant opaque à l’utilisateur comme au développeur.',
        'Un bon jeu d’essai compare un froid sec fictif à un froid humide avec des données suffisamment connues, teste le code de précipitation verglaçante et contrôle les limites de niveau. Ne pas avoir détecté de risque notable dans les entrées disponibles ne garantit pas qu’aucun pont ou secteur ombragé n’est glissant.'
      ] }
    ],
    pitfalls: ['Lire le score comme une probabilité mesurée ou une garantie de sécurité.', 'Moyenner une pluie verglaçante avec des indicateurs rassurants.', 'Retirer les facteurs explicatifs et ne conserver qu’un chiffre.'],
    interview: { question: 'Pourquoi la sortie inclut-elle score, level et factors ?', answer: 'Le score porte le calcul, le niveau permet un affichage et une action cohérents, et les facteurs expliquent le résultat. Cette séparation rend les règles lisibles et les tests capables de vérifier la cause d’une alerte.' },
    exercise: { prompt: 'Une météo fictive annonce explicitement une bruine verglaçante, mais la température d’air paraît peu inquiétante. Quelle sortie doit rester prioritaire ?', answer: 'La règle directe de précipitation verglaçante : score 100, niveau 3 et explication associée dans cet instantané. Une autre donnée favorable ne doit pas diluer ce signal.' },
    sources: [{ id: 'course-prod15', pages: '15–16' }, { id: 'dossier-prod15', pages: '8' }],
    related: ['programming', 'cia-risk', 'race-tests']
  },
  {
    id: 'rc-13', chapter: 13, section: 'portfolio',
    title: 'Le moteur pneus et le score',
    summary: 'Comprendre les pénalités expliquées et la prise en compte du passage le plus défavorable sur un trajet.',
    tags: ['pneus', 'tireAssess', 'windowAssess', 'pénalités', 'pire segment'],
    goals: ['Distinguer danger météo et adéquation d’un pneu.', 'Expliquer pourquoi un trajet ne doit pas moyenner ses passages dangereux.'],
    sections: [
      { title: 'Deux familles de causes', body: [
        'tireAssess() additionne des pénalités plutôt que de décider uniquement à partir d’une température. Une première famille décrit des dangers météo : faible visibilité, fortes rafales, neige, pluie verglaçante ou verglas. Une seconde décrit l’adéquation du pneu : été par froid, comportement hiver par chaleur, compromis quatre saisons, profondeur de sculpture et âge de gomme.',
        'Le dossier cite des paliers de visibilité sous 1 000, 500 et 200 mètres, des rafales pénalisées à partir d’environ 55 km/h, et des effets de pluie modulés par la sculpture. Ce sont des paramètres du modèle prod-15, pas des consignes universelles de conduite. Une route reste exposée au brouillard même si les pneus sont adaptés à la saison.'
      ] },
      { title: 'Une addition que l’on peut expliquer', body: [
        'La fonction auxiliaire add() enregistre un libellé, une valeur arrondie et une catégorie dans parts lorsque la contribution est suffisamment grande. La somme pen sert au calcul, tandis que parts explique ce qui la compose. Cette conception permet de dire ce qui a fait baisser le score au lieu d’afficher seulement un feu de couleur.',
        'Le score final est construit à partir de 100 moins la pénalité retenue, puis borné entre 0 et 100. Des drapeaux de danger peuvent aussi imposer un niveau supérieur. Il faut donc vérifier à la fois la valeur numérique, le verdict et les raisons ; un test qui ne regarde qu’un score peut manquer une erreur dans l’alerte.'
      ], code: "const P = mode === 'trip'\n  ? pMax\n  : (pNow + pMax) / 2;\nlet score = Math.round(clamp(100 - P, 0, 100));" },
      { title: 'Le trajet retient le pire moment', body: [
        'windowAssess() utilise pMax en mode trip. Si quatre points sont agréables et qu’un passage est réellement dangereux, la moyenne des cinq pourrait masquer ce passage. Le choix conservateur consiste à laisser la pénalité maximale conduire l’évaluation du trajet. Il protège l’information importante, sans prétendre mesurer une adhérence de laboratoire.',
        'Dans un exemple fictif, des pénalités de 5, 5 et 65 conduisent à un score numérique de 35 avant les éventuels drapeaux. Une moyenne des pénalités donnerait 75, beaucoup plus rassurant. Cet écart montre pourquoi la méthode d’agrégation fait partie de la règle métier et doit être nommée dans un test.'
      ] }
    ],
    pitfalls: ['Réduire tout le moteur à la règle des 7 °C.', 'Moyenner les passages d’un trajet et masquer un segment critique.', 'Présenter le score comme une mesure d’adhérence ou une autorisation de rouler.'],
    interview: { question: 'Comment justifier le choix de la pénalité maximale pour un trajet ?', answer: 'Un seul passage dangereux peut déterminer le besoin de prudence. Le maximum évite de le diluer parmi des kilomètres favorables ; la liste des pénalités permet ensuite d’expliquer cette décision conservatrice.' },
    exercise: { prompt: 'Pour un trajet fictif, pNow = 10 et pMax = 60. Compare la formule trip et la formule non-trip montrées dans le cours.', answer: 'Trip retient P = 60, donc le score numérique est 40. L’autre formule retient (10 + 60) / 2 = 35, donc 65. Les drapeaux et niveaux doivent aussi être contrôlés séparément.' },
    sources: [{ id: 'course-prod15', pages: '16–17' }, { id: 'dossier-prod15', pages: '9' }],
    related: ['programming', 'race-arch', 'race-tests']
  },
  {
    id: 'rc-14', chapter: 14, section: 'portfolio',
    title: 'La logique saisonnière été / hiver',
    summary: 'Anticiper une transition de pneus sur plusieurs jours sans traiter 7 °C comme une bascule physique absolue.',
    tags: ['saison', 'seasonAnalysis', 'anticipation', 'pneus hiver', 'prévision'],
    goals: ['Séparer décision saisonnière et évaluation immédiate d’un trajet.', 'Lire une fenêtre de prévision et comparer un épisode à une date de montage.'],
    sections: [
      { title: 'Préparer un changement, pas réagir à une minute', body: [
        'Changer de pneus demande une décision logistique : vérifier les équipements et prévoir le montage. seasonAnalysis() regarde les jours à venir plutôt que la seule température au moment où l’application s’ouvre. Le dossier indique une fenêtre de sept jours et la prise en compte d’épisodes plus lointains lorsque les prévisions sont disponibles.',
        'Le repère de 7 °C aide à lire une tendance. Il n’est pas une frontière physique instantanée où une gomme deviendrait subitement bonne ou mauvaise. Le moteur différencie un refroidissement ordinaire des épisodes de neige, gel et verglas et peut comparer ces épisodes à une date de montage déjà prévue.'
      ] },
      { title: 'Lire les conditions sans les généraliser', body: [
        'Dans l’extrait fourni, cold7 compte les jours dont la température minimale est inférieure à 3 °C, tandis que chill7 compte ceux sous 7 °C. Ces compteurs résument une période ; ils ne remplacent pas la détection de phénomènes hivernaux. Un épisode sévère proche peut donc peser plus qu’une longue série de journées simplement fraîches.',
        'Lorsque firstSevere existe avec un décalage off inférieur ou égal à sept jours, l’extrait produit un niveau 3 et le message « Conditions hivernales détectées avant montage ». Sinon, firstSevere ou au moins trois jours cold7 peuvent conduire au niveau 2 « Montage hiver recommandé prochainement ». Ce passage illustre une partie de la fonction, pas l’intégralité de tous ses cas.'
      ], code: "const cold7 = nd.filter(d => d.tmin != null && d.tmin < 3).length;\nconst chill7 = nd.filter(d => d.tmin != null && d.tmin < 7).length;\nif (firstSevere && firstSevere.off <= 7) {\n  level = 3;\n  title = 'Conditions hivernales détectées avant montage';\n}\nelse if (firstSevere || cold7 >= 3) {\n  level = 2;\n  title = 'Montage hiver recommandé prochainement';\n}" },
      { title: 'Deux horizons de décision complémentaires', body: [
        'La recommandation saisonnière sert à préparer les jours à venir. Le score d’un trajet sert à comprendre des conditions rencontrées à des heures et lieux déterminés. Une suggestion de montage ne constitue donc pas une analyse complète du trajet de demain matin, et un trajet calme aujourd’hui ne suffit pas à écarter un épisode hivernal proche.',
        'Pour tester cette logique, utilise une série de minima fictifs et une date de montage contrôlée. Vérifie séparément un refroidissement isolé, plusieurs jours froids et un épisode sévère avant montage. Si les prévisions sont partielles, ne transforme pas les jours absents en minima nuls qui inventeraient un hiver.'
      ] }
    ],
    pitfalls: ['Traiter 7 °C comme une loi universelle ou une coupure instantanée.', 'Confondre alerte saisonnière et verdict détaillé d’un trajet.', 'Compter une température minimale inconnue comme 0 °C.'],
    interview: { question: 'Pourquoi regarder plusieurs jours pour recommander un montage ?', answer: 'Le montage se planifie. Une fenêtre de plusieurs jours permet de distinguer un creux ponctuel d’une tendance et d’identifier un épisode hivernal avant la date prévue, alors que le risque immédiat reste évalué séparément.' },
    exercise: { prompt: 'Une seule matinée est fraîche, puis un épisode neigeux est prévu avant la date de montage. Quel signal doit guider l’anticipation ?', answer: 'L’épisode hivernal avant montage doit rester visible. Une moyenne de températures agréables ne doit pas effacer cet événement ; on distingue ce conseil logistique du verdict précis de chaque trajet.' },
    sources: [{ id: 'course-prod15', pages: '17–18' }, { id: 'dossier-prod15', pages: '9' }],
    related: ['programming', 'race-arch', 'race-tests']
  },
  {
    id: 'rc-15', chapter: 15, section: 'portfolio',
    title: 'Agenda iCal, récurrences et géocodage',
    summary: 'Lire les événements, développer les occurrences puis géocoder les lieux, en distinguant une entrée agenda d’un déplacement.',
    tags: ['agenda', 'iCal', 'récurrence', 'géocodage', 'pasdetrajet', 'EXDATE'],
    goals: ['Expliquer les étapes parsing, récurrence, géocodage et routage.', 'Identifier les limites documentées et éviter de fabriquer une position.'],
    sections: [
      { title: 'Un rendez-vous est d’abord une donnée', body: [
        'Le format iCal décrit des événements. parseIcs() lit DTSTART pour le début, DTEND pour la fin, SUMMARY pour le titre, LOCATION pour le lieu et RRULE pour une règle de récurrence. Le parsing extrait ces informations ; il ne prouve ni que l’utilisateur se déplacera, ni que le lieu possède des coordonnées fiables.',
        'Une tâche comme « préparer le chargeur », une note ou un rappel ne devient pas un trajet parce qu’il figure dans un calendrier. Le déplacement est une interprétation supplémentaire. Dans l’instantané prod-15, les événements sans LOCATION ne sont pas intégrés aux trajets par le relais et #pasdetrajet sert à désactiver l’itinéraire d’un événement.'
      ], code: "if (name === 'DTSTART') cur.start = icsDate(val, params);\nelse if (name === 'DTEND') cur.end = icsDate(val, params);\nelse if (name === 'SUMMARY') cur.title = unesc(val);\nelse if (name === 'LOCATION') cur.loc = unesc(val);" },
      { title: 'Développer les occurrences connues', body: [
        'Le relais ouvre une fenêtre de huit jours. Les récurrences quotidiennes DAILY et hebdomadaires WEEKLY sont développées ; le dossier documente également EXDATE et les occurrences modifiées. Un événement annulé est ignoré. Il faut donc distinguer le modèle récurrent et chaque occurrence réelle dans la fenêtre.',
        'Les récurrences mensuelles complexes ne sont pas prises en charge par le moteur décrit. Cette limite est importante à déclarer : afficher une occurrence inventée serait pire qu’indiquer une capacité manquante. Le dossier indique aussi une convention prod-15 pour les événements sur la journée entière : aller supposé à 09:00 et retour à 18:00 lorsqu’un trajet est pertinent.'
      ] },
      { title: 'Une adresse, puis éventuellement une route', body: [
        'Le géocodage cherche des coordonnées à partir d’une adresse ou d’une ville. Le cours indique GeoPF pour les adresses françaises, puis Open-Meteo Geocoding pour les noms de villes. Si la résolution échoue, le résultat reste nul : aucune coordonnée fictive ne doit transformer une incertitude en itinéraire crédible.',
        'Parsing et géocodage ont des responsabilités, erreurs et fournisseurs différents. Les descriptions sont utilisées pour les marqueurs de routage, sans recopier tout leur texte dans les données publiques. L’agenda préparé est chiffré dans calendar.sealed.json et déchiffré localement. Ces protections ne remplacent pas le besoin de filtrer correctement ce qui représente un déplacement.'
      ] }
    ],
    pitfalls: ['Supposer que toute entrée agenda est un déplacement physique.', 'Déduire des coordonnées du domicile lorsqu’un lieu ne peut pas être résolu.', 'Promettre toutes les récurrences iCal à partir d’un parseur limité à DAILY et WEEKLY.'],
    interview: { question: 'Pourquoi séparer parsing iCal et géocodage ?', answer: 'Le parsing comprend une structure et des dates ; le géocodage interroge un fournisseur pour transformer un lieu en coordonnées. Les isoler permet de tester chaque erreur et de conserver explicitement un lieu inconnu sans fabriquer un trajet.' },
    exercise: { prompt: 'Tu reçois un rappel sans lieu, un rendez-vous géocodé et un événement #pasdetrajet. Lesquels prouvent un itinéraire à calculer ?', answer: 'Le rappel sans lieu et l’événement #pasdetrajet ne doivent pas produire d’itinéraire. Le rendez-vous géocodé peut participer à la planification selon les règles documentées ; disposer d’un lieu ne prouve toutefois pas que la personne s’y rendra réellement.' },
    sources: [{ id: 'course-prod15', pages: '18' }, { id: 'dossier-prod15', pages: '10' }],
    related: ['formats', 'http-tls', 'race-privacy']
  },
  {
    id: 'rc-16', chapter: 16, section: 'portfolio',
    title: 'Construire une chaîne de trajets',
    summary: 'Transformer des rendez-vous successifs en segments cohérents et donner une signification précise aux heures de départ et d’arrivée.',
    tags: ['planLegs', 'trajets', 'chaîne', 'marge', 'direct', 'maison'],
    goals: ['Reconstituer la continuité des lieux entre deux événements.', 'Calculer les marges sans les appliquer deux fois.'],
    sections: [
      { title: 'Le dernier lieu compte pour le suivant', body: [
        'planLegs() organise une chaîne telle que domicile → événement A → événement B → domicile. Lorsque des rendez-vous sont rapprochés, le lieu de A peut servir d’origine vers B. Repartir systématiquement du domicile créerait un trajet absent de la journée réelle. La continuité spatiale est donc une responsabilité distincte du simple tri par heure.',
        'Les marqueurs #direct et #maison influencent l’enchaînement ; #pasdetrajet désactive l’itinéraire lié à l’événement. Ces marqueurs ne doivent pas être confondus avec un relevé de présence : un événement écrit dans l’agenda ne mesure pas la position de l’utilisateur. Dans cet instantané, le relais prépare un plan, tandis que le navigateur gère le contexte réel.'
      ] },
      { title: 'Une durée avec une marge définie', body: [
        'OSRM fournit une durée de route. Pour l’aller agenda, le relais applique 10 % de marge sur cette durée et vise une arrivée dix minutes avant le début du rendez-vous. L’extrait distingue dep, l’heure de départ, arr, l’heure d’arrivée routière visée, et min, la durée adaptée. Le nom de chaque variable doit porter une signification temporelle exacte.',
        'Exemple fictif : rendez-vous à 10:15 et route de 40 minutes. Une durée majorée de 10 % vaut 44 minutes. La cible routière est 10:05 ; le départ conseillé est donc 09:21. Si un recalcul modifie ensuite la durée, il conserve cette cible 10:05 et ne retire pas encore dix minutes.'
      ], code: "const need = Math.round(r.min * 1.1) + 10;\nreturn {\n  k: 'go',\n  dep: shift(arrive, -need),\n  arr: shift(arrive, -10),\n  min: Math.round(r.min * 1.1)\n};" },
      { title: 'Rester honnête lorsque le routage manque', body: [
        'Le dossier prod-15 décrit un repli distance et vitesse empirique lorsque OSRM est indisponible, avec un indicateur routed=false. Il décrit aussi l’absence de trajet externe inutile pour un lieu situé à moins de trois kilomètres du domicile. Ce sont des conventions de cette planification, à comprendre sans les transformer en preuves de déplacement ou de temps réel.',
        'Le retour commence après l’événement et sa durée est également majorée. Pour vérifier la chaîne, dessine d’abord les lieux et les heures, puis contrôle chaque origine, chaque destination et les marges. Une route correcte prise isolément peut rester fausse dans une chaîne si elle démarre d’un lieu où l’utilisateur n’a aucune raison d’être.'
      ] }
    ],
    pitfalls: ['Soustraire deux fois la marge de dix minutes au recalcul adaptatif.', 'Ramener automatiquement au domicile entre deux rendez-vous rapprochés.', 'Afficher une estimation de repli comme une route calculée par OSRM.'],
    interview: { question: 'Pourquoi une marge doublée est-elle un bug de modèle ?', answer: 'Parce que l’arrivée cible inclut déjà l’avance de rendez-vous. Une couche qui ignore cette définition soustrait à nouveau la marge. Un contrat explicite entre relais et navigateur évite cette incohérence.' },
    exercise: { prompt: 'Un rendez-vous commence à 14:30. leg.arr vaut 14:20 et une nouvelle durée adaptée vaut 35 minutes. Quel est le nouveau départ ?', answer: '13:45 : on retire 35 minutes à 14:20. Retirer encore dix minutes donnerait 13:35 et appliquerait deux fois la marge de rendez-vous.' },
    sources: [{ id: 'course-prod15', pages: '18–19' }, { id: 'dossier-prod15', pages: '10–12' }],
    related: ['programming', 'race-arch', 'race-tests']
  },
  {
    id: 'rc-17', chapter: 17, section: 'portfolio',
    title: 'Échantillonner la météo le long d’une route',
    summary: 'Associer chaque point du trajet à son heure de passage et identifier le point météo le plus délicat.',
    tags: ['legSeq', 'legCritical', 'échantillonnage', 'route', 'météo longue distance'],
    goals: ['Calculer une heure de passage à partir d’une fraction de durée.', 'Distinguer les capacités fixes prod-15 de la roadmap longue distance.'],
    sections: [
      { title: 'Deux coordonnées : lieu et temps', body: [
        'La météo d’une route dépend du lieu traversé et de l’heure où la voiture y passe. legSeq() associe un point p à la fraction temporelle p.f du parcours, puis ajoute cette fraction de la durée au départ. Consulter partout la météo de l’heure de départ ignorerait une pluie ou une baisse de température qui survient pendant le trajet.',
        'Pour un départ fictif à 08:00 et une durée de 80 minutes, un point à 75 % du temps est atteint vers 09:00. Le moteur cherche ensuite l’entrée horaire correspondante du modèle. Cette méthode reste une approximation : le découpage horaire des prévisions et les différences de vitesse réelle empêchent de promettre une météo exacte à la minute.'
      ], code: "const t = addMin(dep, Math.round(p.f * (min || 0)));\nconst i = m.byTime.get(t.slice(0, 13) + ':00');" },
      { title: 'Le point difficile garde sa place', body: [
        'Le relais prod-15 crée des points intermédiaires à 25 %, 50 % et 75 % du temps de parcours, auxquels s’ajoutent départ et arrivée. Une fraction de durée n’est pas nécessairement une fraction de distance : les tronçons d’une géométrie peuvent se parcourir à des vitesses différentes.',
        'legCritical() combine verdict pneus, risque de verglas, brouillard, chaussée froide et pluie pour désigner le point le plus délicat. L’extrait pondère lv par 100 et ice par 20, ajoute 15 pour le brouillard, puis de petites contributions lorsque Tr est sous 2 °C ou P atteint 1. Il s’agit d’une règle de classement explicable, pas d’une probabilité de danger.'
      ], code: 'const sc = lv * 100 + ice * 20\n  + (fog ? 15 : 0)\n  + (x.Tr != null && x.Tr < 2 ? 5 : 0)\n  + ((x.P || 0) >= 1 ? 5 : 0);' },
      { title: 'La limite des longues distances', body: [
        'Dans prod-15, le nombre de points est fixe. Un trajet de plusieurs heures peut donc comporter de longs intervalles entre points et manquer un phénomène local. Le dossier propose, en roadmap, des points dynamiques espacés selon la durée, environ un point toutes les 45 à 60 minutes avec un plafond. Ce comportement envisagé n’est pas présenté comme livré dans cet instantané.',
        'Un test utile prépare une météo fictive calme au départ et neigeuse à l’arrivée, avec une horloge contrôlée. Il doit vérifier que l’arrivée utilise son heure de passage et peut conduire le verdict. Tester seulement des prévisions identiques partout ne prouve pas que le moteur suit correctement la progression temporelle.'
      ] }
    ],
    pitfalls: ['Lire toute la route avec la météo de l’heure de départ.', 'Confondre quart du temps et quart de la distance.', 'Présenter l’échantillonnage dynamique de la roadmap comme livré dans prod-15.'],
    interview: { question: 'Pourquoi la météo du point médian peut-elle différer de celle du départ ?', answer: 'Le point médian est un autre lieu et la voiture l’atteint plus tard. Le moteur doit donc associer le point à son heure de passage, puis consulter les prévisions de ce lieu à cette heure.' },
    exercise: { prompt: 'Le trajet fictif part à 17:10 et dure 120 minutes. À quelles heures sont atteints les points temporels à 25 %, 50 % et 75 % ?', answer: '17:40, 18:10 et 18:40. Chaque point consulte sa propre météo autour de cet instant ; l’arrivée à 19:10 doit également être évaluée.' },
    sources: [{ id: 'course-prod15', pages: '19–20' }, { id: 'dossier-prod15', pages: '12' }],
    related: ['programming', 'race-arch', 'race-tests']
  },
  {
    id: 'rc-18', chapter: 18, section: 'portfolio',
    title: 'GPS vivant et machine à états',
    summary: 'Comprendre comment une position fiable et un mouvement confirmé conduisent les transitions du trajet vivant.',
    tags: ['GPS', 'machine à états', 'LIVE', 'vitesse', 'arrivée', 'iPhone'],
    goals: ['Distinguer heure de conseil et preuve de départ.', 'Expliquer fraîcheur, précision et confirmation dans les transitions GPS.'],
    sections: [
      { title: 'L’heure conseille, le mouvement décide', body: [
        'L’automate décrit une progression idle, advice, imminent ou late, active, puis arrived. L’heure prévue permet de conseiller un départ ou de signaler un retard ; elle ne prouve pas que la voiture a démarré. Dans prod-14/prod-15, la référence startFix est figée à partir d’un relevé suffisamment frais. Si cette référence suivait sans cesse l’utilisateur, un départ anticipé pourrait rester invisible.',
        'Le dossier précise une fenêtre de conseil jusqu’à quatre heures pour un aller adaptatif et une fenêtre vivante de 90 minutes avant le plus tôt entre départ prévu et départ conseillé. Pendant le conseil éloigné, aucune fausse arrivée ne doit être enregistrée. Ces fenêtres servent des responsabilités différentes.'
      ] },
      { title: 'Deux preuves pour passer en active', body: [
        'Le départ combine un éloignement supérieur au maximum de 300 mètres et de deux fois l’incertitude, ainsi que deux mesures fraîches consécutives à vitesse automobile supérieure à 2 m/s. La distance seule ne suffit pas : marcher quelques centaines de mètres ne doit pas activer le trajet. Le mouvement peut d’abord éloigner de la destination sans empêcher un départ automobile valide.',
        'Le champ coords.speed peut manquer sur iOS. liveSpeed() peut alors dériver une vitesse à partir de la distance et du temps écoulé, à condition que le déplacement dépasse le bruit GPS. Un saut imprécis ou un intervalle inexploitable ne doit pas fabriquer deux mesures valides. Les relevés pré-départ acceptent jusqu’à cinq minutes et une précision de 250 mètres dans le dossier ; les relevés trajet et arrivée doivent dater d’au plus deux minutes.'
      ], code: "const v = liveSpeed(LIVE.lastFix, fix);\nLIVE.carN = v != null && v > LIVE_CAR\n  ? (gap ? 1 : LIVE.carN + 1)\n  : 0;\nif (LIVE.phase !== 'advice' &&\n    LIVE.carN >= 2 && distKm(sf, fix) > thr) {\n  LIVE.phase = 'active';\n  startWatch(true);\n}" },
      { title: 'Une arrivée doit aussi être confirmée', body: [
        'L’arrivée automatique demande deux relevés distincts, suffisamment récents, d’une précision au plus de 150 mètres et à moins de 300 mètres de la destination. Entre 300 mètres et 1,5 kilomètre, l’interface indique une arrivée probable avec confirmation manuelle. Une reprise à froid près de la destination exige encore deux fixes fiables distincts dans la fenêtre vivante : ni un seul saut GPS ni l’heure passée ne terminent le trajet.',
        'La mémoire d’arrivée twrc.tripdone ne conserve pas de coordonnées et le dossier documente une purge au-delà de 24 heures avec dix minutes pour revenir sur une arrivée. La PWA ne promet pas un suivi GPS arbitraire permanent lorsque l’iPhone est fermé : le suivi vivant appartient au contexte de premier plan.'
      ] }
    ],
    pitfalls: ['Passer en active parce que l’heure de départ est dépassée.', 'Déplacer continuellement startFix et rendre un départ invisible.', 'Confondre arrivée probable, arrivée confirmée et proximité d’un GPS imprécis.'],
    interview: { question: 'Pourquoi deux relevés et deux types de preuve pour détecter le départ ?', answer: 'La distance montre un déplacement significatif et la vitesse permet de distinguer une marche d’un départ automobile. Deux relevés frais réduisent les transitions dues à un seul saut GPS ou à une imprécision.' },
    exercise: { prompt: 'Une personne marche 450 mètres à vitesse piétonne. Une autre fournit deux relevés automobiles frais avec éloignement suffisant. Que doit faire l’automate ?', answer: 'La marche ne doit pas déclencher active. La seconde situation peut le déclencher dans la fenêtre vivante, si fraîcheur, précision, état et référence satisfont les règles. L’heure seule ne suffit dans aucun des deux cas.' },
    sources: [{ id: 'course-prod15', pages: '20–21' }, { id: 'dossier-prod15', pages: '11, 17–18' }],
    related: ['programming', 'race-privacy', 'race-tests']
  },
  {
    id: 'rc-19', chapter: 19, section: 'portfolio',
    title: 'Départ adaptatif et atomicité route + météo',
    summary: 'Recalculer depuis la position réelle sans mélanger une nouvelle route et la météo d’un ancien itinéraire.',
    tags: ['départ adaptatif', 'atomicité', 'OSRM', 'race condition', 'génération', 'stale'],
    goals: ['Conserver l’arrivée cible lors d’un changement d’origine.', 'Expliquer une publication atomique et l’invalidation de réponses réseau obsolètes.'],
    sections: [
      { title: 'La contrainte est l’arrivée', body: [
        'Pour un aller, lorsque le GPS est frais et que l’utilisateur se trouve à plus d’un kilomètre de l’origine planifiée, le moteur peut adapter le départ depuis la position réelle. L’heure d’arrivée préparée par le relais reste la contrainte. Le navigateur demande une durée pour la nouvelle origine et en déduit quand partir.',
        'La durée OSRM est majorée selon la règle de planification. La formule est arrivée cible moins durée adaptée. La marge de dix minutes avant rendez-vous est déjà incluse dans b.arr : la soustraire encore crée un départ trop précoce. Pendant l’aperçu jusqu’à quatre heures avant départ, le GPS reste en basse consommation dans la version décrite.'
      ], code: 'const adaptiveDep = addMin(b.arr, -LIVE.route.min);' },
      { title: 'Un lot cohérent avant de changer l’écran', body: [
        'Une nouvelle géométrie et une nouvelle durée ne suffisent pas pour une analyse météo cohérente. Le moteur attend que les prévisions correspondant aux points de cette nouvelle route soient prêtes. La bascule route + météo est atomique : les informations changent ensemble, afin que l’écran ne présente pas une nouvelle origine avec un risque calculé sur l’ancien parcours.',
        'La dernière analyse cohérente peut rester visible brièvement avec un badge GPS ancien ou itinéraire non actualisé. Le dossier limite cette conservation à cinq minutes, puis indique un retour explicite au trajet planifié. Afficher l’âge et le statut fait partie du repli : une donnée ancienne ne doit pas continuer à paraître actuelle.'
      ] },
      { title: 'Le réseau ne répond pas dans l’ordre', body: [
        'Deux demandes OSRM peuvent partir dans l’ordre A puis B et revenir B puis A. Sans protection, A écraserait la route plus récente. LIVE.gen identifie une génération de contexte ; une réponse doit encore appartenir à la génération courante avant d’être acceptée. La météo de route est en plus isolée par une clé géographique.',
        'Une route courante doit correspondre au même trajet, à une origine compatible avec le GPS et à une durée de vie acceptable. Pour tester cela, retarde fictivement A, fais réussir B puis libère A : le résultat de B doit rester en place. Un autre test peut fournir la route sans la météo et vérifier que la bascule complète attend encore.'
      ] }
    ],
    pitfalls: ['Soustraire une seconde fois l’avance déjà incluse dans l’arrivée cible.', 'Afficher la nouvelle route avec la météo de l’ancienne.', 'Accepter une réponse tardive sans vérifier génération, trajet et fraîcheur.'],
    interview: { question: 'Qu’est-ce qu’une race condition dans le recalcul du trajet ?', answer: 'Des requêtes concurrentes reviennent dans un ordre différent de leur départ. Une ancienne réponse pourrait remplacer un contexte récent. Une génération et une clé de route empêchent cette réponse de devenir l’analyse courante.' },
    exercise: { prompt: 'Le GPS déclenche une route B. Sa durée est disponible mais pas sa météo. Une réponse de route A arrive ensuite. Que publier ?', answer: 'Ne pas publier B comme analyse complète et ne pas laisser A remplacer le contexte B. Garder temporairement la dernière analyse cohérente avec son état ancien, puis appliquer le repli prévu si B ne devient pas prête dans le délai.' },
    sources: [{ id: 'course-prod15', pages: '22' }, { id: 'dossier-prod15', pages: '6, 12' }],
    related: ['programming', 'http-tls', 'race-tests']
  },
  {
    id: 'rc-20', chapter: 20, section: 'portfolio',
    title: 'Waze : déléguer la navigation sans reconstruire Waze',
    summary: 'Construire un lien de navigation volontaire vers la destination en conservant des précisions adaptées à chaque contexte.',
    tags: ['Waze', 'deep link', 'navigation', 'confidentialité', 'précision'],
    goals: ['Expliquer le contenu d’un lien universel de navigation.', 'Distinguer précision locale au clic et arrondi utilisé par le relais.'],
    sections: [
      { title: 'Un lien qui transmet une intention', body: [
        'Un deep link relie une action dans une application à une destination dans une autre. Race Control construit un lien universel Waze avec la latitude, la longitude de destination et navigate=yes. L’ouverture suit un geste de l’utilisateur. Race Control transmet la destination ; Waze utilise la position courante du téléphone pour décider du départ et assurer le guidage.',
        'Cette division des responsabilités est utile : Race Control prépare une décision météo et mobilité, tandis que Waze prend en charge la navigation. Reconstruire les instructions virage par virage augmenterait fortement les données, la complexité et la maintenance. Le routage OSRM de préparation ne doit pas être décrit comme un moteur de trafic temps réel équivalent à Waze.'
      ], code: "const wazeUrl = p =>\n  `https://waze.com/ul?ll=${+p.lat},${+p.lon}&navigate=yes`;" },
      { title: 'Le même lieu n’a pas toujours la même précision', body: [
        'Pour un aller agenda, Waze reçoit la destination du rendez-vous. Pour un trajet vivant, il conserve la destination planifiée ; il ne reçoit pas toute la géométrie de la route vivante. Pour un retour agenda au domicile, prod-15 utilise le domicile exact stocké localement sur l’appareil.',
        'Le relais arrondit en revanche les coordonnées du domicile à 0,01 degré avant les appels de routage externe, soit une précision de l’ordre du kilomètre. Réutiliser cette destination arrondie pour le retour Waze pouvait arrêter le guidage plusieurs centaines de mètres trop tôt. Corriger le lien local ne doit pas augmenter discrètement la précision envoyée par le relais.'
      ] },
      { title: 'Une action locale volontaire reste une sortie externe', body: [
        'Le clic de navigation transmet une destination à un service externe. La règle de confidentialité consiste à minimiser les données selon le besoin : précision réduite pour le planifié cloud, précision pertinente pour une action volontaire sur l’appareil. Elle ne consiste pas à affirmer que rien ne quitte jamais le téléphone.',
        'Un test avec des coordonnées entièrement fictives peut vérifier les paramètres ll et navigate, l’absence d’origine GPS dans le lien, la destination exacte locale pour un retour et le déclenchement uniquement au clic. Les essais WebKit contrôlent la logique du navigateur ; le comportement final de Waze installé reste à observer sur un appareil réel.'
      ] }
    ],
    pitfalls: ['Envoyer l’origine GPS alors que le lien n’en a pas besoin.', 'Utiliser le domicile arrondi du relais pour le guidage final de retour.', 'Assimiler une durée OSRM à une estimation de trafic réel Waze.'],
    interview: { question: 'Pourquoi garder un domicile arrondi pour le relais et exact pour Waze ?', answer: 'Les besoins diffèrent : le cloud peut planifier avec une précision réduite, tandis qu’un clic local doit guider jusqu’à la bonne destination. La correction Waze peut rester locale et volontaire sans modifier l’arrondi privacy du relais.' },
    exercise: { prompt: 'Le relais connaît un point domicile arrondi et l’appareil connaît le point exact. Quel point employer dans le lien Waze du retour, et faut-il ajouter l’origine ?', answer: 'Employer le domicile exact local comme destination après le geste utilisateur. Ne pas ajouter l’origine GPS : Waze utilise la position du téléphone pour la navigation. Conserver la politique d’arrondi du relais.' },
    sources: [{ id: 'course-prod15', pages: '22–23' }, { id: 'dossier-prod15', pages: '13, 20' }],
    related: ['http-tls', 'race-privacy', 'race-tests']
  },
  {
    id: 'rc-21', chapter: 21, section: 'portfolio',
    title: 'Tenue sartoriale : un moteur déterministe séparé',
    summary: 'Réutiliser les prévisions en mémoire pour un conseil testable et distinguer le moteur prod-15 du futur plan multi-lieux.',
    tags: ['Tenue', 'wardrobe', 'déterminisme', 'moteur pur', 'données partielles', 'roadmap'],
    goals: ['Séparer règle métier, collecte météo et affichage.', 'Expliquer les limites prod-15 sans présenter un chantier prévu comme livré.'],
    sections: [
      { title: 'Des règles explicites, sans nouveau fournisseur', body: [
        'Dans prod-15, Tenue devient un troisième mode à côté de Pneus et Météo. wardrobeWindow() prépare une fenêtre de prévisions déjà en mémoire pour le lieu sélectionné. sartorialAdvice() applique des règles à cette fenêtre ; renderTenue() transforme le résultat en interface. wardrobe.js ne connaît ni le DOM ni le réseau.',
        'Le dossier décrit aujourd’hui de l’heure courante à 20 h et demain de 08 h à 20 h, avec les usages Bureau, Sortie et Promenade. La base thermique emploie le minimum de ressenti et peut se replier sur l’air si le ressenti manque. Si aucune température exploitable n’existe, le moteur ne doit pas inventer une pièce prétendument calculée.'
      ] },
      { title: 'Thermique et protections météo', body: [
        'L’extrait sartorialAdvice() distingue un minimum low ≤ 0 pour le grand froid, ≤ 7 pour manteau et maille, puis ≤ 13 pour veste et maille fine. La pluie, la neige, la pluie verglaçante, l’orage, le vent et les UV ajoutent leurs besoins. Le vent ne doit pas être soustrait une deuxième fois d’un ressenti qui l’intègre déjà.',
        'La condition humide de l’extrait est vraie avec neige, pluie verglaçante, orage, probabilité de pluie au moins 50, ou quantité de pluie au moins 0,1. Elle aide à sélectionner une protection et des semelles adaptées. Les données partielles exigent un message explicite : une variable absente n’est pas une preuve de beau temps.'
      ], code: 'const wet = snowy || freezingRain || storm\n  || (pp != null && pp >= 50)\n  || (rain != null && rain >= 0.1);' },
      { title: 'Déterminisme, tests et version historique', body: [
        'Avec les mêmes entrées, un moteur déterministe donne le même résultat. On peut donc vérifier directement qu’à 2 °C avec pluie verglaçante une protection et des semelles adaptées apparaissent, sans ouvrir un navigateur. Les tests de rendu vérifient ensuite les cibles tactiles d’au moins 44 pixels et les largeurs 320, 414 et 1280 pixels.',
        'Le plan de tenue adaptatif de toute la journée reste une roadmap dans ces supports prod-15. Le dossier précise l’architecture envisagée : source de vérité unique, continuité logique des lieux, aucun faux repli domicile pour un événement de lieu inconnu et filtre de deux heures réservé au confort thermique. Les phénomènes pluie, neige, verglas, orage et vent fort garderaient leurs actions même sur une courte période. Ces décisions prévues ne prouvent pas leur livraison dans cette version.'
      ] }
    ],
    pitfalls: ['Faire appeler une API météo directement par le moteur wardrobe.', 'Pénaliser le vent deux fois à partir d’une température déjà ressentie.', 'Présenter le plan multi-lieux de la roadmap comme une fonction livrée dans prod-15.'],
    interview: { question: 'Pourquoi séparer wardrobe.js et renderTenue() ?', answer: 'Le moteur porte des règles déterministes testables avec des données fictives, sans réseau ni DOM. Le rendu porte l’interaction et l’accessibilité. Cette séparation permet de changer l’interface sans créer un second moteur de conseil.' },
    exercise: { prompt: 'Le ressenti manque mais la température d’air est disponible ; dans un second cas, aucune température n’est connue. Que doit faire la recommandation ?', answer: 'Dans le premier cas, utiliser le repli sur l’air et signaler les données partielles. Dans le second, afficher le manque de données sans annoncer une tenue calculée. Aucune nouvelle requête fournisseur n’est nécessaire au moteur.' },
    sources: [{ id: 'course-prod15', pages: '23–24' }, { id: 'dossier-prod15', pages: '14, 17, 20–23, 27' }],
    related: ['programming', 'race-arch', 'race-tests', 'race-privacy']
  }
];
