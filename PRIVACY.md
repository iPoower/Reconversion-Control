# Confidentialité — Reconversion Control

- Aucun document Google Drive n'est embarqué dans le dépôt.
- Aucun identifiant ou URL privée Drive n'est présent dans le build public.
- Les fiches et les 32 cours sont des adaptations pédagogiques, avec sources et pages.
- Aucun PDF/DOCX original ni contenu de sauvegarde Race Control n’est embarqué.
- La sauvegarde fournie est chiffrée ; elle n’est ni déchiffrée, importée, publiée ni mise en cache.
- Progression, dates de révision, vue, filtres, recherche et thème restent dans localStorage du navigateur.
- L’export contient statuts, révisions, validations de labs (empreintes SHA-256), progression Daily Five, version de format et date d’export ; ni documents d'origine ni fichiers de rendus.
- Aucun GPS ni agenda n’est collecté par Reconversion Control ; les exemples des cours sont fictifs.
- Aucun analytics, cookie tiers ni télémétrie. Aucun backend en usage par défaut. La synchronisation Supabase ne transmet qu'une enveloppe chiffrée après connexion volontaire et configuration du projet privé.
- Le service worker ne met en cache que les ressources statiques de l'application.
- Les cours et corrigés sont accessibles sans appels aux fournisseurs Race Control.
- Les titres d’ouvrages non fournis sont des références à compléter, pas une affirmation de lecture.

## Synchronisation facultative

La connexion cloud est **désactivée par défaut**. Un projet Supabase personnel, un code OTP, une phrase de chiffrement et des politiques RLS sont nécessaires ; sans cela aucune progression n'est transmise. Le chiffrement AES-GCM est fait localement, avec clé dérivée de la phrase secrète. Le cloud conserve uniquement une enveloppe chiffrée, pas les fichiers de preuve, les PDF ni les URL Drive. Voir [docs/cloud-sync.md](docs/cloud-sync.md).
