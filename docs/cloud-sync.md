# Synchronisation PC / iPhone — configuration privée

Le client est livré **désactivé**. La V2.1 locale reste utilisable normalement,
y compris sans réseau. Il n'existe pas de serveur Supabase configuré par défaut :
les travaux sur ce dépôt ne créent pas de projet Supabase.

## Configuration (une seule fois par projet)

1. Crée un projet personnel sur <https://supabase.com>, active Auth → Email.
2. Dans les modèles d'email, remplace le Magic Link par une notification contenant
   le jeton **`{{ .Token }}`**. Sans ce changement, la page de connexion OTP
   ne fonctionne pas : le modèle par défaut peut envoyer un lien à cliquer.
3. Dans le SQL Editor privé, exécute le fichier `sql/reconversion_progress.sql`.
   Il crée une table avec **RLS** : chaque utilisateur authentifié n'accède
   qu'à sa propre ligne. Teste séparément les politiques avec deux comptes.
4. Dans Reconversion Control → Sources & privacy → Synchronisation, saisis
   l'URL **https://<projet>.supabase.co**, la clé publique **sb_publishable_…**
   et une adresse email. **Ne jamais** entrer une clé `service_role`,
   `sb_secret_`, un mot de passe ou une clé d'administration dans le dépôt.
5. Saisis le code reçu puis la **même phrase de chiffrement** (12 caractères
   minimum) sur PC et iPhone. Une copie chiffrée est créée pour le premier
   appareil. Sur le second, sélectionne explicitement la progression à conserver.

## Contrat technique

- Authentification Supabase email OTP, bearer JWT ; table restreinte par RLS.
- Chiffrement **dans le navigateur** : PBKDF2-SHA256 250 000 itérations,
  sel aléatoire, AES-256-GCM et nonce aléatoire par version.
- Le cloud stocke uniquement une enveloppe chiffrée et une révision.
  Les données excluent GPS, agenda, documents Drive, fichiers joints, email.
- La phrase de chiffrement et les jetons d'authentification ne sont gardés
  qu'en **mémoire de l'onglet** ; ils sont perdus au rechargement. Il faut
  donc se reconnecter / déverrouiller à chaque nouvelle session.
- Après activation : comparaison des révisions environ toutes les 30 secondes
  lorsque la page est ouverte ; tentative d'envoi des changements locaux
  après 2 secondes. **Aucune synchronisation en arrière-plan PWA fermée**.
- Conflit avec modifications locales et distantes : **jamais de
  remplacement silencieux**. L'utilisateur choisit explicitement la copie,
  et peut toujours exporter un JSON avant de le faire.
- Hors réseau : le stockage local continue ; la synchronisation attend
  le retour du réseau.
- Les tests CI utilisent des services simulés, **pas un vrai Supabase**.
  Tests E2E réels avec un projet privé et un iPhone physique restent nécessaires.

## Limites

Cette version synchronise les statuts des cours, le SRS, les états de labs,
les empreintes des preuves, le portfolio et le Daily Five. Elle n'est pas
un moteur de fusion par champ : en cas de concurrence, priorité à la
préservation et au choix explicite. La configuration côté fournisseur,
l'email OTP, la RLS et le HTTPS doivent être vérifiés avant utilisation.

Références :
- <https://supabase.com/docs/guides/auth/auth-email-passwordless>
- <https://supabase.com/docs/guides/database/postgres/row-level-security>
