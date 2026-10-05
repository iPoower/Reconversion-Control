# Couverture des supports pédagogiques

Adaptation vérifiée le 4 octobre 2026. Le cours décrit **Race Control prod-15**, au commit historique `4b6f6dcf115b539eff98db92e1df5351a26d7ac9`. Ces documents ne certifient pas les fonctionnalités de la production actuelle. Les chiffres CI rapportés dans les supports sont des preuves historiques, distinctes de la CI de cette application.

## Ce qui est intégré

32 chapitres structurés sont accessibles dans **Cours Race Control** et dans la recherche de **Fiches**. Ils comprennent objectifs, explications, exemples, pièges, question d’entretien, exercice et corrigé. Les références de pages sont visibles dans chaque chapitre. Les annexes apportent douze questions de révision, un glossaire de 42 termes, six checkpoints, une carte des fonctions et les repères de maintenance.

Les 42 fiches initiales conservent leurs identifiants et leur progression. Le catalogue comporte donc 74 entrées et neuf domaines. Les pièces fournies ne contiennent pas les ouvrages complets Linux, pentest, cloud ou IA mentionnés dans l’ancienne bibliothèque.

## Sept fichiers, trois ensembles documentaires

| Fichier fourni | Traitement |
|---|---|
| fiche.pdf | Archive architecture prod-8, 15 pages. Recoupée avec les deux autres éditions. |
| Race_Control_Cours_Debutant_Compatible.pdf | Cours principal, 39 pages, 32 chapitres et annexes A–E. |
| Race Control V3.3 (prod-8) — Fiche d’architecture.pdf | Archive de 16 pages, largement identique à fiche.pdf. |
| Race_Control_Dossier_Complet_prod15.docx | Même dossier que le PDF ; tableaux recoupés, pas un second cours. |
| race-control-sauvegarde-2026-10-02.json | Sauvegarde chiffrée privée. Structure reconnue uniquement, sans déchiffrement, import ou publication. Hors couverture pédagogique. |
| Race Control v3.2 — Fiche d’architecture.pdf | Archive de 16 pages ; titre v3.2 mais corps V3.3/prod-8. Cette incohérence reste signalée. |
| Race_Control_Dossier_Complet_prod15.pdf | Dossier technique, 31 pages, 27 sections et annexes. |

Les adaptations de cours sont publiques. Les PDF, DOCX, sauvegarde, données personnelles, chemins des pièces jointes et identifiants privés ne sont pas copiés dans le dépôt.

## Les 32 chapitres du cours

| Chapitre fourni | Pages | Leçon |
|---|---|---|
| 1. Race Control en une image mentale | 5 | `rc-01` |
| 2. Cartographie du dépôt : qui fait quoi ? | 5–6 | `rc-02` |
| 3. HTML, CSS et JavaScript : les trois couches visibles | 6–7 | `rc-03` |
| 4. JavaScript de base avec le vrai code Race Control | 7–9 | `rc-04` |
| 5. HTTP, API et JSON : comment l’app parle au monde extérieur | 9–10 | `rc-05` |
| 6. Asynchrone, timeout et erreurs : ne jamais bloquer l’app | 10–11 | `rc-06` |
| 7. Git et GitHub : commit, branche, PR, SHA et merge | 11–12 | `rc-07` |
| 8. Build : comment les sources deviennent index.html | 12 | `rc-08` |
| 9. PWA, service worker, cache et mode hors ligne | 13 | `rc-09` |
| 10. Le modèle météo horaire | 13–14 | `rc-10` |
| 11. Estimer la température de chaussée | 14–15 | `rc-11` |
| 12. Calculer le risque de verglas | 15–16 | `rc-12` |
| 13. Le moteur pneus et le score | 16–17 | `rc-13` |
| 14. La logique saisonnière été / hiver | 17–18 | `rc-14` |
| 15. Agenda iCal, récurrences et géocodage | 18 | `rc-15` |
| 16. Construire une chaîne de trajets | 18–19 | `rc-16` |
| 17. Échantillonner la météo le long d’une route | 19–20 | `rc-17` |
| 18. GPS vivant et machine à états | 20–21 | `rc-18` |
| 19. Départ adaptatif et atomicité route + météo | 22 | `rc-19` |
| 20. Waze : déléguer la navigation sans reconstruire Waze | 22–23 | `rc-20` |
| 21. Tenue sartoriale : un moteur déterministe séparé | 23–24 | `rc-21` |
| 22. Le relais cloud GitHub Actions | 24 | `rc-22` |
| 23. Chiffrement : AES-GCM, PBKDF2 et séparation des clés | 25 | `rc-23` |
| 24. Confidentialité : ce qui reste local, ce qui part dehors | 26–27 | `rc-24` |
| 25. Tests : unitaire, E2E, Chromium, WebKit et contre-tests | 27–28 | `rc-25` |
| 26. CI/CD : de la PR à prod-N | 28–29 | `rc-26` |
| 27. Rollback et versionnement | 29 | `rc-27` |
| 28. Incident DevSecOps : comment un test a exposé des données | 30 | `rc-28` |
| 29. Déboguer Race Control avec méthode | 30–31 | `rc-29` |
| 30. Dette technique, refactor et maintenabilité | 31–32 | `rc-30` |
| 31. Présenter le projet en entretien | 32–33 | `rc-31` |
| 32. Exercices de révision et réponses | 33–34 | `rc-32` |

## Les 27 sections du dossier

| Section technique | Pages | Approfondissements |
|---|---|---|
| 1. Résumé exécutif et proposition de valeur | 3 | `rc-01` |
| 2. Modèle mental : de l’app au DevSecOps | 4 | `rc-01`, `rc-02` |
| 3. Cartographie du dépôt et responsabilités | 5 | `rc-02`, `rc-08` |
| 4. Architecture d’exécution | 6 | `rc-01`, `rc-02`, `rc-19`, `rc-22` |
| 5. Moteur météo et estimation de chaussée | 7 | `rc-10`, `rc-11` |
| 6. Risque de verglas | 8 | `rc-12` |
| 7. Moteur pneus et verdicts | 9 | `rc-13`, `rc-14` |
| 8. Agenda, géocodage et chaîne de trajets | 10 | `rc-15`, `rc-16` |
| 9. Trajet vivant GPS et automate d’état | 11 | `rc-18` |
| 10. Départ adaptatif, routage et météo de route | 12 | `rc-17`, `rc-19` |
| 11. Navigation Waze | 13 | `rc-20` |
| 12. Onglet Tenue sartoriale | 14 | `rc-21` |
| 13. Relais cloud et notifications | 15 | `rc-22` |
| 14. Chiffrement, secrets et frontière de confiance | 16 | `rc-23`, `rc-26`, `rc-28` |
| 15. Cartographie des données et confidentialité | 17 | `rc-24` |
| 16. PWA, service worker et fonctionnement hors ligne | 18 | `rc-09` |
| 17. CI/CD, versionnement et rollback | 19 | `rc-07`, `rc-08`, `rc-26`, `rc-27` |
| 18. Stratégie de tests et preuves actuelles | 20 | `rc-25` |
| 19. UX mobile, desktop et accessibilité | 21 | `rc-03`, `rc-09` |
| 20. Fournisseurs externes et dépendances | 22 | `rc-05`, `rc-22`, `rc-30` |
| 21. Modes de panne et fallbacks | 23 | `rc-06`, `rc-09`, `rc-22`, `rc-29` |
| 22. Dette technique et maintenabilité | 24 | `rc-30` |
| 23. Exploitation et observabilité | 25 | `rc-22`, `rc-29`, `rc-30` |
| 24. Retour d’expérience DevSecOps | 26 | `rc-25`, `rc-28`, `rc-29` |
| 25. Feuille de route | 27 | `rc-17`, `rc-21`, `rc-30` |
| 26. Présenter le projet en entretien | 28 | `rc-31` |
| 27. Glossaire de zéro à DevSecOps | 29 | `rc-32` |

## Annexes

| Support et annexe | Pages | Repères dans le cours |
|---|---|---|
| Cours · Glossaire | 35–36 | `rc-32` |
| Cours · Commandes et gestes GitHub | 36–37 | `rc-07`, `rc-08`, `rc-25`, `rc-26`, `rc-27`, `rc-32` |
| Cours · Carte des fonctions | 37 | `rc-02`, `rc-10`, `rc-11`, `rc-12`, `rc-13`, `rc-14`, `rc-15`, `rc-16`, `rc-17`, `rc-18`, `rc-19`, `rc-21`, `rc-22`, `rc-32` |
| Cours · Six checkpoints de progression | 38 | `rc-31`, `rc-32` |
| Cours · prod-15 versus roadmap | 38–39 | `rc-17`, `rc-21`, `rc-30` |
| Dossier · Stockage local | 30 | `rc-09`, `rc-18`, `rc-24` |
| Dossier · Carte des fonctions | 30 | `rc-02`, `rc-10`, `rc-11`, `rc-12`, `rc-13`, `rc-14`, `rc-15`, `rc-16`, `rc-17`, `rc-18`, `rc-19`, `rc-20`, `rc-21`, `rc-22`, `rc-32` |
| Dossier · Preuves CI historiques | 30 | `rc-25`, `rc-26` |
| Dossier · Checklist de maintenance | 30–31 | `rc-29`, `rc-30` |

## Limites des fiches générales

L’audit des 42 fiches initiales distingue 11 fiches avec un approfondissement contextualisé, huit avec seulement des exemples ponctuels et 23 sans cours détaillé dans les pièces. Même un chapitre lié ne couvre pas toute la théorie du titre général : JavaScript ne remplace pas Python/Bash, et les échanges HTTP ne constituent pas un cours TLS exhaustif.

| Fiche initiale | Couverture apportée par les pièces |
|---|---|
| `os-role` · Rôle d'un système d'exploitation | aucun cours détaillé fourni |
| `web-stack` · HTTP, HTML, CSS, JavaScript | cours contextualisé |
| `programming` · Variables, conditions, boucles, fonctions | cours contextualisé |
| `formats` · JSON, YAML et sérialisation | cours contextualisé |
| `linux-fs` · Filesystem et navigation | aucun cours détaillé fourni |
| `linux-perms` · Permissions, propriétaires et sudo | aucun cours détaillé fourni |
| `linux-process` · Processus, services et logs | aucun cours détaillé fourni |
| `linux-net` · Réseau sous Linux | aucun cours détaillé fourni |
| `linux-bash` · Bash et environnement | aucun cours détaillé fourni |
| `osi` · Modèles OSI et TCP/IP | aucun cours détaillé fourni |
| `ipv4` · IPv4, CIDR et sous-réseaux | aucun cours détaillé fourni |
| `routing` · Routage et passerelle par défaut | aucun cours détaillé fourni |
| `dns` · DNS | aucun cours détaillé fourni |
| `dhcp` · DHCP | aucun cours détaillé fourni |
| `http-tls` · HTTP/S et TLS | exemple ponctuel seulement |
| `cia-risk` · CIA, menace, vulnérabilité et risque | exemple ponctuel seulement |
| `iam` · IAM, authentification et autorisation | exemple ponctuel seulement |
| `crypto` · Hash, chiffrement et signature | cours contextualisé |
| `vuln` · CVE, CVSS et gestion des vulnérabilités | aucun cours détaillé fourni |
| `hardening` · Durcissement, logs et détection | exemple ponctuel seulement |
| `zerotrust` · Zero Trust et segmentation | exemple ponctuel seulement |
| `shared` · Responsabilité partagée | exemple ponctuel seulement |
| `cloud-iam` · IAM Cloud | exemple ponctuel seulement |
| `vpc` · VPC, subnets, security groups | aucun cours détaillé fourni |
| `secrets` · Secrets, chiffrement et stockage | cours contextualisé |
| `git` · Git et stratégie de branches | cours contextualisé |
| `cicd` · CI/CD et quality gates | cours contextualisé |
| `docker` · Docker et images | aucun cours détaillé fourni |
| `k8s` · Kubernetes fondamentaux | aucun cours détaillé fourni |
| `iac` · Infrastructure as Code | aucun cours détaillé fourni |
| `supply` · SAST, DAST, SCA, SBOM et supply chain | exemple ponctuel seulement |
| `method` · Méthodologie, scope et preuve | aucun cours détaillé fourni |
| `recon` · Reconnaissance et énumération | aucun cours détaillé fourni |
| `web` · Web : injection, XSS, auth et sessions | aucun cours détaillé fourni |
| `privesc` · Privilege escalation et reporting | aucun cours détaillé fourni |
| `prompt` · Prompt injection | aucun cours détaillé fourni |
| `rag` · RAG, ACL et données non fiables | aucun cours détaillé fourni |
| `mlops` · MLOps, provenance et gouvernance | aucun cours détaillé fourni |
| `race-arch` · Race Control : architecture | cours contextualisé |
| `race-privacy` · Race Control : privacy by design | cours contextualisé |
| `race-tests` · Race Control : tests et contre-tests | cours contextualisé |
| `race-cicd` · Race Control : CI/CD et revue par SHA | cours contextualisé |

## Évolution historique et limites

- L’archive prod-8 proposait encore la séparation des clés ; prod-15 la décrit comme livrée. Le chapitre 23 enseigne le mécanisme prod-15.
- Les cadences du relais et les nombres de tests varient entre versions. Aucun planning cron ne garantit une exécution à la minute demandée.
- Au prod-15, wardrobe conseille une tenue pour une fenêtre météo. Le plan Tenue multi-lieux de la journée, les alertes trafic et l’IA Race Engineer sont encore une roadmap dans ces supports.
- Les cours distinguent chaussée estimée et mesure réelle, GPS vivant et planning cloud, shell hors ligne et prévisions fraîches, WebKit CI et téléphone physique.
- La couverture est une adaptation des notions, pas une reproduction mot pour mot de toutes les pages. Les associations ci-dessus indiquent où retrouver les explications.
