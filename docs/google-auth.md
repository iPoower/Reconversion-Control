# Google OAuth sans domaine — Reconversion Control

Auteur : Bryan Fiarda. 25 octobre 2026.

Ce changement prolonge le candidat #33 (4570c111…). Il ne fusionne ni ne publie le code, ne crée pas d'utilisateur personnel et ne transmet pas de progression personnelle. Aucune migration SQL n'est nécessaire. AES-256-GCM/PBKDF2, DTO cloud V2 issu du snapshot atomique V3, outbox, révisions, RLS et rétention 20 restent inchangés.

## Deux usages

- **Cours publics** : `courses-public.html` ne charge ni app.js, ni cloud-ui, ni transport Auth. Il ne lit ni localStorage/IndexedDB, ni session personnelle, et ne conserve pas de réponses. CSP connect-src none ; pas d'analytics ni de service worker propre. Le démarrage normal propose cet accès avant tout chargement de progression.
- **Appareil personnel** : choix explicite avant de charger l'application et son stockage. La déclaration est un choix d'usage, pas une détection fiable d'un PC administré. Google identifie le compte ; la phrase indépendante déverrouille ensuite le chiffrement. Une session mémorisée demeure chiffrée et facultative. La fermeture sans mémorisation perd la session en mémoire, pas le snapshot local.

Un PC professionnel peut enregistrer écran, frappes, fichiers et trafic. Ne jamais y ouvrir le mode personnel ou saisir une phrase. Une déconnexion ne supprime pas la progression locale en clair. Aucune purge de stockage n'est effectuée. Une URL de cours sous la même origine ne constitue pas une isolation : les chemins GitHub Pages d'un même hôte partagent localStorage. Le lecteur public peut être distribué séparément sur une **origine gratuite distincte**, sans déplacer les données personnelles. Le build public décrit plus bas est préparé ; aucun nouvel hébergement n'est créé ou publié.

## Contrat de connexion

1. Depuis un appareil personnel, préparer un vérificateur PKCE aléatoire 32 octets et son SHA-256 S256. Une tentative unique, liée au projet et au callback exact, est conservée dans sessionStorage pour cinq minutes maximum. Aucun access/refresh token ni phrase n'y est conservé.
2. Navigation de premier niveau vers Supabase `/auth/v1/authorize`, provider google, scopes **openid email profile** uniquement. Supabase conserve le contrôle de son state signé ; l'application ne le remplace pas. Pas de One Tap, iframe, script Google externe, Google Drive, Gmail ou accès offline aux API Google.
3. Le bootstrap retire immédiatement code et erreurs de l'URL avant de charger le code personnel. Le code OAuth temporaire apparaît nécessairement dans le GET de callback ; le nettoyage d'historique ne peut effacer les journaux du fournisseur d'hébergement. PKCE lie ce code à son vérificateur local ; aucun Bearer/refresh token n'est accepté depuis une URL.
4. Échange unique POST `/auth/v1/token?grant_type=pkce`, puis GET `/auth/v1/user` avec le Bearer Supabase reçu. Vérifier UUID, non-anonymat et identité Google. Un UUID différent du propriétaire déjà confirmé est refusé avant tout accès REST de progression. Le décodage local d'un JWT n'est pas utilisé comme preuve d'identité.
5. L'utilisateur confirme le compte affiché et saisit sa phrase. L'UUID du propriétaire est mémorisé comme métadonnée de configuration, jamais remplacé silencieusement. Les sessions héritées et les anciens formats cryptographiques restent lisibles ; ne pas déplacer un ancien journal vers un nouvel UUID.
6. Seulement ensuite : lecture/déchiffrement/validation, choix explicite de source initiale et envoi conditionnel. Aucun premier upload provoqué par Google seul. Les jetons de fournisseur Google sont ignorés ; seules les données de session Supabase nécessaires passent à la mémorisation chiffrée existante.

Un retour sans tentative, avec mauvais projet, callback, vérificateur, date future ou identité inattendue échoue sans restaurer ni envoyer de progression. Une réponse Auth perdue exige de recommencer la connexion ; elle n'autorise pas une réinitialisation du stockage. Les réponses de sauvegarde perdues suivent toujours la réconciliation idempotente existante.

## Paramètres administratifs nécessaires — ne pas confondre préparation et exécution

| Paramètre | Valeur |
| --- | --- |
| Projet Supabase unique | jsxbpxlipjmkszfektis |
| Projet ancien exclu | zjydqnkyqshpnteabpat |
| Client Google | Application Web, dans un projet Google Cloud personnel consacré à cette app |
| Origine JavaScript | https://ipoower.github.io (sans chemin) |
| URI de callback Google | **https://jsxbpxlipjmkszfektis.supabase.co/auth/v1/callback** |
| Site URL et redirect Supabase | **https://ipoower.github.io/Reconversion-Control/**, entrée exacte, aucune wildcard |
| Scopes | openid, userinfo.email, userinfo.profile, sans autre permission |
| Secret client | Uniquement dans la configuration serveur Supabase, jamais dans le dépôt, l'app, un export ou une conversation |
| Skip nonce checks | Désactivé |
| Utilisateurs sans email / anonymes | Refusés |

Le domaine Supabase fourni peut servir de callback ; aucun achat de domaine, SMTP ou abonnement Google Identity Platform n'est nécessaire à ce parcours. Le branding personnalisé et un domaine personnalisé sont des sujets distincts. Les exceptions Google aux restrictions Testing pour les trois scopes d'identité signifient que **la liste des test users n'est pas une barrière d'accès privée**. Les inscriptions Supabase doivent être fermées avant l'exploitation personnelle ; ne pas compter sur un bouton masqué comme contrôle d'autorisation.

Préparer, sous GO distinct de création d'utilisateur personnel, un unique utilisateur confirmé par le mécanisme **Auth Admin légitime**, puis vérifier en environnement de recette l'association automatique Google à son UUID avec inscriptions fermées. L'Admin createUser ne requiert pas de SMTP ; il ne faut pas écrire directement dans auth.users ou désactiver globalement la confirmation email. Le choix exact de l'identité et son contrôle appartiennent à l'utilisateur. Tout échec d'association bloque l'activation ; aucun contournement RLS ni nouvelle fenêtre d'inscription publique ne doit être improvisé.

**État constaté le 25/10 :** projet Healthy ; catalogue identique au contrôle précédent, zéro utilisateur et zéro ligne des deux tables. Google et GitHub désactivés, email activé, anonymes refusés, nonce checks conservés, Au départ, Site URL localhost:3000 et redirects vides. Sous le GO Google du 25/10, Site URL et une seule redirection exacte ont été enregistrées vers https://ipoower.github.io/Reconversion-Control/ ; les inscriptions publiques ont été fermées. Aucun utilisateur créé, aucune migration ni permission SQL modifiée. La console Google Cloud affiche « Site Unavailable » dans le navigateur de travail après une seule relance ; le client OAuth n'a donc pas été créé et le provider n'a pas été activé. L'accès administrateur Supabase seul ne suffit pas à inventer les identifiants Google. Aucun plugin disponible identifié ne fournit l'administration OAuth Google Cloud.

## Sessions, iPhone et récupération

Le moteur Supabase existant renouvelle ses propres sessions. La révocation Google, la session Supabase et la clé de chiffrement sont distinctes. Déconnecter l'app ne déconnecte pas le compte Google du navigateur ; un access token Supabase déjà émis peut rester valide jusqu'à expiration malgré la révocation de son refresh token. La phrase reste en mémoire ; le chiffrement de session ne protège pas un appareil compromis pendant son déverrouillage.

Safari et la PWA installée peuvent avoir des stockages distincts. PKCE exige de retrouver le même vérificateur dans le contexte qui a lancé la connexion. Une bascule de contexte doit produire un refus clair et une nouvelle connexion depuis le bon contexte, jamais un transfert de tokens par URL, copier-coller ou stockage en clair. Le comportement effectif des redirections doit être vérifié sur l'iPhone physique. Une PWA fermée/suspendue ne synchronise pas en permanence ; reprise après ouverture, déverrouillage et réseau.

Avant toute recette personnelle : exports PC et iPhone séparés, copie indépendante, réimport vérifié dans un profil isolé, choix de source. La perte du compte Google exige sa récupération ou une intervention Auth contrôlée conservant l'UUID ; ne pas recréer un utilisateur en prétendant qu'il retrouve automatiquement les sauvegardes de l'ancien. La perte de la phrase ne peut pas être réparée par Google ou Supabase. Conserver toute copie locale lisible et ses exports.

## Validation

Distribution publique isolée, préparée à partir d'un commit exact, sans publication :

```sh
python3 .github/scripts/stage-public-courses.py HEAD /tmp/reconversion-cours-publics
```

La destination doit être nouvelle. Elle contient uniquement les huit fichiers pédagogiques autorisés et leur manifeste SHA-256 ; ni application personnelle, ni Auth, ni service worker, ni secrets. Un hébergement statique gratuit sur une origine distincte reste à choisir et autoriser. Aucun service supplémentaire n'est nécessaire à la synchronisation personnelle.

```sh
node tests/cloud-oauth.cjs
BROWSER=chromium node tests/cloud-oauth-browser.cjs
BROWSER=webkit node tests/cloud-oauth-browser.cjs
```

La nouvelle suite navigateur vérifie accès public sans données privées, retour PKCE, confirmation du compte et de la phrase, deux clients, sauvegarde chiffrée relue, restauration après fermeture/réouverture, mauvaise phrase, hors ligne, réponse perdue, mauvais compte et logs canaris. **Tout HTTP fournisseur est intercepté.** Les tests SQL/cryptographiques/concurrence et de publication existants restent exécutés. Leur amorçage choisit explicitement l'appareil personnel ; aucune assertion métier n'est supprimée pour contourner le nouvel écran d'accès.

Cette CI ne valide ni Google réel, ni une nouvelle session Auth hébergée, ni un iPhone physique. La recette hébergée doit utiliser deux identités de test légitimes et des données synthétiques dans un périmètre isolé explicitement autorisé, sans conserver tokens/HAR/logs Auth bruts. Les comptes fictifs SQL dans une transaction annulée ne remplacent pas cette preuve. Les comptes et fixtures hébergés persistants ne sont pas supprimés sans autorisation.

## Sécurité GitHub et livraison

Main e8b5dd49… est non protégée et aucun ruleset n'est déclaré au contrôle du 25/10. Le dépôt public permet une protection gratuite : PR obligatoire, provenance + mobile (chromium) + mobile (webkit) requis sur SHA exact et base à jour, force push/suppression de main interdits, pas de bypass administrateur. Une revue GitHub obligatoire par un autre auteur nécessite un second reviewer qualifié : l'auteur iPoower ne peut pas approuver sa propre PR. Ne pas activer une règle impossible à satisfaire pour ensuite ajouter un contournement.

Conserver séparément github-pages : iPoower approbateur, aucun bypass, self-review possible, branche main seule. Les paramètres Pages étaient vérifiés dans les archives du 24/10 ; leur configuration administrative n'a pas été changée ici. Le workflow et les contrôles de provenance conservent leurs conditions fail-closed. Aucun déploiement de cette branche n'est autorisé.

Sources officielles consultées le 25/10 :

- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/sessions/pkce-flow
- https://github.com/supabase/auth/blob/master/openapi.yaml
- https://support.google.com/cloud/answer/15549945?hl=en
- https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- https://supabase.com/docs/guides/auth/general-configuration
- https://supabase.com/docs/reference/javascript/auth-admin-createuser
- https://supabase.com/docs/guides/auth/auth-identity-linking
- https://webkit.org/blog/14787/webkit-features-in-safari-17-2/
- https://developer.apple.com/videos/play/wwdc2023/10120/
- https://supabase.com/pricing
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
