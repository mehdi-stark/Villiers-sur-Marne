# MÉTHODE — les phases d'un projet (une fois, dans l'ordre)

| Phase | Prompt à coller | Livrable | Porte de sortie |
|---|---|---|---|
| 00 · Cockpit squelette | `3-outillage/recettes/COCKPIT_SQUELETTE.md` | app + tokens + responsive + OTP minimal + `/pilotage/cadrage` et `/pilotage/backlog` + table `decisions` | capture desktop + 390 px, commit — **même si l'app n'est pas encore certaine** |
| 0 · Cadrage | `prompts/PROMPT_00_CADRAGE.md` | besoin, personas, parcours, périmètre, risques — **rendu dans le cockpit** | décisions tranchées DEPUIS le cockpit (table `decisions`), reportées dans le doc |
| 0bis · Marché | skill `analyse-marche` (domaine) | dossier de marché chiffré, verdict | viabilité prouvée, pas jugée |
| 1 · Architecture | `prompts/PROMPT_01_ARCHITECTURE.md` | audit pré-implémentation, décisions numérotées, invariants | invariants écrits (argent gaté, IA n'invente pas, QA) |
| 1bis · Outils & process | `prompts/PROMPT_01B_OUTILS_AGENTIQUE_PROCESS.md` + `3-outillage/OUTILS.md` | choix d'outils DATÉ, niveaux d'automatisation, SOP | quotas connus, jobs longs placés hors serverless |
| 2 · Règles | `prompts/PROMPT_02_REGLES.md` + `regles/TEMPLATE_CLAUDE_MD.md` | CLAUDE.md du projet | règles permanentes + doctrine incluses |
| 3 · Build | `prompts/PROMPT_03_BUILD.md` | maillons livrés un à un | test réel + commit + doc à chaque maillon |
| 4 · Qualité | `prompts/PROMPT_04_QUALITE.md` | agents QA, gates, replis | verdicts historisés |
| 5 · Pré-live | `regles/CHECKLIST_PRE_LIVE.md` | durcissement | checklist intégrale |
| ∞ · Vie | `prompts/PROMPT_05_…` + skills | amélioration continue, revues, leçons | chaque réponse = 3 propositions |

Les plateformes (`1-plateformes/`) et domaines (`2-domaines/`) AJOUTENT leurs
prompts et exigences à ces phases — ils ne les remplacent pas.

**Le cadrage et le backlog se font DEPUIS le back-office** (règle du 04/09/2026) :
le fichier `docs/planning/*.md` reste la source de vérité relue à froid, mais il
se lit, se tranche et se valide dans le cockpit du projet — d'où la phase 00.
