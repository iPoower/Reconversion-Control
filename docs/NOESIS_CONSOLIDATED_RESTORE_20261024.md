# NOESIS — consolidation de la restauration locale

Auteur : Bryan Fiarda. Relevé : 24 octobre 2026 (Europe/Paris).

## Portée et filiation

Cette branche part de main `21a4ad7a4f79d03ecd88d5bc97fb212472fb0c43` et
intègre ensemble les corrections de #26 `300f11f86566b4bd353da0d791fbfbc932a03216`
et #27 `706e204040676f9022eadb0db175e34d68961966`. #26 est ancêtre de #27.
Les deux lignées sont conservées dans les parents du commit consolidé ; aucune
branche source n'est réécrite. Ne pas fusionner #26 seule.

Le code applicatif final est identique à #27. Le schéma canonique reste
`{version:3,main,daily}` sous `reconversion-control.snapshot.v3` ; imports et
exports métier conservent leurs formats. Le verrou exclusif coopératif,
la comparaison de base, le rollback vérifié et le refus de migration d'un
historique inconnu accompagnent obligatoirement l'instantané atomique.
Il n'y a pas de nouvelle fonctionnalité, de refonte ou d'activation Supabase.

## Conservation du main et comparaison avec #30

Les neuf fichiers modifiés sur main par #28/#29 restent identiques à ce main :
README.md, course-operations.js, docs/content-refresh-20261024.md,
drive-learning.js, english.js, learning.js, project-plan.js,
tests/deep-checks.cjs et tests/learning.spec.cjs.

La référence #30 est `9b887cc03c8244b4112eda5747033b90574df9ec`, arbre
`38b5b090eb022876c9009777d29fe08add15457d`. Elle n'est ni fusionnée ni utilisée
comme parent de cette branche. Les différences attendues sont exclusivement :

- absence de sa note temporaire docs/NOESIS_CURRENT_MAIN_INTEGRATION_20261024.md ;
- présente note de consolidation et procédure de décision ;
- deux assertions supplémentaires du test navigateur atomique : aucune annonce
  d'instantané vérifié après quota ou relecture perdue ;
- une assertion supplémentaire du contrôleur cloud : aucune annonce synchronisée
  après restauration locale refusée.

Tous les autres fichiers doivent être identiques à #30, notamment app.js, les
tests existants, le workflow de test et tous les ajouts de #28/#29. Les assertions
existantes sont conservées. Les nouvelles assertions renforcent la preuve du
refus de faux succès ; elles ne corrigent aucun nouveau comportement applicatif.

## Acceptation sur le SHA consolidé exact

La CI doit vérifier provenance, Chromium et WebKit sur la tête courante, sans
réutiliser le résultat historique de #30. Contrôles inclus : instantané et
migration V3, progression/Daily Five, quotas, relecture perdue/rollback,
idempotence, clés historiques inconnues, import malformé ou surdimensionné,
Web Locks natifs, onglet secondaire, écritures simultanées, mémoire exportable,
fermeture/réouverture, crypto et courses cloud simulées, cours et navigation.
Chromium exécute en plus le service worker réel ; l'étape WebKit correspondante
reste non applicable selon le workflow existant. Aucun test iPhone physique ou
service Supabase réel n'est revendiqué.

Commandes locales indépendantes du navigateur :

```bash
node --check app.js
node tests/atomic-restoration.cjs
node tests/deep-checks.cjs
node tests/project-checks.cjs
node tests/cloud-sync.spec.cjs
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_pages*.py'
```

La matrice navigateur doit utiliser l'image Playwright verrouillée de la CI,
sans changement de moteur ou assouplissement pour compenser un environnement
local indisponible. Les fixtures restent synthétiques.

## Publication : condition bloquante distincte

Le workflow `.github/workflows/pages.yml` écoute la fin réussie des tests sur un
push main. Il vérifie SHA et PR fusionnée puis appelle actions/deploy-pages.
Les contrôles de provenance empêchent une mauvaise provenance, pas une
publication qui n'a pas été autorisée humainement.

L'environnement github-pages relu via API publique contient uniquement
`branch_policy`, aucun required_reviewers ni règle d'approbation personnalisée,
avec `can_admins_bypass:true`. La barrière d'approbation n'est donc pas présente.
main est déclaré non protégé et la liste des rulesets est vide ; le détail
administratif de branch protection n'est pas lisible par le connecteur.

**BLOQUÉ : aucune fusion tant qu'une barrière effective et toutes les voies de
publication n'ont pas été vérifiées, ou qu'un GO de déploiement distinct et
précis n'a pas été accordé.** L'environnement, les permissions, secrets et
workflows de publication restent inchangés. La CI de PR ne doit rien publier.
Les webhooks et intégrations non lisibles ne sont pas réputés absents.

## Retour arrière et récupération

Avant fusion : conserver les SHA et branches sources ; laisser la PR ouverte
si une condition manque. Le main et les données restent inchangés.

Après une future fusion autorisée : vérifier le commit main, sa CI et l'absence
de publication sans GO ; ne pas ajouter un commit direct sur main. Une
régression se traite par une nouvelle PR ciblée et validée, en gardant la
barrière de publication. Un revert global du code antérieur à V3 est dangereux
sans lecteur de récupération : les miroirs historiques peuvent être anciens.

Un incident de données exige de conserver intégralement la clé canonique V3,
les deux miroirs, l'export complet et les éventuelles saisies seulement en
mémoire. Ne pas supprimer des clés, réinstaller, vider Safari ou remettre un
instantané vide. Récupérer dans un profil/origine isolé, comparer progression,
Daily Five, révisions, labs, preuves, contrôles et carrière, puis fermer et
rouvrir avant toute décision. Un retour de code ne restaure aucune donnée.

Limites : verrou coopératif, anciennes pages pouvant ignorer le protocole,
stockage définitivement indisponible, absence de preuve iPhone physique.
Fermer les anciennes pages lors d'une future mise à jour approuvée, après copie
indépendante vérifiée. Aucun Supabase personnel ni donnée réelle dans cette PR.
