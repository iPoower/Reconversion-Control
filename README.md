# Reconversion Control

PWA personnelle de pilotage de reconversion **Cyber · Cloud · DevSecOps**, inspirée du cockpit de Race Control mais hébergée dans un dépôt totalement indépendant.

## V3.0 — Projet 2027 · dossier de décision privé

L’onglet **Projet 2027** (`#project`) relie le bilan de reconversion au travail quotidien : six étapes du socle IT à la sécurité IA, huit démonstrations sans assistance, six actions de dossier, un comparatif Jedha/ENI sur huit questions et une simulation du coût total. Les 42 fiches, 42 cours, 20 labs, Daily Five et identifiants existants sont conservés.

Les références publiques ont été revérifiées le **22 octobre 2026** : AIS RNCP37680, niveau 6, échéance 28/02/2027 ; TSSR RNCP42463, niveau 5, échéance 31/08/2031. Ces faits sont séparés des déclarations des écoles, de l’habilitation du centre, des conditions de la cohorte 2027 et du financement individuel restant à confirmer. Aucune inscription, durée de parcours personnel, prise en charge ni compétence n’est validée automatiquement.

Le diplôme de départ, le dispositif, la zone d’emploi, les durées, le budget et le bilan personnel sont saisis localement ou importés via un fichier privé au format `reconversion-control.project.v1`. **Aucun profil personnel réel n’est embarqué dans le dépôt public.** L’import de profil remplace seulement le cadre personnel ; il conserve les cours, labs, révisions, réponses d’école et preuves existants. La demande de devis peut être copiée ; aucun message n’est envoyé par le site.

Le dossier est ajouté au champ optionnel `career` de l’état existant et des exports/snapshots V2. Les anciennes sauvegardes restent lisibles et leur import conserve le dossier courant lorsqu’elles ne contiennent pas ce champ. Le profil privé ne doit pas être confondu avec une sauvegarde complète de progression. Les exports restent des fichiers JSON en clair : les conserver dans un emplacement privé. En cas de synchronisation volontaire, le dossier utilise l’enveloppe chiffrée existante ; mettre à jour les deux appareils avant de l’utiliser. L’activation et la disponibilité d’un projet cloud personnel ne sont pas vérifiées par la livraison de code.

Une ligne de coût vide demeure inconnue ; un zéro doit être explicite. La marge sous plafond n’est pas un reste à charge et ne prouve aucun financement. Les démonstrations et les réponses contrôlées restent des déclarations de l’utilisateur avec trace datée, indépendantes de la progression pédagogique et d’une certification externe.

Validation du dossier : `node tests/project-checks.cjs`, puis `BROWSER=chromium node tests/project.spec.cjs` et `BROWSER=webkit node tests/project.spec.cjs`. Voir [docs/project-2027.md](docs/project-2027.md).

## Corpus V2.2 conservé — Réalisations récentes · cours, labs et portfolio

- 9 domaines, 42 fiches essentielles conservées et 42 cours : 32 chapitres historiques Race Control + 10 cas récents
- parcours guidé en 3 niveaux : Débutant, Intermédiaire, Pro, avec le socle de 32 étapes réordonnées selon leurs prérequis puis dix cas récents Pro ; aucun ancien identifiant modifié
- apprentissage bilingue progressif FR + EN : English Coach à 25 % en Débutant, 50 % en Intermédiaire et 75 % en Pro, recherche bilingue et défis oraux
- cours guidé : objectifs, explications, exemples, pièges, entretien et exercice corrigé
- 12 questions de révision, glossaire de 42 termes et six checkpoints de compréhension
- sources et pages visibles, inventaire des sept pièces et limites de couverture
- cockpit quotidien : Mission du jour (Learn / Review / Speak), session guidée 30 min, Study Pulse et Interview Lab
- ⚡ 5 minutes par jour : 14 sessions mappées aux notions, sélection adaptative par révision due → erreur récente → domaine faible, Flash Quiz, Mini-mission, English Sprint, XP et streak local
- Lab Mode : 20 exercices pratiques Débutant / Intermédiaire / Pro avec progression indépendante des cours
- Drive Source Shelf : 10 références privées sélectionnées et adaptées sans publier d’ID, URL Drive ou chapitre intégral
- Portfolio Proofs : 12 capacités des projets avec statut et Evidence Locker locaux, indépendants du statut des cours
- Cap reconversion : Fondations IT → Cyber → Cloud/DevSecOps → Pentest → Sécurité IA → Portfolio
- Knowledge Health par domaine
- statuts À apprendre / En cours / Acquis
- SRS V2 : Again / Hard / Good / Easy, intervalles adaptatifs et sortie automatique de « Acquis » après deux oublis pour éviter la fausse maîtrise
- recherche, parcours recommandé, questions d'entretien et exercices
- portfolio public de trois projets : Race Control, Reconversion Control et Control Vault, avec statut, sources et limites explicites
- export/import local de progression
- mode sombre / clair
- PWA installable et cache hors ligne, deep links (`#daily`, `#review`, `#labs`, `#topic/<id>`), bouton Retour cohérent et raccourcis PWA
- build GitHub Pages identifié par le SHA réellement testé ; cache Service Worker dérivé automatiquement de ce SHA
- notification locale lorsqu’une nouvelle version PWA prend le contrôle
- aucun analytics ; aucun backend requis (synchronisation privée optionnelle)

## Actualisation pédagogique — 22/10/2026

Trois cours existants (`rc-37`, `rc-39`, `rc-42`) sont enrichis sur la fusion sans perte, les preuves par cible de publication et les paquets opaques. Trois labs manuels et les défis anglais suivent ces cas. Les 27 références publiques comprennent six ajouts datés ; les contenus et vocabulaires antérieurs restent disponibles.

Le portfolio cite l’instantané GitHub Pages prod-157 de Race Control. Pour Control Vault, il distingue l’interface de démonstration des modules B1/B2 et des tests A1 fusionnés, encore sans connexion Drive réelle dans l’interface publique. Les sources formation relues conservent leurs informations ; aucune admission ni prise en charge n’est déduite de cette relecture.

Voir [sources et portée de l’actualisation du 22/10](docs/content-refresh-20261022.md). Les versions historiques ci-dessous gardent leurs dates.

## Actualisation pédagogique — 21/10/2026

Sept cours existants (`rc-34`, `rc-35`, `rc-36`, `rc-39` à `rc-42`) reçoivent un complément daté : Twin Garage et LIVE ROUTE, fraîcheur et source canonique du GPS, prévisions ponctuelles, Journey Replay historique, chaîne de livraison, Projet 2027 et contrat d’intégration de Control Vault. Les exercices et défis anglais suivent ces cas ; trois labs existants proposent une variante sourcée. Les 42 cours, 20 labs, 14 séances Daily Five, vocabulaires et identifiants restent conservés.

Le portfolio distingue l’instantané Race Control prod-151 vérifié le 21/10 du prototype Control Vault toujours sans connexion réelle. Sept références publiques supplémentaires sont figées ou datées ; les quatorze précédentes restent disponibles. Les références formation ont été relues le 21/10 et le TSSR précise les compétences IA ainsi que l’épreuve de 7 h. Aucune admission, certification, progression ou prise en charge n’est validée automatiquement.

Voir [sources, périmètre et limites de l’actualisation](docs/content-refresh-20261021.md). Les instantanés antérieurs ci-dessous sont conservés avec leur date.

## Réalisations récentes — instantané vérifié le 12/10/2026

Dix cours FR/EN (`rc-33` à `rc-42`) couvrent UX prod93, Garage et les six modules F1, provenance des mesures, départs personnalisés, coffre local, CI sécurisée, version réellement servie, diagnostics privés, Reconversion Control et Control Vault. Cinq labs manuels (`lab-16` à `lab-20`) et cinq nouvelles preuves portfolio restent indépendants des statuts des cours. Les 14 séances Daily Five et leurs identifiants sont conservés.

Quatorze références publiques sont disponibles dans les cours et une section Sources repliée. Les sept pièces historiques restent séparées : aucun contenu récent n’est faussement attribué au PDF prod15. Le détail des ajouts et de leur provenance est dans [docs/recent-realizations-20261012.md](docs/recent-realizations-20261012.md).

Control Vault est une **Phase 1 de démonstration**, avec des moteurs réels sur données fictives, sans connexion Google/Supabase ni sauvegarde personnelle durable active. Cloud-DevSecOps-Lab reste une idée de prochain projet. Aucun cours, lab, preuve ou certification n’est acquis automatiquement.

## Cours techniques, preuves et synchronisation

- **12 modules originaux sourcés** ajoutés aux fiches Linux, réseau, Cloud et pentest autorisé. Il s'agit de compléments issus de documentation publique, **pas** d'une couverture intégrale des ouvrages privés manquants.
- **5 labs sur 20** comportent maintenant un contrôleur de rendu JSON strict, avec explications des échecs et empreinte SHA-256 locale du fichier vérifié. Les 15 autres continuent d'utiliser l'autoévaluation. Aucun code utilisateur n'est exécuté.
- **Synchronisation PC/iPhone opt-in**, documentée dans [docs/cloud-sync.md](docs/cloud-sync.md) : Supabase Email OTP et AES-256-GCM local, révisions conditionnelles et choix explicite des conflits. **Aucun projet Supabase n'est activé ni configuré par défaut.**

## Confidentialité

Le dépôt public ne contient **aucun document Google Drive, aucun ID de fichier Drive et aucun lien privé**. Les sessions Daily Five sont également entièrement locales et n’envoient aucun score. Les sources affichées sont uniquement des références pédagogiques. La progression reste dans `localStorage` **par défaut**. Si l'utilisateur configure volontairement son propre projet Supabase et s'authentifie, une enveloppe chiffrée de progression peut être envoyée à ce projet ; aucune donnée n'est transmise sans activation.

Les adaptations reprennent le cours débutant, le dossier technique prod-15 et leurs annexes.
Les fiches d’architecture prod-8 sont des archives, le PDF et le DOCX du dossier sont deux formats
d’un même contenu. La sauvegarde Race Control chiffrée reste privée et n’a pas été déchiffrée.
Les fonctions annoncées en roadmap dans ces documents restent identifiées comme telles au baseline
prod-15. Ces sources historiques ne certifient pas la version actuelle de Race Control. Les cas récents utilisent des sources publiques datées et distinguent ce qui est livré, simulé ou encore à construire.

La [cartographie des sources](docs/source-coverage.md) relie les 32 chapitres, les 27 sections du dossier
et les annexes aux cours. Elle indique également quelles fiches générales restent à compléter :
les ouvrages complets Linux, réseau, cloud, pentest et IA n’ont pas été fournis dans ce lot.

Voir `PRIVACY.md`.

## iPhone et recherche

L’onglet **Fiches** combine recherche, domaine et statut. La recherche accepte les mots
avec ou sans accents ; changer de filtre conserve la saisie et la progression.
La recherche parcourt les titres, les repères et le texte intégral des cours liés, y compris exemples,
exercices et glossaire. Elle ne recherche pas les fichiers privés d’origine.
**Importer**, dans **Sources & privacy**, ouvre le sélecteur de fichiers pour une sauvegarde JSON
de progression ; **Exporter** en crée une nouvelle. Les sauvegardes V1 restent compatibles ; les exports V2 ajoutent les états Labs et Portfolio Proofs sans exposer les contenus privés.

Les commandes tactiles mesurent au moins 44 px. L’affichage prévoit les zones de sécurité de l’iPhone,
le paysage et une fenêtre de fiche qui défile indépendamment. Un stockage indisponible est signalé ;
l’application reste utilisable pendant la session et permet d’exporter la progression.
Le cache hors connexion ne conserve que les fichiers de cette application et respecte les caches
des autres applications du même domaine GitHub Pages. Chaque déploiement Pages injecte le SHA exact validé par la CI dans l’HTML et le Service Worker afin que l’interface, les assets et le cache portent la même identité de build.

Les cours sont lisibles sans réseau après un premier chargement complet et la mise en cache.
Le navigateur peut effacer ce cache ; la progression doit être exportée pour disposer d’une sauvegarde.

Tests complémentaires : `node tests/deep-checks.cjs` et `node tests/cloud-sync.spec.cjs`.

Tests automatisés : `npm ci`, `npx playwright install chromium webkit`, puis
`BROWSER=chromium npm test`, `BROWSER=chromium npm run test:learning` et les mêmes commandes avec
`BROWSER=webkit`. `npm run test:sw` vérifie le vrai cache
dans Chromium ; Playwright ne pilote pas les Service Workers de WebKit. Les profils iPhone sont
des simulations navigateur ; une vérification sur l’iPhone réel complète ces contrôles.

## Protection de main

Le workflow de validation vérifie, après chaque push sur `main`, que le SHA est associé à une pull request fusionnée vers `main`. Un push direct peut encore exister dans l’historique tant qu’un Ruleset GitHub natif n’est pas activé, mais il fait échouer la validation et **GitHub Pages ne le déploie pas**.

La protection native par Ruleset/Branch Protection reste le contrôle préventif recommandé côté réglages GitHub ; le gate CI constitue le contrôle de production défensif dans le dépôt.

## GitHub Pages

Déploiement automatique depuis `main` via `.github/workflows/pages.yml`.

URL cible : **https://ipoower.github.io/Reconversion-Control/**.

### Limite de sécurité de l’hébergement statique

La CSP reste déclarée dans le document pour les directives compatibles avec `<meta>`. La protection anti-framing doit être fournie par un en-tête HTTP `Content-Security-Policy` avec `frame-ancestors` ; elle n’est donc pas annoncée comme active tant que l’hébergement ne fournit pas cet en-tête.
