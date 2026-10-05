# Reconversion Control

PWA personnelle de pilotage de reconversion **Cyber · Cloud · DevSecOps**, inspirée du cockpit de Race Control mais hébergée dans un dépôt totalement indépendant.

## V1.7 — Learning Engine · Labs Drive

- 9 domaines, 42 fiches essentielles conservées et 32 chapitres Race Control
- parcours guidé en 3 niveaux : Débutant, Intermédiaire, Pro, avec 32 étapes réordonnées selon leurs prérequis plutôt que selon l’ordre des supports source
- apprentissage bilingue progressif FR + EN : English Coach à 25 % en Débutant, 50 % en Intermédiaire et 75 % en Pro, recherche bilingue et défis oraux
- cours guidé : objectifs, explications, exemples, pièges, entretien et exercice corrigé
- 12 questions de révision, glossaire de 42 termes et six checkpoints de compréhension
- sources et pages visibles, inventaire des sept pièces et limites de couverture
- cockpit quotidien : Mission du jour (Learn / Review / Speak), session guidée 30 min, Study Pulse et Interview Lab
- Lab Mode : 15 exercices pratiques Débutant / Intermédiaire / Pro, reliés aux statuts existants
- Drive Source Shelf : 10 références privées sélectionnées et adaptées sans publier d’ID, URL Drive ou chapitre intégral
- Portfolio Proofs : sept capacités Race Control reliées à des compétences explicables en entretien
- Cap reconversion : Fondations IT → Cyber → Cloud/DevSecOps → Pentest → Sécurité IA → Portfolio
- Knowledge Health par domaine
- statuts À apprendre / En cours / Acquis
- révisions espacées J+1 / J+3 / J+7 / J+14 / J+30 / J+60
- recherche, parcours recommandé, questions d'entretien et exercices
- portfolio Race Control
- export/import local de progression
- mode sombre / clair
- PWA installable et cache hors ligne
- aucun analytics ni backend

## Confidentialité

Le dépôt public ne contient **aucun document Google Drive, aucun ID de fichier Drive et aucun lien privé**. Les sources affichées sont uniquement des références pédagogiques. La progression reste dans `localStorage`.

Les adaptations reprennent le cours débutant, le dossier technique prod-15 et leurs annexes.
Les fiches d’architecture prod-8 sont des archives, le PDF et le DOCX du dossier sont deux formats
d’un même contenu. La sauvegarde Race Control chiffrée reste privée et n’a pas été déchiffrée.
Les fonctions annoncées en roadmap dans ces documents restent identifiées comme telles au baseline
prod-15. Ces sources historiques ne certifient pas la version actuelle de Race Control.

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
de progression ; **Exporter** en crée une nouvelle. Les sauvegardes V1 restent compatibles.

Les commandes tactiles mesurent au moins 44 px. L’affichage prévoit les zones de sécurité de l’iPhone,
le paysage et une fenêtre de fiche qui défile indépendamment. Un stockage indisponible est signalé ;
l’application reste utilisable pendant la session et permet d’exporter la progression.
Le cache hors connexion ne conserve que les fichiers de cette application et respecte les caches
des autres applications du même domaine GitHub Pages.

Les cours sont lisibles sans réseau après un premier chargement complet et la mise en cache.
Le navigateur peut effacer ce cache ; la progression doit être exportée pour disposer d’une sauvegarde.

Tests automatisés : `npm ci`, `npx playwright install chromium webkit`, puis
`BROWSER=chromium npm test`, `BROWSER=chromium npm run test:learning` et les mêmes commandes avec
`BROWSER=webkit`. `npm run test:sw` vérifie le vrai cache
dans Chromium ; Playwright ne pilote pas les Service Workers de WebKit. Les profils iPhone sont
des simulations navigateur ; une vérification sur l’iPhone réel complète ces contrôles.

## GitHub Pages

Déploiement automatique depuis `main` via `.github/workflows/pages.yml`.

URL cible : **https://ipoower.github.io/Reconversion-Control/**.
