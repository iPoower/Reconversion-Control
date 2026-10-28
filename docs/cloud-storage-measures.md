# Mesures de stockage et transferts — données fictives

Auteur : Bryan Fiarda. Mesures locales du 24 octobre 2026, Node 24.22.1, PostgreSQL PGlite 0.5.11. Ce banc d'essai n'utilise aucun projet Supabase, compte ou progression personnels.

## Décision compatible avec les sauvegardes existantes

Les sauvegardes applicatives restent des enveloppes V1 AES-256-GCM non compressées. Le contrôle périodique d'un appareil à jour lit seulement la révision toutes les 30 secondes ; une lecture complète reste obligatoire au plus tard après dix minutes, à la reprise, sur action manuelle, en présence d'une modification locale ou d'un envoi en attente. Une lecture légère ne crée ni reçu ni date de sauvegarde confirmée. Toute erreur invalide ce raccourci.

Gzip et Brotli ont été étudiés avant chiffrement. Ils peuvent augmenter la taille des très petits états. Leur adoption exigerait un format authentifié versionné, une décompression bornée en navigateur, la compatibilité des anciens clients et l'analyse des fuites de longueur. Les objets d'étude sont rejetés par le validateur métier actuel. Aucune sauvegarde compressée n'est activée par ces travaux.

## Mesures reproductibles

Commande : `RC_STORAGE_REPORT=artifacts/cloud-storage.json node tests/cloud-storage.cjs`.

Le corpus conserve les catalogues réels et les validateurs V3, mais toutes les progressions, preuves et dates sont fictives. Les profils contiennent zéro, 365 et 1825 jours de Daily Five avec progression, révisions, labs et dossier. Ils illustrent trois états ; ils ne prédisent pas la taille d'un dossier personnel, notamment ses textes libres.

Les objets compressés portent un en-tête d'étude et le corps compressé encodé en base64, à l'intérieur du chiffrement réel. Cet overhead est inclus. Chaque cas vérifie déchiffrement, décompression bornée, égalité complète et absence de réutilisation des sels/IV générés ; les tests refusent corruption, dépassement de limite et mauvais contexte. La limite Node `maxOutputLength` protège ces seuls essais, pas une future implémentation iOS.

| Jours fictifs | Encodage | JSON initial (octets) | Corps avant chiffrement¹ | Ciphertext (octets) | Enveloppe JSON (octets) | PostgreSQL après 21 écritures² | PostgreSQL compacté² |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | V1 sans compression | 277 | 277 | 293 | 515 | 98 304 | 73 728 |
| 0 | Gzip, étude | 277 | 190 | 352 | 595 | 98 304 | 73 728 |
| 0 | Brotli, étude | 277 | 178 | 338 | 575 | 98 304 | 73 728 |
| 365 | V1 sans compression | 72 548 | 72 548 | 72 564 | 96 875 | 4 407 296 | 2 220 032 |
| 365 | Gzip, étude | 72 548 | 3 287 | 4 482 | 6 099 | 475 136 | 253 952 |
| 365 | Brotli, étude | 72 548 | 2 814 | 3 852 | 5 259 | 376 832 | 212 992 |
| 1825 | V1 sans compression | 323 668 | 323 668 | 323 684 | 431 703 | 18 948 096 | 9 519 104 |
| 1825 | Gzip, étude | 323 668 | 10 618 | 14 259 | 19 135 | 999 424 | 516 096 |
| 1825 | Brotli, étude | 323 668 | 9 226 | 12 405 | 16 663 | 851 968 | 475 136 |

¹ Pour les études : taille du corps compressé seul, avant son en-tête/base64 intérieur. Pour V1 : JSON brut. Le ciphertext inclut bien tous ces frais et le tag GCM.

² Somme des deux relations applicatives, index, TOAST et overhead PostgreSQL inclus. Vingt versions distinctes sont conservées ; la tête est également présente dans l'historique, soit 21 lignes au total. Le compactage `VACUUM FULL` est exécuté uniquement dans la base jetable du test. Ce n'est ni une recommandation d'entretien du projet personnel ni une mesure de son disque réel. Les valeurs après écritures montrent l'espace mort avant entretien ; l'élagage logique ne réduit pas instantanément les fichiers physiques.

Sur le profil 1825 jours, les études Gzip/Brotli réduisent l'enveloppe de 95,57 % / 96,14 % et les relations compactées de 94,58 % / 95,01 %. À zéro jour, elles augmentent l'enveloppe de 15,53 % / 11,65 %. Ces résultats dépendent du corpus répétitif et ne constituent pas une économie déjà déployée.

## Transferts et projection prudente

Le banc mesure les corps JSON REST exacts : pour le profil 1825 jours sans compression, une lecture complète vaut 431 731 octets et une lecture de révision 17 octets. Modèle à état inchangé, cinq heures cumulées d'appareils actifs par jour, trente jours :

| Profil | Toutes les lectures complètes à 30 s | Révision à 30 s + lecture complète à 10 min | Réduction modélisée |
| --- | ---: | ---: | ---: |
| 365 jours | 1 744 254 000 octets/mois | 87 503 400 octets/mois | 94,98 % |
| 1825 jours | 7 771 158 000 octets/mois | 388 848 600 octets/mois | 95,00 % |

Ce sont des extrapolations des corps mesurés, pas un relevé réseau ni une facture Supabase. Elles excluent HTTP/TLS, Auth, ouverture d'application, reprises, réessais et modifications effectives. Dix heures d'appareils actifs doublent ce poste. Deux appareils allumés simultanément comptent chacun ; un appareil suspendu ne réalise pas ce polling.

La rétention ne croît pas avec le nombre d'envois après vingt versions, mais chaque instantané complet peut grossir. À taille comparable aux profils étudiés, les relations compactées passent de 2,12 Mio à un an à 9,08 Mio à cinq ans, sans compression ; le profil cinq ans atteint 18,07 Mio juste après 21 écritures. Le disque réel inclut aussi catalogues, Auth, autres tables et espace mort. Surveiller les métriques hébergées et l'autovacuum ; aucune projection de taille constante indéfinie n'est justifiée.

Migration préparée (non appliquée) `20261028120000_history_daily_retention.sql` : la borne devient 20 révisions + au plus une révision par jour UTC sur 30 jours, soit 50 instantanés au maximum par compte (≈ 2,5× la borne actuelle dans le pire cas). Re-mesurer avec `tests/cloud-storage.cjs` avant toute application.

## Offre Free et limites économiques

La [tarification officielle Supabase](https://supabase.com/pricing), consultée le 24 octobre 2026, indique Free à 0 $/mois, 500 Mo de base par projet, 5 Go de trafic sortant, et la mise en pause après une semaine d'inactivité. Cela ne garantit ni coût total nul, ni disponibilité continue, ni sauvegarde physique automatique/PITR. Le SMTP peut aussi entraîner un coût séparé. Aucun forfait payant n'est activé ici.

Les mesures applicatives seules sont inférieures au quota affiché, mais le disque et l'egress réellement consommés restent à vérifier sur le bon service. Garder les exports indépendants et ne jamais supprimer une copie exploitable pour respecter un quota.

Sources techniques : [limite de sortie zlib Node](https://nodejs.org/api/zlib.html#class-options), [disque Supabase](https://supabase.com/docs/guides/platform/manage-your-usage/disk-size), [egress Supabase](https://supabase.com/docs/guides/platform/manage-your-usage/egress).
