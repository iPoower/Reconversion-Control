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

Les tests vérifient les six onglets, les neuf domaines, les 74 entrées (42 fiches et 32 cours), la saisie sans perte de focus,
les filtres combinés, l’import/export JSON, les révisions en date locale et un stockage indisponible.
Ils contrôlent les boutons ≥44 px, les champs ≥16 px et l’absence de débordement.
Les tests de cours ouvrent chacun des 32 chapitres et ses deux corrigés, vérifient les citations de pages,
la recherche dans le code, le glossaire et les réponses, la navigation entre chapitres, l’inventaire des
sept supports, les limites historiques/roadmap, la progression ancienne et nouvelle et le rejet d’une
enveloppe Race Control fictive incompatible. Aucun original ni vraie sauvegarde n’est utilisé comme fixture.

Le vrai Service Worker est testé dans Chromium : cache HTTP ancien des scripts et du cours lors d’une mise à jour,
redémarrage hors connexion avec `?v=2`, les 32 cours et corrigés sans réseau, échec serveur et préservation des caches d’autres applications.
Playwright ne permet pas de piloter les Service Workers de WebKit.

## Contrôles fonctionnels

- [x] 42 fiches conservées, 32 chapitres, 9 domaines
- [x] sources et pages, 12 questions, 42 termes du glossaire
- [x] inventaire des sept pièces, doublons historiques et sauvegarde chiffrée exclus du contenu brut
- [x] progression locale
- [x] export/import JSON
- [x] révisions espacées
- [x] responsive mobile
- [x] manifest + service worker
- [x] aucun analytics/backend
- [x] aucun lien/ID Google Drive privé dans le build
- [x] vérification de la version publique de référence lors de l’audit initial
- [ ] nouvelle version de cours publiée (PR préparée sans fusion ni mise en production)
- [ ] installation écran d'accueil iPhone
- [x] cache offline après première visite (test automatisé Chromium)
- [ ] validation manuelle sur l’iPhone 11 Pro Max réel, Safari et écran d’accueil


## Intégration v4
La validation de cette branche couvre aussi la conservation des garde-fous de navigation et de récupération du shell v3 lors du passage au corpus pédagogique v4.
