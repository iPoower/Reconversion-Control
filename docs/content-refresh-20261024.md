# Actualisation pédagogique — 24 octobre 2026

Compléments dans quatre cours existants : `rc-37`, `rc-39`, `rc-41`, `rc-42`.
Exercices corrigés, anglais progressif, variantes manuelles de `lab-17`, `lab-18`
et `lab-20`, références et portfolio suivent les mêmes preuves. Les 42 cours,
20 labs, 14 Daily Five, identifiants, prérequis, sections et exercices historiques
restent conservés. Aucun statut personnel ou certificat n'est attribué.

## Ce qui a changé depuis la dernière actualisation

Dernière actualisation pédagogique livrée : [e264634](https://github.com/iPoower/Reconversion-Control/commit/e264634fae4fa430fda064e426bdcaf5da82d996), le 23/10.
Base de cette revue : `f3dddaf591b515eeee103538b33f199a1db955c5`.
La CI et Pages de cette base sont terminés avec succès : [validation 39991099526](https://github.com/iPoower/Reconversion-Control/actions/runs/39991099526)
et [publication 39991608570](https://github.com/iPoower/Reconversion-Control/actions/runs/39991608570).
Le manifeste HTTP public annonce cette même base. Avant les modifications,
les 20 ressources publiques et le manifeste ont été comparés aux octets des
blobs Git de cette base, avec l'estampillage HTML/Service Worker prévu par le
vérificateur existant : 21/21 correspondances, URL canonique égale à `index.html`.
Cette preuve est distincte des assertions ci-dessous sur les projets sources.

### Raccord Drive : code fusionné, activation distincte

- [Race Control #229](https://github.com/iPoower/iPoower/pull/229) est fusionnée.
  [Le document au SHA c9c8339](https://github.com/iPoower/iPoower/blob/c9c833944f7da45d3a74394c5bcd6040582e302b/docs/drive-runtime.md)
  décrit le lien coffre/file durable/transport, les mêmes octets et identifiants
  après interruption et la copie chiffrée avant fusion. Une copie dans IndexedDB
  n'est pas indépendante de l'installation. Les échanges peuvent aller directement
  de Race Control à Drive, sans fenêtre Vault ouverte.
- [Control Vault #14](https://github.com/iPoower/Control-Vault/pull/14) est fusionnée.
  [Le document au SHA 25c2992](https://github.com/iPoower/Control-Vault/blob/25c299272d7ac4aa8a0c8f9f3b6d2e93b305f809/docs/DRIVE_CONNECTION.md)
  distingue son espace Drive des autres écrans de démonstration. Le code sait
  transporter des paquets opaques ; une configuration absente désactive la connexion.
  Seul Race Control authentifie, fusionne et restaure les données métier.
- Les CI de raccord [RC 39922560919](https://github.com/iPoower/iPoower/actions/runs/39922560919)
  et [Vault 39917143668](https://github.com/iPoower/Control-Vault/actions/runs/39917143668)
  sont citées avec les SHA dans leurs PR fusionnées. Leurs simulations de réseau
  ne prouvent pas le consentement réel, les droits Drive, la récupération complète
  ou un iPhone physique. Aucun nouvel essai Google n'est exécuté pour ce cours.
- La documentation [Google GIS](https://developers.google.com/identity/oauth2/web/guides/use-token-model),
  relue le 24/10, exige une nouvelle demande de jeton par geste utilisateur après
  expiration. La documentation [drive.file](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
  borne l'accès aux ressources autorisées à l'application ; choisir un dossier
  n'est pas une preuve d'accès à toutes ses archives. Les rôles V1/A1/A2 sont conservés.
- [MDN — même origine](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy),
  relue le 24/10 : Web Storage et IndexedDB sont séparés par origine. Des liens
  entre applications ne migrent donc aucun stockage. Aucun transfert ou nettoyage
  de données n'est réalisé par cette actualisation.

### Deux corrections de Reconversion devenues des cas pédagogiques

- [N03 #24](https://github.com/iPoower/Reconversion-Control/pull/24), fusionnée le 23/10 :
  capture du JSON et d'une copie indépendante avant le premier `await`, acquittement
  limité à l'état transmis et conservation des saisies concurrentes. Le cours
  traite explicitement la première sauvegarde et une nouvelle révision distante.
  Les quinze scénarios documentés utilisent des données fictives. Aucun moteur
  de synchronisation n'est modifié par la présente PR.
- [N02 #25](https://github.com/iPoower/Reconversion-Control/pull/25), fusionnée le 23/10 :
  fermeture du chemin manuel, identité du workflow/dépôt/SHA/fusion et vérification
  de l'artefact du run. Le cours sépare cette provenance de l'activation d'un service.
  Les contrôles négatifs restent des tests, sans publication de fichiers altérés.

### Version publique et portfolio

Le [manifeste figé Race Control](https://github.com/iPoower/iPoower/blob/7cf2ef91f4ee3acfb9e0c6577edb4d24ae565ec2/race-control/version.json)
correspond à la lecture HTTP du 24/10 : prod-159, source
`c9c833944f7da45d3a74394c5bcd6040582e302b`, build `31f687d0433d`, daté du
23/10/2026 à 12:16:31 UTC. Le HTML GitHub Pages contient aussi cet identifiant de build.
Le [manifeste public Vault](https://ipoower.github.io/Control-Vault/version.json)
annonce `25c299272d7ac4aa8a0c8f9f3b6d2e93b305f809` et l'empreinte de configuration nulle.
Les références prod-151/prod-157 gardent leurs dates dans les cours et sources.

Les liens du portfolio utilisent les origines Cloudflare déjà retenues par les
README et la navigation commune ([RC #230](https://github.com/iPoower/iPoower/pull/230),
[Vault #15](https://github.com/iPoower/Control-Vault/pull/15)). Les lectures HTTP
Cloudflare depuis l'environnement de scripts reçoivent un refus 403 : aucune
nouvelle identité servie ni validation des en-têtes de ces origines n'est déduite
du seul manifeste GitHub Pages. Les sites TEST vus dans une autre préparation
ne constituent pas une activation des applications personnelles de production.

## Formation et certification : contradiction à confirmer

Sources relues le 24/10, sans déduire une admission, une habilitation individuelle
ou un financement :

- [France compétences AIS RNCP37680](https://www.francecompetences.fr/recherche/rncp/37680/) :
  niveau 6, échéance 28/02/2027, faits inchangés.
- [France compétences TSSR RNCP42463](https://www.francecompetences.fr/recherche/rncp/42463/) :
  niveau 5, parcours depuis le 01/09/2026, échéance 31/08/2031 et dernière
  délivrance possible 31/08/2032. L'épreuve complète et l'anglais restent distingués
  des évaluations de blocs.
- [ENI TSSR](https://www.eni-ecole.fr/formations/systeme-et-reseau/formation-technicien-superieur-systemes-reseaux-bac2/) :
  huit mois en reconversion, distanciel et admission par tests/entretien ; aucun
  nouveau calendrier individuel ou devis obtenu.
- [FAQ certifications Jedha](https://www.jedha.co/financement-formations/certifications-jedha-tout-ce-quil-faut-savoir) :
  Essentials est associé au bloc n°3 AIS et à 140 h de stage ;
  [la page certification/CPF](https://www.jedha.co/formation-cybersecurite/formation-cybersecurite-certifiante-financement-cpf)
  associe ce même parcours au bloc n°1. L'application signale désormais cette
  contradiction entre pages et exige une confirmation écrite du bloc exact,
  sans arbitrage inventé. Les 350 h Fullstack restent une déclaration de l'école.
- [Alternance Jedha](https://www.jedha.co/formations/formation-cybersecurite-en-alternance) :
  l'écart 16 mois / titre de section à 12 mois subsiste ; aucun rythme personnel
  n'est validé. [Nantes](https://www.jedha.co/campus/nantes-formation-en-cybersecurite)
  distingue prérequis du parcours métier et initiation, puis admet plusieurs
  formes d'expérience en entreprise. Ces modalités restent à faire préciser.

La date de relecture et le texte public sur cette contradiction sont les seuls
changements de `project-plan.js` ; formulaires, calculs, état personnel et export
restent intacts. Les sept sources et leurs identifiants sont conservés.

## Conservation, contrôles et limites

- Aucun AGENTS.md ou CLAUDE.md n'est présent dans le dépôt Reconversion au SHA
  de base ; aucun AGENTS.md n'a été trouvé dans ses parents de travail. Les
  consignes des deux dépôts sources sont lues, sans y écrire.
- Les PR Reconversion #26 et #27 sont ouvertes, en brouillon, sur la restauration.
  Leurs branches et leurs changements ne sont pas repris. Les PR Race Control
  #234–#240 et Control Vault #16–#20 restent hors de cette actualisation ; aucune
  fusion de ces PR n'est autorisée par une PR pédagogique.
- Changements limités aux textes publics et à deux compteurs de références dans
  les contrôles existants : 33 → 39. Aucun test de sécurité, progression ou
  compatibilité n'est supprimé ni assoupli.
- La comparaison sémantique à la base vérifie les identifiants et contenus
  antérieurs, les vocabulaires, critères de labs et Daily Five. Les contrôles
  syntaxiques, contenu, dossier, quinze scénarios asynchrones et provenance
  restent obligatoires, puis toute la CI Chromium/WebKit sur la tête exacte.
- Validation locale effectivement exécutée : syntaxe des cinq JS de contenu,
  `deep-checks.cjs`, `project-checks.cjs`, `cloud-sync.spec.cjs` (15/15 cas N03),
  les 20 tests Python de provenance, `git diff --check` et la comparaison
  sémantique à la base sont réussis. Aucun fichier de données ni moteur
  applicatif sensible ne figure dans le diff.
- Les navigateurs Playwright verrouillés ne sont pas installés dans l'environnement
  local : aucune exécution locale Chromium/WebKit n'est revendiquée. Les résultats
  de CI et la publication doivent être vérifiés séparément avant toute annonce.

La fusion autorisée concerne uniquement cette PR ordinaire de contenu, après CI
complète verte et nouvelle lecture de sa tête et de main. Après fusion, exiger
les contrôles main, Pages et une comparaison des octets servis au commit fusionné.
Aucun essai sur iPhone physique, activation cloud, donnée personnelle, autre
application, PDF, secret, permission, workflow ou infrastructure n'est modifié.

## Contrôle après la fusion de contenu

La PR #28 a été fusionnée le 24/10/2026 au commit
`9434c3114b315494db7518e81268e5a7623283b8`, arbre identique à la tête de PR
`df7ed75dd52cc17ec06d663e9030990dd51c1b8c` validée par la
[CI 40061689072](https://github.com/iPoower/Reconversion-Control/actions/runs/40061689072).
Sur la [CI main 40062133686](https://github.com/iPoower/Reconversion-Control/actions/runs/40062133686),
provenance et Chromium réussissent, puis WebKit échoue à
`tests/learning.spec.cjs:161` sur le focus du bouton `rc-01` après fermeture du
dialogue et retour d'historique. Les 31 groupes mobiles WebKit et la lecture
des 42 cours ont réussi avant cet échec. Le déploiement Pages est correctement
ignoré ; la mise à jour n'est pas annoncée comme livrée.

Le contrôle initial attendait un focus possible sur l'ancien bouton avant que
`history.back()` ne provoque `applyRoute()` et le remplacement du DOM du parcours.
Il pouvait observer ce focus puis tester un autre nœud après la navigation.
Le complément de test attend l'URL `#course`, le détachement du bouton capturé
avant fermeture et la fermeture effective du dialogue, puis garde les deux
contrôles originaux de focus. Il ajoute une assertion de dialogue fermé. Aucun
délai fixe, timeout augmenté, réessai du test, `force`, assertion retirée ou
changement de `app.js`, du stockage ou d'un workflow.

Ce complément utilise une branche et une PR dédiées. Toute la CI doit réussir
sur sa nouvelle tête, puis sur son commit fusionné avant Pages et vérification
HTTP. Un résultat vert sur le SHA précédent ne suffit pas. Cette synchronisation
du test ne doit pas servir à masquer une régression de focus après navigation
achevée, ni à conclure à une validation de Safari sur iPhone physique.
