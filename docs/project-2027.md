# Projet 2027 — livraison V3.0

## Périmètre

Mise à jour du dépôt Reconversion-Control uniquement. Race Control et Control Vault restent des projets de portfolio cités ; leur code et leur production ne sont pas modifiés.

## Comportement

- Onglet et lien direct `#project`, accès depuis le cockpit, raccourci PWA.
- Cadre local : diplôme de départ, transition, zone, format, organisation, objectif, budget, durées et historique.
- Import privé de profil : enveloppe `{"format":"reconversion-control.project.v1","profile":{...}}`, 32 Kio maximum, champs bornés ; aucune donnée de progression écrasée.
- Six étapes de formation : fondations, systèmes/cloud, cybersécurité, DevSecOps, option offensive et sécurité IA à long terme. Les fiches existantes sont liées ; les certifications restent des cibles.
- Registre de six sources publiques datées : deux fiches officielles RNCP et quatre pages d’école. L’enregistrement RNCP, les annonces commerciales, l’habilitation du centre et le contrat individuel restent distincts.
- Huit questions identiques pour deux écoles, soit seize réponses locales. Statuts demandé/reçu/contrôlé/non conforme ; contrôle exige trace et date mais reste déclaré par l’utilisateur.
- Deux demandes de devis à copier, sans envoi automatique ni inclusion de l’historique privé ou du budget personnel.
- Coût total par école : formation, examens, matériel et déplacements. Les valeurs inconnues ne sont jamais assimilées à zéro. La marge est calculée contre un plafond indicatif, pas contre un financement accordé.
- Huit pratiques avec critères et anglais, indépendantes des cours/labs/proofs ; une démonstration déclarée exige trace et date.
- Six actions de dossier avec statut local.

## Sources consultées le 15/10/2026

Les URL exactes, les faits et leurs limites sont dans `project-plan.js` :

- France compétences RNCP37680 : AIS, niveau 6, échéance 28/02/2027.
- France compétences RNCP42463 : TSSR, niveau 5, échéance 31/08/2031. Dernière délivrance indiquée séparément au 31/08/2032.
- ENI TSSR : format reconversion affiché 8 mois, RNCP42463, campus/distanciel, pas de prérequis académiques, tests et entretien d’admission.
- Jedha certification : annonce de préparation du RNCP37680.
- Jedha alternance : annonce 16 mois, mention différente de 12 mois dans un autre bloc et expérience de 350 h annoncée pour le titre complet. Faire confirmer ces conditions pour la session retenue.
- Jedha Nantes : initiation distincte du parcours métier nécessitant des bases, test de positionnement.

Ces sources ne prouvent ni le financement PSE individuel, ni une admission, ni la délivrance d’un titre pour une cohorte future. Aucun taux commercial d’insertion n’est transformé en probabilité personnelle d’embauche. Les liens ne font l’objet d’aucune veille automatique.

## Compatibilité et confidentialité

L’état garde sa clé historique et les exports restent V2 avec un champ optionnel `career`. Import et restauration cloud valident tous les champs avant mutation. Une sauvegarde ancienne sans `career` conserve le dossier courant. Une enveloppe invalide est refusée sans import partiel. Les fichiers de profil privés ne sont pas committés.

Le Service Worker précharge `project-plan.js` dans le cache propre à cette application. Les clés et caches des autres applications de l’origine ne sont pas modifiés. Le transport cloud, les API d’authentification, le SQL et les politiques RLS restent inchangés.

Le profil personnel n’est pas chiffré au repos dans localStorage ; les exports sont en clair. Seule l’enveloppe de synchronisation existante est chiffrée avant transfert volontaire. Une connexion réelle PC/iPhone n’est pas revendiquée à partir des tests de transport simulés.

## Vérification

Les tests Node couvrent les dates de référence, statuts avec traces, entrées malformées, limites de taille, coûts inconnus, zéro explicite, dépassement et échappement HTML. Les tests Chromium/WebKit couvrent import privé, indépendance des progressions, refus d’une preuve vide, coût complet, rechargement, export/import V2, compatibilité ancienne, rejet atomique, navigation, absence de requêtes externes spontanées, cibles de 44 px et largeurs 320/414/1280. Le test Service Worker Chromium couvre l’ouverture du nouvel onglet hors ligne.

Les contrôles navigateur sont effectués par la CI existante, sans installation de navigateur dans l’environnement local de cette livraison. Une simulation iPhone ne remplace pas un essai sur appareil physique.

## Réexamen public du 21/10/2026

Les deux fiches France compétences et les quatre pages ENI/Jedha citées dans l’application ont été relues. Les dates RNCP précédentes sont conservées : AIS RNCP37680, niveau 6, échéance 28/02/2027 ; TSSR RNCP42463, niveau 5, échéance 31/08/2031, dernière délivrance possible 31/08/2032. Le TSSR inclut l’usage encadré de l’IA et l’optimisation de scripts ; l’épreuve complète dure 7 h et comprend de l’anglais technique. Ces précisions sont des exigences du référentiel, pas une validation individuelle.

Les mentions ENI de reconversion en 8 mois, de distanciel, de tests et entretien, et les annonces Jedha restent des déclarations d’école. La page alternance conserve des mentions de 16 mois et de 12 mois ainsi que 350 h d’expérience pour le titre : le rythme, la cohorte et la délivrance doivent toujours être confirmés par écrit. Aucun formulaire personnel, état, import/export ou financement n’a été modifié.
