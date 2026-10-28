# Modèle de menaces — sauvegarde chiffrée

Auteur : Bryan Fiarda. Révision : 24 octobre 2026. Périmètre : Reconversion Control uniquement.

Ce modèle reprend les mécanismes existants ; il ne certifie pas un service personnel ni un iPhone physique. Les migrations, le code testé, le service hébergé et la recette personnelle ont des preuves distinctes.

## Frontières de confiance et invariants

| Surface / menace | Invariant et contrôle | Preuve attendue |
| --- | --- | --- |
| Navigateur, import, DOM / XSS | Validation métier stricte, refus des champs perdus/inconnus et clés dangereuses ; échappement HTML des données privées ; CSP script-src self sans unsafe-inline ni unsafe-eval | project-checks, project.spec, cloud-final-mile et tests CSP |
| PWA / cache obsolète | Assets limités au périmètre local, build identifié, aucun cache de réponse Supabase ; reprise à la réouverture | sw.spec, tests de provenance et réouverture navigateur |
| Persistance / quota, deux onglets | Snapshot V3 écrit et relu avant cloud ; Web Lock ; un état non confirmé bloque l'envoi ; restauration atomique et rollback vérifié | atomic-restoration, atomic-restoration-browser, storage-multitab |
| Phrase et session / vol au repos | Phrase en mémoire ; option de session persistante chiffrée et domaines progression/session séparés ; pas de jeton en clair dans export ou logs | cloud-final-mile et captures de logs fictifs dans les tests navigateur |
| HTTP / CSRF, fuite, réponse perdue | HTTPS Supabase uniquement ; Bearer explicite, credentials omit, redirects refusés, no-store ; outbox persistante et relecture exacte | cloud-sync, cloud-final-mile et scénario navigateur de réponse perdue |
| API / IDOR, BOLA | Identité Supabase vérifiée ; SELECT/INSERT/UPDATE limités au propriétaire ; anon et anonymous-auth refusés ; aucune clé serveur dans le client | tests SQL sous rôles distincts, catalogue et contrôles Data API du projet confirmé |
| PostgreSQL / concurrence, rejeu | Révision initiale 1 puis incrément exact ; PATCH conditionnel sur révision précédente ; un acquittement exige la même enveloppe relue | cloud-history, cloud-final-mile, cloud-ui-races |
| Enveloppe incomplète | CHECK explicitement IS TRUE ; kdf:null et autres formes malformées refusés ; refus sans modification de tête ou d'historique | groupe de régression SQL de la PR #33 |
| Fonction privilégiée | Archivage par trigger privé capture_progress, search_path vide, noms qualifiés, droits EXECUTE/USAGE retirés aux clients ; aucun appel client au helper Supabase d'auto-RLS préexistant, dont le trigger reste actif | catalogue pg_proc / pg_namespace, refus des appels directs, test de création de table annulé après contrôle de RLS |
| Historique / corruption, effacement | 20 révisions par propriétaire (préparé, non appliqué : + dernière révision de chacun des 30 derniers jours UTC, `20261028120000_history_daily_retention.sql`), archivage et élagage dans la transaction ; clients en lecture seule ; export indépendant avant remplacement | cloud-history, récupération navigateur et contrôles réversibles hébergés autorisés |
| CI/CD / chaîne logicielle | Dépendances verrouillées, actions et image SHA épinglées, permissions minimales, PR SHA exact ; Pages séparé et protégé | npm audit, CI et tests test_pages*.py |

Le stockage canonique actuel est localStorage, pas IndexedDB. Il contient la progression locale lisible ; l'outbox et la session mémorisée sont chiffrées. Les préfixes de clés ne constituent pas une isolation entre sites partageant une même origine.

## Limites explicites

- Une compromission du JavaScript autorisé sur l'origine, une extension malveillante ou un appareil déverrouillé compromis peut lire les données disponibles dans la page. CSP et échappement réduisent les injections ; ils ne remplacent pas l'intégrité de l'hébergement, les mises à jour et le verrouillage de l'appareil.
- Les domaines AAD séparent progression et session. Une enveloppe authentifiée ne prouve pas, à elle seule, qu'elle est la dernière version : un opérateur serveur privilégié peut supprimer ou rejouer des données. Les révisions, reçus locaux, copies de récupération et exports indépendants sont complémentaires ; aucun serveur unique n'est une garantie absolue de disponibilité.
- Le client refuse une révision distante inférieure ou un contenu différent à la même révision. Un appareil neuf exige toujours un choix de source et une vérification humaine avant remplacement.
- Liaison au contexte (rejeu/rollback) : les nouvelles enveloppes de progression gardent la forme V1 imposée par la contrainte SQL, mais leur AAD AES-GCM vaut `reconversion-control-progress-v2|<user_id>|<révision cible>`. Une ancienne enveloppe resservie sous une révision supérieure, ou l'enveloppe d'un autre compte, ne s'ouvre plus et n'est jamais appliquée. Les enveloppes historiques à AAD constante restent lisibles tant que cet appareil n'a acquitté aucune enveloppe liée pour ce compte ; ensuite le refus est persistant (`bound:true` dans le journal par compte). Une tête au format ancien refusée devient un conflit explicite : seul « Envoyer cet appareil » est possible, après copie locale de l'ancienne version. Les copies de préservation et la récupération explicite d'une version d'historique acceptent encore l'ancien format. Les enveloppes de session ne changent pas.
- Limite assumée : sans racine de confiance externe, aucun client ne peut prouver la fraîcheur absolue. Un appareil neuf (sans reçu) ne détecte ni un gel du serveur ni une ancienne enveloppe au format historique ; il exige seulement un choix explicite. Un serveur peut toujours retenir ou supprimer des versions (disponibilité). Pendant la transition, un client antérieur ne sait pas lire une enveloppe liée : il affiche « Déchiffrement impossible », conserve sa progression locale et n'écrase rien (écritures conditionnelles, préservation obligatoire avant envoi explicite) ; il faut le mettre à jour.
- La phrase de chiffrement perdue n'est pas récupérable depuis Supabase. Exporter toute copie locale encore lisible avant une réinitialisation.
- Une PWA iOS fermée/suspendue ne garantit pas de tâche réseau permanente. Chaque reprise vérifie la session et la source avant synchronisation.

## Compression et KDF

Les enveloppes V1 restent lisibles, avec AES-256-GCM, sels/IV aléatoires et PBKDF2-SHA256 250000 itérations. Une augmentation du KDF doit être versionnée et testée sur l'iPhone cible ; aucun changement aveugle des paramètres existants n'est acceptable.

Gzip et Brotli sont mesurés uniquement dans un banc d'essai isolé, avant chiffrement. Les objets d'étude sont explicitement distincts du DTO métier et ne doivent jamais être envoyés comme une sauvegarde applicative. Leur encodage est chiffré/authentifié, la décompression est bornée et son résultat est comparé intégralement à la source. Les essais Node ne prouvent pas une implémentation de décompression dans WebKit.

Le format V1 déployé ne transporte pas de négociation de compression. Une adoption requiert un nouveau contrat authentifié, compatibilité de lecture, limites de mémoire en flux et analyse de l'oracle de longueur lorsque des champs privés sont compressés avec du texte importé. L'étude n'active donc aucune compression en production. Les économies immédiatement compatibles viennent du DTO métier, de l'absence d'envoi identique, du regroupement des modifications et de lectures de révision légères sans nouvel acquittement.

## Critères de mise en service

Tout défaut critique ou élevé confirmé et non maîtrisé bloque l'activation. Des tests locaux ou CI verts ne remplacent ni les vérifications du bon projet, ni la délivrabilité OTP, ni la recette PC ↔ iPhone physique. Aucune fusion, publication, création d'utilisateur personnel ou progression réelle n'est autorisée par ce document.
