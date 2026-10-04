# Vérification mobile

La CI teste la navigation tactile et la recherche dans Chromium et WebKit avec le profil iPhone 11 Pro Max.
Elle couvre Safari (414 × 715), l’application en plein écran (414 × 896), le paysage (896 × 414),
un petit écran (320 × 568) et le bureau (1280 × 900).

```sh
npm ci --ignore-scripts
npx playwright install chromium webkit
BROWSER=chromium npm test
BROWSER=webkit npm test
npm run test:sw
```

Les tests vérifient les cinq onglets, les neuf domaines, les 42 fiches, la saisie sans perte de focus,
les filtres combinés, l’import/export JSON, les révisions en date locale et un stockage indisponible.
Ils contrôlent les boutons ≥44 px, les champs ≥16 px et l’absence de débordement.
Le vrai Service Worker est testé dans Chromium : cache HTTP ancien lors d’une mise à jour,
redémarrage hors connexion avec `?v=2`, échec serveur et préservation des caches d’autres applications.
Playwright ne permet pas de piloter les Service Workers de WebKit.

## Contrôles fonctionnels

- [x] 42 fiches, 9 domaines
- [x] progression locale
- [x] export/import JSON
- [x] révisions espacées
- [x] responsive mobile
- [x] manifest + service worker
- [x] aucun analytics/backend
- [x] aucun lien/ID Google Drive privé dans le build
- [x] version publique de référence : GitHub Pages 200, fichiers identiques à main lors de l’audit
- [ ] installation écran d'accueil iPhone
- [x] cache offline après première visite (test automatisé Chromium)
- [ ] validation manuelle sur l’iPhone 11 Pro Max réel, Safari et écran d’accueil
