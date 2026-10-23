# Actualisation pédagogique — 23 octobre 2026

Quatre cours existants sont enrichis : `rc-37` (révisions et reprise),
`rc-38` (environnement de test), `rc-39` (version réellement servie), `rc-42`
(métadonnées A2). Les exercices corrigés, défis anglais et variantes manuelles de
`lab-17`, `lab-18`, `lab-20` suivent ces cas. Aucun ancien texte, vocabulaire,
prérequis ou identifiant n’est retiré ; les 42 cours, 20 labs et 14 Daily Five
restent conservés.

## Sources et portée des nouveautés

- **Révisions concurrentes et collision de contenu** : [documentation au SHA 61da14f](https://github.com/iPoower/iPoower/blob/61da14f353ace95e8a477d651eca8678ac3ced0f/docs/sync-revisions.md), [moteur](https://github.com/iPoower/iPoower/blob/61da14f353ace95e8a477d651eca8678ac3ced0f/src/sync-revisions.js), [tests](https://github.com/iPoower/iPoower/blob/61da14f353ace95e8a477d651eca8678ac3ced0f/tests/test_sync_revisions.js). La [PR #228](https://github.com/iPoower/iPoower/pull/228) bloque deux contenus sous le même identifiant, même avec des métadonnées égales. Les têtes concurrentes et les conflits restent visibles ; les copies ne sont pas supprimées.
- **File d’envoi locale d’abord** : [garanties et travaux restants](https://github.com/iPoower/iPoower/blob/61da14f353ace95e8a477d651eca8678ac3ced0f/docs/sync-guarantees.md), [moteur pur](https://github.com/iPoower/iPoower/blob/61da14f353ace95e8a477d651eca8678ac3ced0f/src/sync-outbox.js), [tests](https://github.com/iPoower/iPoower/blob/61da14f353ace95e8a477d651eca8678ac3ced0f/tests/test_sync_outbox.js). Un travail à la fois, reprise des mêmes octets et du même identifiant réservé ; reconnexion, code, quota et conflit exigent une action explicite. Le raccord, la persistance par l’appelant et le verrou inter-onglets restent à faire. D1/D2/D3 ne sont pas chargés par le build étudié.
- **CI reproductible** : [PR #226](https://github.com/iPoower/iPoower/pull/226), [run 39883415398](https://github.com/iPoower/iPoower/actions/runs/39883415398) au SHA `61da14f353ace95e8a477d651eca8678ac3ced0f`. Unitaires, confidentialité, six lots navigateur, validation agrégée et job de publication réussis. Le rollback conditionnel est ignoré dans cette exécution normale. La [documentation officielle Playwright Docker](https://playwright.dev/docs/docker), relue le 23/10, distingue le contenu de l’image du paquet à installer ; leurs versions doivent correspondre. Cette étude ne modifie aucun workflow de Reconversion Control.
- **Main n’est pas le manifeste** : à la lecture HTTP du 23/10, [version.json](https://ipoower.github.io/iPoower/race-control/version.json) et [HTML](https://ipoower.github.io/iPoower/race-control/) concordent toujours sur prod-157, source `6340b45efabe2adac885faec9e41f76c37e6b573`, build `50988798eb7c`, horodatage `2026-10-22T03:51:51.867Z`. Le [manifeste figé à 6addbf6](https://github.com/iPoower/iPoower/blob/6addbf6a98d64d4e4db733358a865e6b1a3e2b6d/race-control/version.json) conserve cette preuve. Le [run Cloudflare 39885455852](https://github.com/iPoower/iPoower/actions/runs/39885455852) est réussi ; [son workflow au SHA étudié](https://github.com/iPoower/iPoower/blob/61da14f353ace95e8a477d651eca8678ac3ced0f/.github/workflows/cloudflare.yml) peut s’arrêter sans publier et ne reprend qu’un build compatible avec gh-pages. Aucune identité HTTP Cloudflare nouvelle n’est déduite de ce seul résultat. Le cas d’échec du 22/10 reste une archive datée.
- **Transport A2 préparé** : [lot A2](https://github.com/iPoower/Control-Vault/blob/74ba9d89537e8582cf4916c566f7f53c5da1c530/docs/OPAQUE_DRIVE_SYNC_A2.md), [contrat commun](https://github.com/iPoower/Control-Vault/blob/74ba9d89537e8582cf4916c566f7f53c5da1c530/docs/INTEGRATION_SYNC_A2.md), [tests du transport](https://github.com/iPoower/Control-Vault/blob/74ba9d89537e8582cf4916c566f7f53c5da1c530/tests/unit/opaque-drive.test.ts). La PR #12 est fusionnée ; [Pipeline 39892903080](https://github.com/iPoower/Control-Vault/actions/runs/39892903080) est réussi. Les métadonnées sont figées et relues mais restent non authentifiées ; le propriétaire doit authentifier le paquet et comparer `rev`. Le [produit](https://github.com/iPoower/Control-Vault/blob/74ba9d89537e8582cf4916c566f7f53c5da1c530/src/app.ts) instancie encore `DemoDrive` et exclut le fournisseur préparé. Les essais de réseau fictif ne prouvent ni service réel, ni restauration complète, ni iPhone physique.
- **Référence API** : [Google Drive — propriétés personnalisées](https://developers.google.com/workspace/drive/api/guides/properties), relue le 23/10. `appProperties` est réservé à l’application ; la limite de 124 octets UTF-8 comprend clé et valeur. Le fait de lister une propriété ne prouve pas l’authenticité du contenu chiffré.

## Formation : bloc, titre et expérience

Les registres [AIS RNCP37680](https://www.francecompetences.fr/recherche/rncp/37680/)
et [TSSR RNCP42463](https://www.francecompetences.fr/recherche/rncp/42463/) et le
[parcours ENI](https://www.eni-ecole.fr/formations/systeme-et-reseau/formation-technicien-superieur-systemes-reseaux-bac2/)
sont relus le 23/10 : niveaux et dates repris dans l’application inchangés.

La [FAQ certifications de Jedha](https://www.jedha.co/financement-formations/certifications-jedha-tout-ce-quil-faut-savoir)
annonce 140 h de stage pour le bloc n°3 AIS visé par Essentials et 350 h pour le
titre complet visé par Fullstack. La [page Nantes](https://www.jedha.co/campus/nantes-formation-en-cybersecurite)
présente plusieurs formes d’expérience pour les 350 h. L’application conserve
ces déclarations distinctes et demande les modalités écrites du parcours choisi.
Les 350 h ne sont plus attribuées à la seule page alternance : celle-ci annonce
16 mois et garde une section à 12 mois, à faire préciser. Une attestation de fin
de formation ne vaut pas obtention du bloc ou du titre. Aucune admission,
habilitation individuelle, prise en charge ou dispense n’est inventée.

## Périmètre et validation

Le dépôt Reconversion Control ne contient aucun AGENTS.md ou CLAUDE.md au SHA
de départ `74f63701551fc67c8bd4abebae89857569ee7e5b`. Aucune PR concurrente
ouverte n’est constatée au début de la revue. Les consignes des deux dépôts sources
sont lues ; ces projets restent en lecture seule.

Seuls les contenus publics et leurs assertions de comptage changent :
27 → 33 références pédagogiques, 6 → 7 références du dossier formation, ajout
du domaine officiel Playwright à la liste des références. Les assertions de
progression, confidentialité et compatibilité restent conservées. Les comparaisons
structurelles vérifient la conservation des sections, exercices antérieurs,
vocabulaires, critères de labs et identifiants.

L’environnement local est devenu indisponible avant l’exécution des contrôles.
Les contrôles complets doivent donc réussir en CI sur la tête exacte avant
fusion ; aucun test local non exécuté n’est présenté comme réussi.
La publication doit ensuite être distinguée de la fusion et du commit réellement
servi. Les contrôles navigateur restent des simulations, sans recette iPhone physique.

Aucune modification des moteurs de données personnelles, progression, sauvegarde,
import/export, synchronisation, chiffrement, authentification, Service Worker,
workflows ou infrastructure. Aucun profil privé publié, aucune écriture dans
les deux projets sources ni dans les deux PDF.
