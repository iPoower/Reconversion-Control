# Environnement navigateur reproductible — 23 octobre 2026

Les tests utilisent Playwright **1.63.0**, version exacte déjà présente dans le manifeste npm et son lockfile. Le job navigateur utilise l'image officielle :

`mcr.microsoft.com/playwright:v1.63.0-noble@sha256:bc6ab0d6d44ff4826e4cb8c1e6d801e185bfc42bb0753f8e2a30efc70db054c7`

Le registre Microsoft a été relu le 23/10/2026. L'index du tag a pour empreinte `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27` ; son manifeste **linux/amd64**, utilisé par GitHub, a l'empreinte figée ci-dessus. Les empreintes ont été comparées aux octets SHA-256 des réponses du registre.

Sources primaires : [documentation Docker Playwright](https://playwright.dev/docs/docker), [Dockerfile de la version 1.63.0](https://github.com/microsoft/playwright/blob/v1.63.0/utils/docker/Dockerfile.noble), [manifeste Microsoft figé](https://mcr.microsoft.com/v2/playwright/manifests/sha256:bc6ab0d6d44ff4826e4cb8c1e6d801e185bfc42bb0753f8e2a30efc70db054c7).

Les navigateurs et bibliothèques système sont déjà présents dans cette image. Le job n'effectue plus d'installation APT ni de téléchargement de navigateur. `npm ci --ignore-scripts` conserve les dépendances applicatives verrouillées. Le contrat de version refuse une divergence manifeste/lockfile/paquet installé/image ou un tag sans digest, puis un lancement réel du navigateur sélectionné est exigé avant les suites applicatives.

Les tests Chromium, WebKit, de dossier, de cours, de stockage et de concurrence restent identiques. Le cache Service Worker conserve son contrôle Chromium, moteur pour lequel Playwright expose cette API. La durée maximale de quinze minutes est conservée ; aucun test n'est retiré ou assoupli.

Dans N02, les 20 tests Python de provenance et d'artefact passent dans le job obligatoire `provenance` sur le runner hôte, avant la matrice. Ils restent exigés à chaque PR et sur `main`. Cela évite de dépendre d'un Python implicite dans une image destinée aux navigateurs. Le workflow de publication reste sur son runner hôte.

Les permissions GitHub ne sont pas élargies. Aucun fournisseur cloud personnel, stockage de progression, secret, réglage administrateur ou autre application n'est modifié. Les résultats sont rattachés au SHA courant dans les contrôles des PR ; une validation d'une ancienne tête ne vaut pas validation d'une nouvelle tête.
