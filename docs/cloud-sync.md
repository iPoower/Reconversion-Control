# Sauvegarde chiffrée PC ↔ iPhone — candidat du 24 octobre 2026

Auteur : Bryan Fiarda. Développement autorisé, **aucune mise en service personnelle**.
Base vérifiée : `2ab4c0f74c74b5ad430e10032ae810708113b3f0` (PR #31).

## Fonctionnement quotidien prévu

1. Les saisies sont d’abord enregistrées dans `reconversion-control.snapshot.v3` et relues. Un seul onglet a le Web Lock d’écriture. Un onglet obsolète, un quota ou un stockage illisible suspendent le cloud.
2. Après activation volontaire et déverrouillage, les modifications persistantes déclenchent un envoi différé d’environ 2 secondes. Vérification de révision toutes les 30 secondes au premier plan lorsque la copie locale est inchangée ; lecture complète au moins toutes les 10 minutes, ainsi qu'aux modifications locales, reprises réseau, retours au premier plan et actions manuelles. Une lecture de révision ne crée aucun reçu et ne change pas l'heure de la dernière confirmation. Révision différente, disparition, erreur ou horloge reculant imposent une lecture complète. Échecs : reprise progressive jusqu’à 60 secondes.
3. Le paquet cloud existant V2 contient la projection métier complète de l’instantané local V3 : progression, révisions SRS, labs, preuves, validations, Daily Five et dossier. La navigation propre à l’appareil, les secrets et journaux cloud sont exclus. Pas de second format concurrent ni de migration des enveloppes existantes.
4. Le JSON est figé avant toute attente cryptographique. L’enveloppe chiffrée et l’empreinte sont écrites/reluées dans une outbox locale avant la requête. Une modification survenue ensuite reste en attente.
5. Une révision est acquittée seulement après relecture du **même** paquet sur le serveur à la révision attendue. Une réponse perdue peut signifier que l’écriture a réussi. La reprise réutilise exactement le même ciphertext ; elle ne génère pas une nouvelle sauvegarde au hasard.
6. Les reçus sont persistants et séparés par projet + utilisateur authentifié. Sans reçu antérieur, un choix de source est obligatoire ; même un cloud vide demande confirmation avant le premier envoi. Au retour, une divergence impose un choix, sans fusion automatique. Une version vide ne remplace pas automatiquement une progression existante.
7. Une restauration est validée avant mutation, passe par le commit atomique et sa relecture, puis est comparée intégralement. Une copie de récupération indépendante du snapshot principal est conservée avant remplacement. L’interface distingue relecture immédiate et vérification après réouverture.

## Connexion et secrets

Par défaut, la session reste en mémoire. Option explicite « Mémoriser la session chiffrée sur cet appareil privé » : access token + refresh token sont persistés **chiffrés par la phrase**, avec un domaine AAD distinct de la progression. L’URL et la clé publique sont mémorisées sans secret. Aucun mot de passe, phrase ou jeton en clair n’entre dans les exports de progression, journaux ou URL.

Après fermeture : saisir la phrase, puis le client vérifie la session auprès de Supabase et la renouvelle si nécessaire. Un code email redevient nécessaire si le fournisseur l’a révoquée, si la session mémorisée a disparu ou si l’utilisateur se déconnecte. La rotation des refresh tokens est sérialisée dans ce client ; l’application n’autorise qu’un onglet écrivain. Aucun déverrouillage automatique après redémarrage sans secret local.

La mémorisation chiffrée réduit le risque d’extraction au repos ; elle ne protège pas d’un script malveillant exécuté dans la page déverrouillée. Ce risque existe aussi pour la progression locale en clair. Utiliser une phrase longue et unique et le verrouillage système. Éviter le PC partagé. Sur un iPhone perdu, révoquer la session chez Supabase ; un access token déjà émis peut rester valable jusqu’à expiration. La déconnexion de l’application supprime la session locale et demande la révocation de cette session seulement (`scope=local`), en signalant un éventuel échec réseau.

## Chiffrement et limites de taille

- AES-256-GCM, AAD authentifié, PBKDF2-SHA256 250 000 itérations conservées pour compatibilité V1, sel aléatoire de 16 octets et IV aléatoire de 12 octets à chaque paquet. La phrase n’est jamais envoyée.
- Validation stricte de l’enveloppe, base64 canonique, refus des versions inconnues, des données altérées, des champs perdus par normalisation et des clés dangereuses. Validation métier avant toute restauration.
- 2 097 136 octets de JSON maximum avant chiffrement ; 2 097 152 octets chiffrés. Base64 traité par blocs. Réponses HTTP bornées et délai de 20 secondes ; un timeout d’écriture reste ambigu.
- Seuls ciphertext, métadonnées cryptographiques, identifiant utilisateur, révision et dates sont visibles côté serveur. Ces métadonnées ne sont pas anonymes.
- Une phrase perdue empêche de déchiffrer cloud et session mémorisée. Une copie locale encore lisible peut être exportée avant réinitialisation ; sans copie lisible ni phrase, aucune récupération magique.

## Historique et récupération

Migration proposée dans `supabase/migrations/*_encrypted_cloud_history.sql`, **non appliquée**. Elle conserve les 20 dernières révisions chiffrées par utilisateur, dont la tête, dans une table en lecture seule pour le client. Un trigger privé contrôle le propriétaire, l’incrément exact des révisions et l’archivage transactionnel ; les champs métier en clair sont refusés. Son `SECURITY DEFINER` est limité à cette fonction de trigger dans un schéma non exposé, `search_path` vide, droits d’exécution retirés aux rôles publics. La RLS reste active ; les utilisateurs anonymes et les connexions anonymes authentifiées sont exclus.

L’archivage démarre au prochain envoi : il ne recrée aucune version passée. Vingt versions rapprochées ne remplacent pas un export durable hors appareil. La liste ne télécharge que les numéros ; un seul paquet est chargé pour une récupération. Une version historique restaurée suspend la synchronisation et nécessite une nouvelle décision.

Trois copies locales de récupération au maximum sont conservées séparément du snapshot V3 ; tout échec de leur écriture bloque le remplacement. « Exporter la dernière copie de récupération » produit un JSON réimportable par l’import existant. Elles restent sur l’appareil et disparaissent aussi si son stockage est entièrement supprimé. Toujours conserver un export indépendant sur un autre support avant première synchronisation.

## État administratif constaté

Au 24/10/2026, le connecteur Supabase retourne le projet `reconversion-control`, créé le 08/10/2026, région `eu-west-3`, statut **INACTIVE**. Il n’a pas été réactivé. Son schéma, ses politiques effectives et son SMTP actuels n’ont pas été certifiés. Aucun OTP personnel ni accès à une progression personnelle n’a été déclenché.

Le dépôt conserve le workflow Pages sur `github-pages`, les SHA d’actions et le contrôle de provenance, sans changement du workflow de publication. La lecture de la configuration administrative de cet environnement n’est pas disponible via le connecteur GitHub : les exigences approbateur `iPoower` / interdiction du contournement restent à revérifier avant une future fusion. Aucun paramètre n’a été modifié.

## Configuration — préparée, GO distinct requis

Voir `GO_FINAL_CLOUD_20261024.md`. Avant activation : vérifier le statut projet, le schéma existant, les grants **et** la RLS, les sessions multiappareils et l’envoi d’un OTP. Le modèle email doit fournir `{{ .Token }}`. Depuis le 03/06/2026, la personnalisation des modèles de nouveaux projets Free utilisant le SMTP par défaut peut être restreinte ; vérifier l’offre et le SMTP effectifs. Ne pas supposer que le projet d’octobre peut être configuré comme un ancien projet.

Ne jamais saisir une clé `service_role` ou `sb_secret_` dans le navigateur ; le client n’accepte que `sb_publishable_…`. Ne jamais désactiver RLS pour résoudre une erreur. Les politiques de test isolé ne certifient pas celles du projet personnel.

## Validation et limites réelles

Commandes reproductibles dans `TESTING.md`. Tests HTTP simulés + vraie cryptographie, contrôleur, DOM, localStorage, deux profils Chromium/WebKit ; SQL PostgreSQL WASM isolé avec `auth.uid()`/JWT simulés. Ces preuves ne valident ni le service Auth hébergé, ni le SMTP, ni l’état RLS de production, ni les pannes physiques du téléphone.

Une PWA suspendue ou fermée sur iOS n’exécute pas continuellement le réseau : reprise après réouverture et déverrouillage. La relecture après fermeture de page prouve la persistance du profil navigateur de test ; elle ne prouve pas un iPhone physique ni un redémarrage matériel. Si un navigateur ne propose pas Web Locks ou perd le verrou après suspension, exporter toute saisie en mémoire puis fermer les autres onglets et recharger.

Références officielles consultées le 24/10/2026 :
- Modèle de menaces et limites : `cloud-security-model.md`.
- Mesures reproductibles sans compte ni réseau Supabase : `node tests/cloud-storage.cjs`, résultats et projections dans `cloud-storage-measures.md`. Gzip/Brotli y restent des objets d'étude, refusés comme DTO par l'application actuelle ; aucun protocole compressé n'est activé.
- https://supabase.com/docs/guides/auth/sessions
- https://supabase.com/docs/guides/auth/signout
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier
- https://supabase.com/changelog/cbc-tls-ciphers-deprecated (retrait annoncé de suites TLS anciennes à partir du 10/11/2026 ; compatibilité appareil réel à vérifier)
- https://pglite.dev/docs/ (moteur SQL isolé, dépendance de test uniquement)
