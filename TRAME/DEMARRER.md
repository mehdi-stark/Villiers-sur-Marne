# DEMARRER

> **Le plus simple : la fenêtre « Nouveau projet » (double-clic).** Ce qui suit est
> ce que la fenêtre fait pour toi, et ce que l'agent lit ensuite.


## Si le projet a déjà un `.trame.json`
Le lire : il dit les plateformes, les domaines et les outils retenus. Puis :
`TRAME/0-socle/EXIGENCES.md` (le niveau), le README de chaque plateforme et
domaine, `3-outillage/OUTILS.md`. Tu sais tout.

## Sinon — les 4 questions qui composent la trame
1. **Que vend / fait le projet ?** → un ou plusieurs **domaines**
   (`2-domaines/` : ecommerce, saas, … ; absent → `AJOUTER_UN_DOMAINE.md`).
2. **Comment est-il livré ?** → une ou plusieurs **plateformes**
   (`1-plateformes/` : web = back-office/cockpit/SaaS/site ; mobile = app
   stores ; shopify-app = App Store Shopify).
3. **Quels outils ?** → partir des défauts de `3-outillage/OUTILS.md`, écrire
   les écarts et les quotas.
4. **Qui pilote, depuis où ?** → cockpit web (+ PWA mobile si l'opérateur
   pilote au téléphone).

Puis : `~/code/trames/trames.sh nouveau <chemin> --plateforme web --domaine ecommerce`
(projet EXISTANT : `trames.sh adopter <chemin> --plateforme …` puis skill `audit-trame`)
(plusieurs `--plateforme` / `--domaine` possibles). Le script copie le socle,
les plateformes et domaines choisis, lie leurs skills, génère `CLAUDE.md`
(règles permanentes + doctrine commerce + composition) et `.trame.json`.

## Le jour 1 = UN prompt
`trames.sh nouveau` affiche `0-socle/PROMPT_DEMARRAGE.md` : le coller dans la session du
projet (3 lignes à compléter) — l'agent déroule tout, s'arrête aux validations, livre le
premier maillon testé. Les 15 documents canoniques (`DOCS_PROJET.md`) sont posés en gabarits.

## Le jour 1, dans l'ordre (`0-socle/METHODE.md`)
**squelette du cockpit** (recette `COCKPIT_SQUELETTE`, l'écran où le cadrage et
le backlog se tranchent) → cadrage → **analyse de marché** (domaine) → architecture → outils & process
→ règles (CLAUDE.md complété) → **outillage de capture et d'audit créé** →
premier maillon. Un projet qui saute l'analyse de marché ou l'outillage de
capture ne part pas au niveau.

## Ce qui est TOUJOURS actif (socle)
`0-socle/regles/DOCTRINE_MARCHE.md` (choisir un marché, positionner, rentabilité) et
`DOCTRINE_COMMERCE.md` s'appliquent à tout projet qui vend.
`0-socle/EXIGENCES.md` — expertise, business, produit (cockpit premium,
responsive, actions longues, capture qui prouve), automatisation/IA, qualité,
méthode. Skills globaux : doctrine-commerce, graver-lecon, nouveau-chantier,
revue-hebdo, directeur-artistique (la direction visuelle AVANT le code).
