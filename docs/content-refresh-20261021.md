# Actualisation pédagogique — 21 octobre 2026

## Contenu et conservation

Cette actualisation enrichit sept cours existants : `rc-34`, `rc-35`, `rc-36`,
`rc-39`, `rc-40`, `rc-41` et `rc-42`. Chaque ajout porte sa date, ses sources
et une variante d’exercice corrigée. Leurs défis anglais sont prolongés ;
les mots de vocabulaire existants sont conservés. Les labs `lab-18` à `lab-20`
reçoivent une variante manuelle, sans nouveau correcteur ni validation automatique.

Les 42 cours, 42 fiches initiales, 20 labs, 14 séances Daily Five, 12 preuves,
sept supports historiques et leurs identifiants restent conservés. Les quatorze
références publiques précédentes restent disponibles ; sept sources s’ajoutent.
Les exemples et corrigés antérieurs sont conservés avec leur provenance datée.

Les seules modifications applicatives concernent du contenu public. Aucun
changement des moteurs, états personnels, formats, imports/exports, chiffrement,
synchronisation, authentification, Service Worker, permissions ou workflows.
Les deux autres applications et les PDF ne sont pas modifiés.

## Sources techniques consultées

| Cas | Référence vérifiée | Ce que l’on peut enseigner |
| --- | --- | --- |
| Origine GPS | [PR Race Control #196, fusionnée le 20/10](https://github.com/iPoower/iPoower/pull/196), [code au SHA publié](https://github.com/iPoower/iPoower/blob/120b10d04c63f9cb882157150f647befc287f95c/src/app/trip-view.js) | Utiliser le fix canonique ; refuser une nouvelle programmation invalide sans supprimer les trajets existants. |
| LIVE ROUTE et Route Radar | [Documentation au SHA publié](https://github.com/iPoower/iPoower/blob/120b10d04c63f9cb882157150f647befc287f95c/docs/live-route-premium.md), [noyau de projection](https://github.com/iPoower/iPoower/blob/120b10d04c63f9cb882157150f647befc287f95c/src/app/live-route-core.js), [PR #199 fusionnée](https://github.com/iPoower/iPoower/pull/199) | Simulation distincte du GPS ; relevé de 15 s maximum et précision de 60 m maximum dans ce cas ; prévisions ponctuelles, sans mouvement ou couverture météo inventés. |
| Horodatage GPS | [MDN GeolocationPosition](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPosition), [MDN accuracy](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy), relus le 21/10 | Acquisition, réception et précision sont des informations distinctes ; le seuil d’acceptation appartient au produit. |
| Journey Replay | [Noyau au SHA publié](https://github.com/iPoower/iPoower/blob/120b10d04c63f9cb882157150f647befc287f95c/src/app/journey-replay-core.js) | Prévision archivée et déclaration du conducteur ; aucun accès à la météo actuelle pour reconstituer hier. |
| Publication | [Manifeste figé au commit gh-pages dc858644](https://github.com/iPoower/iPoower/blob/dc858644760c1455631bde25f9b01c2e45e8f37a/race-control/version.json) | Instantané prod-151, source `120b10d04c63f9cb882157150f647befc287f95c`, build `41f1fb5747b9`, horodatage `2026-10-21T03:39:52.008Z`. |
| Projet 2027 | [README Reconversion Control au SHA 82dfcb5](https://github.com/iPoower/Reconversion-Control/blob/82dfcb5489ee19bd216448d2ae185c88c9bf7f62/README.md) | Décision de formation, pièces datées et budget incomplet ; ne pas confondre déclaration et admission ou financement accordé. |
| Control Vault | [README au SHA 07d6de0](https://github.com/iPoower/Control-Vault/blob/07d6de09e60ff36061a9b45bc5bbc07ecdee68a2/README.md), [contrat lot 1 au même SHA](https://github.com/iPoower/Control-Vault/blob/07d6de09e60ff36061a9b45bc5bbc07ecdee68a2/docs/INTEGRATION.md) | Contrat et tests indépendants, sans connexion réelle ; une empreinte ne garantit pas l’authenticité ou la restauration. |

Le manifeste Race Control a aussi été lu par HTTP et son build retrouvé dans
le HTML servi pendant la vérification. Cela confirme le cas daté prod-151,
sans constituer un nouvel audit de toute sa CI. La tête de main était déjà
plus récente (`3ae5149e`, PR #207) : cette tête n’est donc pas annoncée comme
publiée sur la base du manifeste prod-151.

Control Vault reste en Phase 1. La PR #6 était encore ouverte et en brouillon
lors de la lecture ; son contenu n’est pas présenté comme livré. Les blocages
B01–B03 du contrat décrivent le 16/10 : ils ne remplacent pas une analyse des
correctifs ultérieurs dans Race Control et n’attestent aucune activation Drive.

## Formation : références primaires relues le 21/10

- [AIS RNCP37680 — France compétences](https://www.francecompetences.fr/recherche/rncp/37680/) : niveau 6 et échéance 28/02/2027 conservés.
- [TSSR RNCP42463 — France compétences](https://www.francecompetences.fr/recherche/rncp/42463/) : niveau 5, début 01/09/2026, échéance 31/08/2031 et dernière délivrance 31/08/2032 conservés. L’usage encadré de l’IA, les scripts et l’épreuve complète de 7 h avec anglais technique sont explicités.
- [ENI TSSR](https://www.eni-ecole.fr/formations/systeme-et-reseau/formation-technicien-superieur-systemes-reseaux-bac2/) : reconversion annoncée sur 8 mois, distanciel, tests et entretien ; le devis et le calendrier individuels restent à obtenir.
- [Jedha certification](https://www.jedha.co/formation-cybersecurite/formation-cybersecurite-certifiante-financement-cpf), [alternance](https://www.jedha.co/formations/formation-cybersecurite-en-alternance) et [prérequis](https://www.jedha.co/campus/nantes-formation-en-cybersecurite) : déclarations d’école conservées et distinguées du registre officiel. Les mentions de durée et l’expérience de 350 h restent à faire confirmer pour la cohorte choisie.

Le registre ne prouve ni l’habilitation de chaque centre, ni l’admission,
ni l’accord de financement d’un dossier individuel. Aucun profil réel n’est
ajouté aux sources publiques.

## Validation exigée avant livraison

Syntaxe JavaScript, contrôles de contenu/compatibilité et suites de l’application,
puis CI Chromium et WebKit complète sur la tête exacte. Examiner les captures
mobile et bureau. Après fusion : provenance, contrôles du commit fusionné,
déploiement Pages et SHA réellement servi. Les essais navigateur restent des
simulations ; aucun essai sur iPhone physique n’est revendiqué.
