# Actualisation pédagogique — 22 octobre 2026

Trois cours existants sont enrichis : `rc-37` (fusion sans perte), `rc-39`
(preuves de publication par cible), `rc-42` (paquets opaques et portée des tests).
Les exercices corrigés et défis anglais suivent ces cas ; `lab-17`, `lab-18`
et `lab-20` reçoivent une variante manuelle. Les contenus précédents gardent
leurs textes et leurs sources datées. Les identifiants, 42 cours, 20 labs,
14 Daily Five et vocabulaires restent conservés.

## Sources et enseignements nouveaux

- **Fusion pure, sans perte** : [documentation Race Control au SHA 6340b45](https://github.com/iPoower/iPoower/blob/6340b45efabe2adac885faec9e41f76c37e6b573/docs/sync-pc-iphone.md), [moteur](https://github.com/iPoower/iPoower/blob/6340b45efabe2adac885faec9e41f76c37e6b573/src/sync-merge.js), [contre-tests](https://github.com/iPoower/iPoower/blob/6340b45efabe2adac885faec9e41f76c37e6b573/tests/test_sync_merge.js). L’union conserve les ajouts par identité ; l’absence d’horodatage fiable produit un conflit ; une capacité insuffisante refuse la fusion entière. Les entrées restent intactes. Le moteur n’est pas branché au réseau.
- **Une conclusion par cible** : [manifeste GitHub Pages figé au commit 6120bc7](https://github.com/iPoower/iPoower/blob/6120bc7f4c720e86e31c249f6b0dba0fccaf1e26/race-control/version.json). Instantané prod-157, source `6340b45efabe2adac885faec9e41f76c37e6b573`, build `50988798eb7c`, horodatage `2026-10-22T03:51:51.867Z`. Le build est retrouvé dans le HTML lu par HTTP. Dans le [run 39716832859](https://github.com/iPoower/iPoower/actions/runs/39716832859), les tests unitaires, six lots navigateur, confidentialité, validation et publication GitHub Pages réussissent, mais [le job Cloudflare 119628436882](https://github.com/iPoower/iPoower/actions/runs/39716832859/job/119628436882) échoue au contrôle des octets, du commit et des en-têtes servis. Aucune cause n’est déduite de son seul intitulé ; aucune réussite globale n’est annoncée.
- **Code de transport et service réel** : [lot B1](https://github.com/iPoower/Control-Vault/blob/8a3cf03571274f80cfa69e51296fc67754207b10/docs/OPAQUE_BACKUP_LOT_B1.md), [lot B2](https://github.com/iPoower/Control-Vault/blob/8a3cf03571274f80cfa69e51296fc67754207b10/docs/OPAQUE_DRIVE_LOT_B2.md), [addendum A1](https://github.com/iPoower/Control-Vault/blob/8a3cf03571274f80cfa69e51296fc67754207b10/docs/INTEGRATION_SYNC_A1.md) et [tests A1](https://github.com/iPoower/Control-Vault/blob/8a3cf03571274f80cfa69e51296fc67754207b10/tests/unit/race-sync-profile.test.ts) au SHA `8a3cf03`. Les PR #6 à #10 sont fusionnées. Les tests utilisent des paquets fictifs et des instantanés identifiés du codec propriétaire ; le transport Drive reste simulé. Le [code de l’application](https://github.com/iPoower/Control-Vault/blob/8a3cf03571274f80cfa69e51296fc67754207b10/src/app.ts) instancie encore `DemoDrive`. Ces préparations ne prouvent aucune synchronisation réelle ni restauration métier complète.
- **Permissions limitées** : [documentation Google Drive sur les scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), consultée le 22/10. `drive.file` porte sur les fichiers autorisés pour l’application, et n’équivaut ni à un consentement obtenu ni à un accès intégral au compte. La [documentation des envois](https://developers.google.com/workspace/drive/api/guides/manage-uploads) a aussi été relue pour les réessais idempotents ; aucune implémentation réseau n’est ajoutée ici.

Les statuts `local-only` et `verified-bytes` sont enseignés avec leur portée
précise. Une empreinte, un test de codec ou un serveur simulé ne prouvent pas
l’authenticité métier, une dernière révision distante ou l’état global protégé.
Les instantanés prod-151 et les documents du 16/10 restent des archives et ne
sont pas utilisés pour annuler ces nouveaux constats.

## Références de formation relues

Les fiches [AIS RNCP37680](https://www.francecompetences.fr/recherche/rncp/37680/)
et [TSSR RNCP42463](https://www.francecompetences.fr/recherche/rncp/42463/) et les
pages [ENI TSSR](https://www.eni-ecole.fr/formations/systeme-et-reseau/formation-technicien-superieur-systemes-reseaux-bac2/),
[Jedha certification](https://www.jedha.co/formation-cybersecurite/formation-cybersecurite-certifiante-financement-cpf),
[alternance](https://www.jedha.co/formations/formation-cybersecurite-en-alternance)
et [prérequis](https://www.jedha.co/campus/nantes-formation-en-cybersecurite)
conservent les informations reprises dans l’application. La date de relecture
est actualisée ; aucun niveau, échéance, tarif ou financement nouveau n’est inventé.
Une inscription, une habilitation de centre ou une prise en charge individuelle
restent à prouver séparément.

## Périmètre et validation

Seul du contenu public est modifié. Les moteurs de données, progression,
sauvegarde, import/export, synchronisation, chiffrement, authentification,
Service Worker, permissions et workflows restent hors du diff. Aucune écriture
dans Race Control, Control Vault ou les deux PDF.

Les compteurs de références des tests passent de 21 à 27 ; le domaine officiel
`developers.google.com` rejoint la liste de sources autorisées. Les assertions
de compatibilité, de confidentialité et de progression sont conservées.
La fusion exige la CI complète sur la tête exacte et la revue des captures ;
la livraison exige les contrôles post-fusion et la comparaison des octets servis.
Les simulations navigateur ne constituent pas un essai sur iPhone physique.
