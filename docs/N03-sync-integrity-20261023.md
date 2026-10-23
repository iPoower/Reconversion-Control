# N03 — intégrité des envois asynchrones — 23 octobre 2026

Préparation de correctif uniquement : aucune fusion, publication, activation cloud ou donnée réelle utilisée.

## Défaut initial et reproduction

Base : `95592b6602e46f8eae42c0b7d6fe7f832ffa9895`. Le SHA-256 de `cloud-ui.js` est `c3d962e88d21d902dee002d0f318316c5629e313bce28f4f6ec1a6d161b128d0`.

Pendant l'envoi de A, une saisie B arrive. Après la réponse, `baseline=local()` acquitte B alors que seul A a été transmis. Le tick suivant peut annoncer « À jour », puis remplacer B par une nouvelle révision distante. En outre, `cloudSnapshot()` partage des objets imbriqués avec l'état actif : `seal()` les sérialise après ses attentes cryptographiques.

Les tests `tests/cloud-ui-races.cjs` ont été exécutés **avant de modifier le contrôleur** : **6/15 réussis, 9/15 en échec**. Les trois chemins (première sauvegarde, envoi automatique, choix local) échouent pendant le chiffrement, après l'envoi et lors de la réception distante suivante. Les six contrôles positifs passent déjà.

Pour reproduire indépendamment : créer un worktree temporaire détaché à la base ci-dessus, y copier seulement `tests/cloud-ui-races.cjs` depuis cette PR, puis exécuter `node tests/cloud-ui-races.cjs`. Le code de production de la base doit rester inchangé ; la commande termine avec le code 1 et neuf cas en échec.

## Correction

Les trois chemins utilisent une même fonction d'envoi. Elle capture le JSON et une copie indépendante **avant le premier await**. La révision et la référence n'avancent qu'après une écriture réussie, jusqu'au JSON réellement transmis. Les modifications suivantes restent détectables, le statut les signale et une nouvelle tentative est planifiée, y compris lors de la première sauvegarde. Le contrôle de modifications locales après lecture/déchiffrement distant reste en place.

Le format V2, l'enveloppe cryptographique, le transport conditionnel, les identifiants de cours, la persistance et les choix de conflit existants sont conservés.

## Vérification

- `node tests/cloud-sync.spec.cjs` : crypto/OTP/révisions et **15/15 cas d'intégrité** après correction ; services simulés, sans réseau.
- `npm test`, pour Chromium et WebKit : trois nouveaux scénarios dans l'application réelle, avec DOM, localStorage et AES-GCM réels. Les requêtes fournisseur sont interceptées ; les écritures sont retardées, une modification passe par les boutons de progression, puis sa persistance et son envoi ultérieur sont vérifiés. Le scénario automatique injecte une nouvelle révision distante et vérifie le choix explicite du conflit.
- Les contrôles pédagogiques, dossier Projet 2027, import/export, stockage bloqué/quota, cours, navigation et cache continuent dans les commandes CI existantes. Aucun workflow n'est modifié par cette PR.

Les résultats CI et le SHA exact sont consultables sur la PR. Les profils navigateur sont simulés : aucun Supabase personnel, compte Google, PC personnel ou iPhone physique n'a été testé. Un échec de restauration simulé intervient avant mutation ; il ne prouve pas la récupération après un échec partiel d'écriture sur plusieurs clés locales. La résolution des conflits reste un remplacement choisi, sans fusion par champ. Ce correctif ne récupère pas une progression déjà perdue et ne constitue pas une autorisation d'activation ou de production.
