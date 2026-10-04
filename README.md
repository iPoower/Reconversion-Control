# Reconversion Control

PWA personnelle de pilotage de reconversion **Cyber · Cloud · DevSecOps**, inspirée du cockpit de Race Control mais hébergée dans un dépôt totalement indépendant.

## V1

- 9 domaines, 42 fiches essentielles
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

Voir `PRIVACY.md`.

## iPhone et recherche

L’onglet **Fiches** combine recherche, domaine et statut. La recherche accepte les mots
avec ou sans accents ; changer de filtre conserve la saisie et la progression.
Les fiches sont les 42 synthèses embarquées : aucun document Drive privé n’est recherché ou publié.
**Importer**, dans **Sources & privacy**, ouvre le sélecteur de fichiers pour une sauvegarde JSON
de progression ; **Exporter** en crée une nouvelle. Les sauvegardes V1 restent compatibles.

Les commandes tactiles mesurent au moins 44 px. L’affichage prévoit les zones de sécurité de l’iPhone,
le paysage et une fenêtre de fiche qui défile indépendamment. Un stockage indisponible est signalé ;
l’application reste utilisable pendant la session et permet d’exporter la progression.
Le cache hors connexion ne conserve que les fichiers de cette application et respecte les caches
des autres applications du même domaine GitHub Pages.

Tests automatisés : `npm ci`, `npx playwright install chromium webkit`, puis
`BROWSER=chromium npm test` et `BROWSER=webkit npm test`. `npm run test:sw` vérifie le vrai cache
dans Chromium ; Playwright ne pilote pas les Service Workers de WebKit. Les profils iPhone sont
des simulations navigateur ; une vérification sur l’iPhone réel complète ces contrôles.

## GitHub Pages

Déploiement automatique depuis `main` via `.github/workflows/pages.yml`.

URL cible : **https://ipoower.github.io/Reconversion-Control/**.
