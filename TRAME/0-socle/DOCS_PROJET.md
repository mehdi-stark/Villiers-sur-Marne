# DOCS_PROJET — le dossier documentaire d'un projet (déduit de 13 applications)

> Chaque document ci-dessous est apparu, sous un nom ou un autre, dans les
> projets réels (DelivUp, CartCall, Une Chance, usines ecom/mobile/Shopify…).
> Ils sont désormais CANONIQUES : mêmes noms, mêmes sections, gabarits dans
> `gabarits/`, copiés dans `docs/planning/` par `trames.sh nouveau`. Un projet
> en prod sans ces documents ne se reprend pas à froid.

| Document (`docs/planning/`) | Rôle | Quand | Qui le produit |
|---|---|---|---|
| `CADRAGE.md` | besoin, personas, parcours, périmètre/non-périmètre, risques, décisions à valider | phase 0 | agent, relu par l'opérateur |
| `ANALYSE_MARCHE.md` | demande mesurée, grille pondérée, P&L, moat, tête de pont, verdict | phase 0bis — AVANT le code | agent (skill analyse-marche) |
| `AUDIT_PRE_IMPLEMENTATION.md` | architecture, stack, décisions numérotées, invariants (§argent, §IA, §QA, §secrets) | phase 1 | agent |
| `BENCHMARK_OUTILS.md` | outils retenus PAR BESOIN, repli, quotas, prix, **date** — périssable | phase 1bis | agent (3-outillage/OUTILS.md) |
| `CARTE_AUTOMATISATION.md` | chaque processus → niveau (code / workflow / IA / agent), gates, pouvoirs | phase 1bis | agent |
| `PROCESS_METIERS.md` | SOP : qui fait quoi, quand, avec quel outil, quel gate | phase 1bis | agent |
| `PLAN_EXECUTION.md` | phases → maillons, ordre par ce que chacun débloque, état courant | phase 2, vivant | agent |
| `ENV.md` | inventaire des variables par app, où elles vivent, **qui possède quel compte** | phase 3 | agent |
| `DEPLOIEMENT.md` | runbook : pré-requis, commandes, vérification READY, rollback, pièges | phase 3 | agent |
| `REFERENTIEL_DESIGN.md` | tokens, **deux registres** (produit client stylé/fluide vs admin sobre), primitives, états, mobile | phase 3 | agent |
| `CATALOGUE_PROMPTS.md` | prompts versionnés des agents runtime + socle injecté | dès la 1re IA | agent |
| `BACKLOG.md` | ce qui reste, priorisé par ce que ça débloque ; jamais de « plus tard » flou | vivant | agent |
| `LECONS.md` | registre des pièges payés (une ligne + garde-fou, même session) | vivant | agent |
| `AUDIT_PROD.md` | avant les vrais utilisateurs : ✅ en place / 🔴 P0 / 🟠 P1 / 🟢 P2 | pré-live, puis mensuel | agent (skill audit-trame) |
| `CHECKLIST_PRE_LIVE.md` | la checklist du socle, cochée avec preuve par ligne | pré-live | agent + opérateur |
| `STRATEGIE.md` | modèle économique, paliers, scaling, ce qu'on ne fait pas | quand le produit vend | opérateur + agent |
| `ENTITE_FISCALITE.md` | entité, obligations, échéances, taxes de transaction | si le projet vend | agent conseiller + opérateur |
| `CHANGELOG.md` (racine) | ce qui a changé, daté, en langage humain | vivant | agent |

Conventions vues et retenues :
- `CLAUDE.md` = règles + état courant (lu à chaque session) ; il **pointe** vers
  `docs/planning/`, il ne les recopie pas. `AGENTS.md` (vu sur 3 projets) n'est
  utile que si plusieurs outils d'agents lisent le repo : alors `CLAUDE.md`
  contient `@AGENTS.md` et le contexte fonctionnel vit là.
- Les audits datés (`AUDIT_<sujet>_<date>.md`) s'accumulent : on ne les écrase
  pas, on en ajoute — la trajectoire se relit.
- Un plan « PLAN_<chantier>.md » par chantier ouvert (skill nouveau-chantier).
