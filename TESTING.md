# Vérification mobile

La CI teste la navigation tactile et la recherche dans Chromium et WebKit avec le profil iPhone 11 Pro Max.
Elle couvre Safari (414 × 715), l’application en plein écran (414 × 896), le paysage (896 × 414),
un petit écran (320 × 568) et le bureau (1280 × 900).

```sh
npm ci --ignore-scripts
npx playwright install chromium webkit
BROWSER=chromium npm test
BROWSER=chromium npm run test:learning
BROWSER=webkit npm test
BROWSER=webkit npm run test:learning
npm run test:sw
```

Les tests vérifient les huit vues, les neuf domaines, les 84 entrées (42 fiches et 42 cours), la saisie sans perte de focus,
les filtres combinés, l’import/export JSON, les révisions en date locale et un stockage indisponible.
Ils contrôlent les boutons ≥44 px, les champs ≥16 px et l’absence de débordement.
Les tests de cours ouvrent chacun des 42 chapitres et ses deux corrigés, vérifient les citations historiques de pages et les références publiques des dix cas récents,
la recherche dans le code, le glossaire et les réponses, la navigation entre chapitres, l’inventaire des
sept supports, les limites historiques/roadmap, la progression ancienne et nouvelle et le rejet d’une
enveloppe Race Control fictive incompatible. Aucun original ni vraie sauvegarde n’est utilisé comme fixture.

Le vrai Service Worker est testé dans Chromium : cache HTTP ancien des scripts et du cours lors d’une mise à jour,
redémarrage hors connexion avec `?v=2`, les 42 cours et corrigés sans réseau, ainsi que le cas coffre récent et le portfolio de trois projets, échec serveur et préservation des caches d’autres applications.
Playwright ne permet pas de piloter les Service Workers de WebKit.

## Contrôles fonctionnels

- [x] 42 fiches conservées, 42 chapitres, 20 labs, 12 preuves possibles et 9 domaines
- [x] sources et pages, 12 questions, 42 termes du glossaire
- [x] inventaire des sept pièces, doublons historiques et sauvegarde chiffrée exclus du contenu brut
- [x] progression locale
- [x] export/import JSON
- [x] révisions espacées
- [x] responsive mobile
- [x] manifest + service worker
- [x] aucun analytics ; backend requis uniquement si la synchronisation personnelle est activée volontairement
- [x] aucun lien/ID Google Drive privé dans le build
- [x] vérification de la version publique de référence lors de l’audit initial
- Résultat de livraison V2.2 : [PR #18](https://github.com/iPoower/Reconversion-Control/pull/18), avec CI, workflow Pages et SHA du HTML servi consignés après confirmation.
- [ ] installation écran d'accueil iPhone
- [x] cache offline après première visite (test automatisé Chromium)
- [ ] validation manuelle sur l’iPhone 11 Pro Max réel, Safari et écran d’accueil


## Intégration v4
La validation de cette branche couvre aussi la conservation des garde-fous de navigation et de récupération du shell v3 lors du passage au corpus pédagogique v4.

## V2.2 — cas récents

Les tests conservent les anciens IDs et vérifient le passage du chapitre 32 aux nouveaux cas, la progression et les notes portfolio anciennes après rechargement/export/import, l’absence de validation automatique des ajouts, les cinq nouveaux labs manuels indépendants, les liens HTTPS avec `noopener noreferrer`, et les sources publiques séparées des sept références historiques. Les vues Pro, les détails publics et les nouveaux cours sont contrôlés à 320, 414 et 1280 px, avec cibles de 44 px et sans débordement.

La CI produit l’artefact `reconversion-visual-<browser>` : captures iPhone et PC, sans données personnelles. Les captures doivent être examinées ; leur existence seule ne prouve pas la qualité ergonomique. Les changements n’ajoutent aucune dépendance et conservent les moteurs de sync, le SQL, les formats de stockage et le service worker.

Le téléchargement local des navigateurs Playwright a échoué (archive reçue invalide). Les tests unitaires de contenu et de transport sont exécutés localement ; les validations navigateur obligatoires utilisent les runners GitHub avec Playwright 1.63.0 du lockfile. Cette limite locale ne remplace pas les contrôles CI.
# V3.0 — Projet 2027

`node tests/project-checks.cjs` vérifie le schéma optionnel du dossier, les preuves datées, les montants inconnus, le zéro explicite, les dépassements, le rejet des entrées invalides et l’échappement HTML. `node tests/project.spec.cjs` ajoute une validation Chromium/WebKit de l’import de profil privé sans perte de cours/labs/preuves, de l’export/import complet, de l’ancien format et du rejet atomique, puis des contrôles de mise en page à 320, 414 et 1280 px. Le Service Worker conserve le nouvel onglet hors ligne. Ces suites rejoignent la CI existante.

Le dossier est conservé lors d’un import ancien qui ne possède pas de champ `career`. Le fichier de profil est un import de cadre personnel uniquement ; il ne remplace aucune progression ni réponse d’école. Les données de test sont fictives. Aucun essai sur iPhone physique ni activation cloud réelle n’est déduit des simulations.
