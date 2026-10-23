# N02 — préparation de la sécurisation CI/CD — 23 octobre 2026

Deuxième PR indépendante de N03, depuis `95592b6602e46f8eae42c0b7d6fe7f832ffa9895`. Aucune fusion, publication ou modification de permissions/secrets/réglages administrateur effectuée. Cette PR ne contient pas le correctif de synchronisation N03.

## Défaut initial

`workflow_dispatch` satisfaisait le gate de `deploy` sans tests complets, provenance de PR ni origine de run imposées. La syntaxe JavaScript seule était contrôlée. Le site était conditionné depuis tout le répertoire de travail, sans vérification explicite du contenu de l'archive. Cinq références directes d'actions étaient mobiles.

Les trois tests initiaux de `tests/test_pages_workflow.py` ont été exécutés sur les workflows de la base avant correction : **3/3 en échec** (chemin manuel, références mobiles, absence de contrôle explicite d'artefact). Aucune publication de démonstration n'a été déclenchée. Pour reproduire, copier ce fichier de tests dans un worktree temporaire détaché à la base et exécuter `python3 -m unittest discover -s tests -p test_pages_workflow.py` : les trois contrôles initiaux échouent ; le contrôle additionnel de conservation des permissions passe.

## Correction et provenance

1. Suppression du déclencheur manuel. Le gate de job exige `workflow_run`, conclusion réussie, événement `push`, branche `main` et même dépôt source/cible.
2. Le vérificateur recoupe l'événement avec l'API GitHub : chemin et nom du workflow, ID et tentative, SHA complet, branche et dépôts, run achevé et réussi. Il exige les jobs provenance, Chromium et WebKit achevés et verts sur la même tentative/SHA. Métadonnées incomplètes, job absent/dupliqué/non vert et erreur API bloquent.
3. Le SHA doit être le `merge_commit_sha` d'une PR fusionnée vers ce `main`, pas seulement un commit ayant une association de PR. Le SHA doit rester la tête de `main` ; le checkout doit lui correspondre.
4. Une liste de 20 fichiers publics est lue depuis les **blobs Git du SHA testé**. Les fichiers non suivis, dépendances, tests, workflows, SQL et documents ne sont pas embarqués. Seuls les marqueurs existants dans `index.html` et `sw.js` sont remplacés par le SHA. Un manifeste public contient dépôt, SHA, run/tentative de validation et SHA-256 des fichiers publics ; aucune information personnelle.
5. Le composite Pages figé archive ce répertoire. Le vérificateur compare les octets du site et les membres réels du tar aux blobs attendus, refuse liens, entrées supplémentaires/dupliquées, chemins traversants et contenu modifié. Aucun tar téléchargé ni code de PR n'est exécuté par ce contrôle.
6. Avant `deploy-pages`, les métadonnées de validation et la tête de `main` sont relues. L'ID retourné par l'upload doit désigner un artefact non expiré de **ce run de publication**, au SHA/nom attendus, avec empreinte de plateforme. Le déploiement sélectionne ce nom unique au SHA. Le SHA-256 du tar est journalisé ; l'empreinte de plateforme désigne le conteneur d'artefact GitHub, pas le tar lui-même.

Le site est conditionné depuis le commit entièrement testé, avec substitution des marqueurs d'identité et ajout du manifeste. Il ne s'agit pas de réutiliser un artefact de test non fiable ni de prétendre que la matrice navigateur a déjà servi le manifeste de publication.

Les blocs `permissions` existants des deux workflows sont conservés à l'identique et testés. `configure-pages` ne demande plus l'activation automatique du site (`enablement: true` retiré) ; il utilise le site déjà configuré. Aucun paramètre administrateur n'est changé par ce travail.

## Actions figées et sources officielles relues le 23/10/2026

Les SHA correspondent aussi aux logs des derniers runs réussis de la base : [tests 39929042603](https://github.com/iPoower/Reconversion-Control/actions/runs/39929042603), [publication 39929648210](https://github.com/iPoower/Reconversion-Control/actions/runs/39929648210).

| Action | Commit officiel figé |
| --- | --- |
| checkout v6 | [d23441a48e516b6c34aea4fa41551a30e30af803](https://github.com/actions/checkout/tree/d23441a48e516b6c34aea4fa41551a30e30af803) |
| setup-node v6 | [249970729cb0ef3589644e2896645e5dc5ba9c38](https://github.com/actions/setup-node/tree/249970729cb0ef3589644e2896645e5dc5ba9c38) |
| configure-pages v5 | [983d7736d9b0ae728b81ab479565c72886d7745b](https://github.com/actions/configure-pages/tree/983d7736d9b0ae728b81ab479565c72886d7745b) |
| upload-pages-artifact v4 | [7b1f4a764d45c48632c6b24a0339c27f5614fb0b](https://github.com/actions/upload-pages-artifact/blob/7b1f4a764d45c48632c6b24a0339c27f5614fb0b/action.yml) |
| dépendance interne upload-artifact v4.6.2 | [ea165f8d65b6e75b540449e92b4886f43607fa02](https://github.com/actions/upload-artifact/tree/ea165f8d65b6e75b540449e92b4886f43607fa02) |
| deploy-pages v4 | [d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e](https://github.com/actions/deploy-pages/tree/d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e) |
| captures upload-artifact v7.0.2, déjà figé | [cf430e030ddbb5b0abf93d22962f4752f3646cd9](https://github.com/actions/upload-artifact/tree/cf430e030ddbb5b0abf93d22962f4752f3646cd9) |

Autres références primaires : [workflow_run et précautions de privilèges](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run), [métadonnées des runs](https://docs.github.com/en/rest/actions/workflow-runs), [métadonnées et empreintes d'artefacts publics](https://docs.github.com/en/rest/actions/artifacts#get-an-artifact).

## Validation et limites

`python3 -m unittest discover -s tests -p 'test_pages*.py'` : **20 tests réussis**, avec sous-cas de refus. Les quatre commandes CLI sont aussi parcourues avec API simulée, vrais blobs Git et vrai GNU tar, **sans commande de déploiement**. Les deux YAML sont analysés localement avec détection des clés dupliquées. La matrice CI conserve les contrôles de contenu, transport chiffré, dossier Projet 2027, navigation, cours et cache Chromium, ainsi que WebKit. La PR expose le SHA exact et les résultats CI.

En lecture seule, le vérificateur accepte les vraies métadonnées du run historique `39929042603` au SHA `95592b6…` : ses trois jobs réussis et la PR fusionnée correspondent. Les lectures publiques de métadonnées de run et de l'artefact historique `12490772994` sont accessibles sans élargir les droits. Ces contrôles ne sont pas une exécution du nouveau déploiement.

La publication réelle du nouveau workflow reste **non testée**, conformément à l'interdiction de fusion/publication. Une future publication devra confirmer le parcours avec l'environnement et le token existants ; toute erreur d'accès bloque. Les protections natives de branche, l'environnement GitHub Pages, l'image du runner, le fournisseur GitHub et les comptes autorisés restent des frontières de confiance inchangées. Un propriétaire autorisé à modifier les workflows peut modifier leurs contrôles. Un changement de tête de `main` reste possible dans le bref intervalle entre la dernière lecture et l'appel Pages : aucun verrou atomique administratif n'est ajouté. La liste publique doit être revue si une ressource publique est ajoutée ultérieurement.
