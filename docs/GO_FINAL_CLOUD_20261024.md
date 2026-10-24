# GO FINAL personnel — guide préparé, non exécuté

Auteur : Bryan Fiarda · 24 octobre 2026.

**Aucun GO de fusion, publication, modification administrative, activation ou données réelles n’est déduit de ce guide.**

1. Vérifier ensemble la PR finale, son SHA exact et les trois jobs CI réussis. Contrôler en lecture administrative l’approbateur `iPoower` et l’interdiction du contournement dans `github-pages`. Revoir les risques résiduels ; fusion et déploiement exigent leurs GO séparés.
2. Vérifier le statut du projet Supabase existant. Toute reprise ou réactivation nécessite GO administratif. Lire la table, les politiques, les grants, l’exposition Data API, les réglages Auth/SMTP et les éventuelles lignes existantes sans exporter de données ou de secrets dans le dépôt. L’utilisateur A doit être isolé de B ; rôle anon et anonymous-auth refusés. Ne jamais corriger en désactivant RLS.
3. Dans un projet **de test distinct**, appliquer le schéma de base puis la migration proposée. Tester deux comptes fictifs, OTP, expiration, rotation, déconnexion et révocation ; révision conditionnelle ; réponse perdue et rejeu ; 20 versions ; corruption, récupération et indisponibilité. Les contraintes ajoutées `NOT VALID` exigent une validation séparée après examen des anciennes enveloppes. Vérifier aussi les advisors Supabase. Aucun GO production n’est impliqué.
4. Avant toute donnée personnelle : exporter séparément **PC et iPhone**. Nommer les deux fichiers avec appareil et date ; conserver une copie hors de ces appareils. Vérifier leur réimport dans deux profils de test isolés et comparer toutes les données : cours, SRS, labs, preuves, validations, Daily Five, dossier et historiques. Désigner la source initiale ; ne pas fusionner deux progressions divergentes à la main sans sauvegardes.
5. Après GO explicite de première sauvegarde : connecter le PC dans Sources & privacy, URL et clé publique uniquement. OTP puis phrase longue unique. Mémoriser la session chiffrée seulement sur un appareil privé protégé. Confirmer le premier envoi et relever la révision, l’heure et le reçu. Contrôler le contenu déchiffré dans un profil isolé ; une étiquette verte seule n’est pas une recette.
6. Connecter l’iPhone **physique**, avec le même compte et la même phrase. Lire les deux sources et confirmer la copie voulue. Vérifier tous les domaines, fermer complètement puis rouvrir la PWA et déverrouiller. Vérifier à nouveau les données, le reçu et le message de restauration après réouverture. Ne jamais remplacer une source existante sans ses exports indépendants.
7. Ajouter une progression fictive identifiable et réversible sur iPhone puis la retrouver sur PC ; vérifier le trajet inverse. Tester mode avion, fermeture pendant envoi, modifications hors ligne, reprise et conflit simultané. Consigner séparément : Chromium, WebKit, Supabase de test, iPhone physique, puis données personnelles autorisées. Toute erreur bloque la certification opérationnelle.
8. Après GO final explicite et recette probante, conserver le mode automatique sur les deux appareils. À chaque ouverture, déverrouiller ; attendre la confirmation cloud avant de changer d’appareil. Garder des exports périodiques indépendants. Si la phrase est perdue, exporter immédiatement tout appareil encore lisible ; la sauvegarde chiffrée seule ne permet pas de la retrouver.

## Si un incident survient

- Couper la synchronisation (Déconnecter), conserver les deux appareils et leurs journaux. Exporter la progression visible, même si une bannière signale qu’elle est seulement en mémoire. Ne pas effacer le stockage ni désinstaller.
- Réponse perdue : rouvrir/déverrouiller ; le même paquet de l’outbox est réconcilié avec la révision distante. Ne pas supprimer le journal pour forcer un vert.
- Conflit : comparer les exports, choisir explicitement une source ; les versions remplacées sont conservées avant mutation. Pas de fusion automatique.
- Tête cloud corrompue ou incompatible : « Versions cloud précédentes », choisir une version validée et exporter avant de décider du nouvel état cloud. Une migration d’historique absente signifie que cette option n’est pas disponible ; utiliser l’export indépendant.
- Restauration locale non confirmée : la transaction V3 tente de préserver/restituer la copie antérieure et refuse le succès. Exporter ce qui est encore lisible et conserver les octets d’origine ; ne pas réinitialiser en aveugle.

## Rollback technique

Avant fusion : fermer/laisser la PR non fusionnée, sans impact production. Après une future fusion autorisée : revert ciblé via nouvelle branche et PR, CI complète, déploiement approuvé séparément. Ne jamais supprimer la clé V3, les copies de récupération ou l’outbox pour revenir en arrière. L’ancien client ne connaît pas le nouveau journal : exporter/réconcilier d’abord les envois incertains avant de reprendre un cloud avec cet ancien client.

Le rollback SQL n’est pas une suppression de table : conserver l’historique et les contraintes, arrêter les écritures si nécessaire, puis revoir le trigger séparément avec GO administratif. Ne pas détruire les seules copies chiffrées.
