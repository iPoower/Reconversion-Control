# NOESIS-RCC-001 — Restauration atomique (proposition technique)
Date : 23 octobre 2026 · Base `f3dddaf591b515eeee103538b33f199a1db955c5` · Aucune fusion ni publication autorisée.

## Défaillance historique
La restauration cloud et l'import écrivaient `reconversion-control.daily-five.v1` et `reconversion-control.state.v1` séparément. Les exceptions de `storageSet()` étaient masquées. Une erreur de quota lors de la seconde écriture permettait un état mêlé au rechargement, avec acquittement possible par `cloud-ui.js`.

## Changement proposé
- Le nouvel instantané local `reconversion-control.snapshot.v3` est un objet `{version:3,main,daily}`, écrit par **un seul** `localStorage.setItem`, puis relu intégralement avant accusé.
- Toutes les sauvegardes ordinaires migrent d'abord vers cet instantané atomique. Dès son existence, `load()` et `dailyLoad()` l'utilisent tous les deux, quel que soit l'état des anciennes clés.
- L'import JSON et `cloudRestore()` valident les données puis confirment cet instantané **avant** de remplacer l'état en mémoire ; si la lecture/écriture échoue, ils refusent l'accusé de succès.
- Les anciennes clés ne sont pas purgées pendant migration/restauration. Elles restent des miroirs de compatibilité **non autoritaires** ; leur écriture peut échouer sans invalider l'instantané déjà confirmé. Une application ancienne peut lire ces miroirs sans connaître leur statut : ne pas déployer deux versions concurrentes sur la même origine.
- Si un instantané V3 existe mais n'est pas lisible ou valide, aucune écriture ne le remplace ; une bannière indique le blocage pour éviter un effacement silencieux.
- La réinitialisation volontaire en interface n'efface les clés historiques qu'**après** validation du nouvel instantané vide.

## Recette et réserves
`node tests/atomic-restoration.cjs` (appelé depuis la CI Chromium/WebKit) : erreurs de quota, relecture perdue, migration, état historique, reprise et idempotence. Les vérifications atomiques fonctionnent avec la **fonction réelle extraite de app.js** et `localStorage` synthétique à fautes injectées ; elles ne prouvent pas le comportement d'un iPhone physique.

Autres contrôles : exécuter `node tests/cloud-ui-races.cjs`, `node tests/cloud-sync.spec.cjs`, l'import JSON et les tests du navigateur. Les résultats CI du SHA de la PR doivent être lus avant revue. Les erreurs de stockage multi-onglets et les conflits simultanés entre onglets ne sont **pas** résolus par cette PR : localStorage ne fournit aucun CAS inter-onglets. Prévoir une phase distincte avec verrou exclusif et retour utilisateur explicite plutôt qu'un dernier écrivain silencieux.

Une restauration physique, une migration d'origine, l'activation Supabase et une publication nécessitent toujours des autorisations distinctes. Aucun jeton, donnée personnelle ou backend réel n'est touché par cette PR.

## Repli sûr
Ne pas supprimer la clé V3. En cas de régression, conserver **toutes** les valeurs exportées avec une copie chiffrée hors de l'appareil et préparer un lecteur/migrateur de récupération avant rollback. Un simple retour de version qui ignorerait V3 peut présenter des clés historiques plus anciennes : il **ne constitue pas** un rollback des données.
