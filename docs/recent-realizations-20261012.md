# Reconversion Control — réalisations récentes du 12/10/2026

## Référence et objectif

Application publiée vérifiée par HTTP et navigation : V2.1, build `2ccf288103afbb8a3f308ad92929d9ae8bc8950f`.
Le cours existant décrivait surtout le baseline prod15 de Race Control. Il conservait 42 fiches,
32 chapitres, 15 labs, sept preuves portfolio, 14 sessions Daily Five et 12 approfondissements.
L'objectif est d'intégrer les réalisations publiques récentes au parcours, sans valider la maîtrise à la place de l'utilisateur.

Le baseline Race Control réellement livré est prod93 : commit `2183d54295ccde2366d14c1b93a4ba7f277c5bb9`,
build `7d32a7e22525`, PR #118 fusionnée, CI après fusion et vérification HTTP confirmées.
Les 146 exécutions sont une couverture de cette livraison, pas un nombre permanent ni un pentest complet.

## Ajouts

| Cours | Cas | Sources publiques principales |
|---|---|---|
| rc-33 | Trois niveaux de lecture, focus, brouillon, 44 px, captures | [PR #118](https://github.com/iPoower/iPoower/pull/118) et audit UX au commit prod93 |
| rc-34 | Garage, six modules F1 opt-in, données absentes | [PR #109](https://github.com/iPoower/iPoower/pull/109), #118 |
| rc-35 | Mesuré, estimé, indisponible ; provenance et confiance | [PR #117](https://github.com/iPoower/iPoower/pull/117), #118 |
| rc-36 | Départ personnalisé, occurrence/sens, cache négatif et reconnexion | [PR #92](https://github.com/iPoower/iPoower/pull/92) |
| rc-37 | AES-GCM, PBKDF2, migration vérifiée, session et origine partagée | [Coffre prod93](https://github.com/iPoower/iPoower/blob/2183d54295ccde2366d14c1b93a4ba7f277c5bb9/src/session-vault.js), OWASP, MDN |
| rc-38 | Frontières des secrets, shards, SHA exact et protections natives | GitHub Secure use, audit UX #118 |
| rc-39 | Commit fusionné, build servi, cinq pushes refusés, retour arrière | [PR #107](https://github.com/iPoower/iPoower/pull/107), audit #118 |
| rc-40 | Diagnostics sans coordonnées, doublons possibles et débriefs | [PR #104](https://github.com/iPoower/iPoower/pull/104), [#108](https://github.com/iPoower/iPoower/pull/108) |
| rc-41 | Reconversion : FR/EN, SRS, Daily Five, états indépendants, sync opt-in | [README V2.1](https://github.com/iPoower/Reconversion-Control/blob/2ccf288103afbb8a3f308ad92929d9ae8bc8950f/README.md) |
| rc-42 | Control Vault prototype, empreinte/relecture et pitch des trois projets | [README Phase 1](https://github.com/iPoower/Control-Vault/blob/0647b4f666533447e6f549de0cffc3a1bf6d44e4/README.md), gouvernance crypto au même commit |

Chaque nouveau cours comporte objectifs, explications, pièges, question d'entretien, exercice
et corrigés repliés, sources vérifiables et English Coach avec quatre termes.
Les sources privées historiques gardent leurs citations de pages ; les sources publiques n'inventent aucune page.

Cinq labs manuels : audit mobile, import refusé sans perte sur données synthétiques, preuve de livraison,
diagnostic expurgé et pitch des trois projets. Aucun code utilisateur n'est exécuté et aucun
contrôleur JSON n'est annoncé pour ces labs. Les cinq correcteurs existants restent disponibles.

Cinq preuves ajoutées : UX prod93, coffre/session, livraison servie, Reconversion et prototype Control Vault.
Le portfolio de trois projets est dans Parcours. Les preuves et limites sont fermées initialement.
Sources & privacy sépare sept pièces historiques de quatorze références publiques.

## Conservation de la progression et des données

- Les IDs des 42 fiches et des 32 chapitres initiaux restent inchangés, comme les 15 anciens labs et sept preuves.
- Les nouvelles entrées sont ajoutées ; aucun statut Acquis/Validé, XP, lab ou preuve n'est créé automatiquement.
- Les clés `reconversion-control.state.v1`, thème et Daily Five restent identiques.
- Les 14 séances Daily Five, leurs questions, réponses, récompenses et rotations ne changent pas.
- Les moteurs SRS, import/export, cloud et SQL, le chiffrement, le service worker et les permissions ne changent pas.
- Aucune migration ni nouvelle dépendance. Seuls le numéro de présentation et la version du paquet passent à 2.2.
- Les pourcentages peuvent baisser parce que le parcours contient plus de notions ; les acquis existants restent conservés.
- Les livres, liens Drive privés, vraies sauvegardes, clés et coordonnées restent hors du dépôt et des fixtures.

La lecture est locale ; les liens publics ne sont ouverts qu'à la demande. Ils demandent alors le réseau.
Le cloud reste facultatif. Le chiffrement cloud ne chiffre pas automatiquement le localStorage ou les exports JSON.

## Statuts honnêtes

Race Control et Reconversion Control sont des applications publiées.
Control Vault est une Phase 1 de démonstration : données fictives, Drive mémoire, clé éphémère,
aucune connexion réelle Google/Supabase, aucune sauvegarde personnelle durable active.
Cloud-DevSecOps-Lab est une idée de suite ; aucune certification n'est déclarée acquise.

L'audit ciblé de Race Control constate un coffre AES-256-GCM et PBKDF2-HMAC-SHA-256 à 600 000 itérations,
migration avec relecture et protections de branches exposées par l'API.
Il conserve des limites explicites : risque des phrases courtes hors ligne, clé en sessionStorage
pendant déverrouillage, absence de verrouillage automatique d'inactivité confirmé, même origine
`ipoower.github.io` entre applications et en-têtes anti-framing non confirmés sur GitHub Pages.
Ce sont des axes de durcissement, sans preuve d'exploitation ni certification de sécurité globale.

## Validation et livraison

Contrôles locaux : syntaxe des fichiers modifiés, correcteurs JSON historiques, graphes de contenu/IDs
et transport cloud (crypto, mauvaise phrase, OTP, conflit, refus de clé secrète).
Navigateurs : Chromium/WebKit sur profil iPhone 11 Pro Max et petites largeurs, plus PC et vrai SW Chromium.
Ajouts E2E : 42 cours et leurs corrigés, sources publiques, transitions, legacy progression/notes,
20 labs, états indépendants et portfolio sans overflow avec détails ouverts.
La CI conserve ses permissions de lecture et ajoute seulement un artifact de captures, action figée par SHA.

La base `main` de Reconversion Control n'exposait pas de protection native active.
Le gate de provenance après fusion bloque une publication issue d'un push direct.
Aucune protection ni permission administrative n'est modifiée par cette mise à jour.

Résultats CI, captures examinées, commit fusionné et contrôle HTTP de publication seront consignés dans la PR.
Aucun essai sur iPhone physique ne peut être revendiqué à partir de WebKit simulé.


## Examen des captures

Les captures de [la CI a647633](https://github.com/iPoower/Reconversion-Control/actions/runs/38186521669)
ont été téléchargées et leur archive comparée au SHA-256 publié par GitHub.
Chromium : cours récents, prototype, portfolio replié/ouvert, petit écran 320 px, iPhone 414 px et PC 1280 px examinés.
Les textes restent lisibles et les actions sont distinctes, sans débordement.
Les nouveaux titres de cours ont été raccourcis après cette lecture ; les anciens chapitres ne changent pas.
Les vues portfolio et accueil des cours ci-dessous ne sont pas modifiées par ce raccourcissement.
Le socle conserve sa grande typographie et ses explications ; une nouvelle refonte globale n’est pas incluse ici.

- [PC avant, production V2.1](recent-realizations-20261012/pc-course-before.jpg), capture directe de l’interface publiée.
- [Nouveaux cours, Chromium 414 × 715](recent-realizations-20261012/iphone-recent-courses.png).
- [Portfolio avec preuves ouvertes, Chromium 414 × 896](recent-realizations-20261012/414-project-portfolio.png).
- [Trois projets sur PC 1280 × 900](recent-realizations-20261012/1280-project-portfolio.png).

Les trois dernières captures sont issues de fixtures sans progression personnelle.
La CI finale doit repasser sur le SHA qui contient les libellés raccourcis et le test hors ligne corrigé.
