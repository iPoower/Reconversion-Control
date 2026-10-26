# NOESIS — validation de #26 et #27 avec le main actualisé

Branche temporaire de test, sans fusion ni publication. Auteur : Bryan Fiarda.

## Sources exactes

- Main observé : `21a4ad7a4f79d03ecd88d5bc97fb212472fb0c43`.
- PR #26 : `300f11f86566b4bd353da0d791fbfbc932a03216`.
- PR #27, qui inclut #26 : `706e204040676f9022eadb0db175e34d68961966`.
- Base du précédent contrôle : `f3dddaf591b515eeee103538b33f199a1db955c5`.

Les PR #28 et #29 ont avancé main : contenu pédagogique et synchronisation du
test de focus après navigation. Leur intégration avec #27 est automatique et
sans conflit Git. Les neuf fichiers modifiés sur main depuis la base précédente
doivent rester identiques à ce main ; `app.js` doit rester identique à #27.
Les branches sources, les assertions et les protections ne sont pas modifiées.

## Vérifications

Exécuter les contrôles source atomiques, la cohérence pédagogique, la projection
de dossier, les contre-tests cloud et les tests de provenance. La CI de cette
branche doit ensuite réussir sur sa tête exacte : provenance et matrice complète
Chromium/WebKit, avec les scénarios natifs de stockage et de concurrence de #27.
Le résultat d'un ancien SHA ne valide pas cette combinaison.

Cette branche ne corrige aucun nouveau défaut applicatif : elle démontre la
compatibilité des corrections de stockage avec le travail arrivé entre-temps.
L'ajout de 39 sources publiques et l'attente de navigation de #29 sont conservés.

## Limites et retour arrière

Ne pas fusionner cette branche. Reprendre la revue de #26 puis #27 et revalider
la base réellement approuvée avant toute décision. Les anciens résultats restent
des preuves datées, pas une preuve du nouveau main.

Rollback de cette validation : laisser la branche inutilisée. Aucun stockage
personnel, Supabase, déploiement, fusion de PR ou paramètre administratif n'est
modifié. WebKit automatisé ne constitue pas une validation d'iPhone physique.
