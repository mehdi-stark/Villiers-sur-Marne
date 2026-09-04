# Phase 1bis · Outils, agentique & process métiers

> À dérouler juste après l'architecture (phase 1), avant d'écrire les règles.
> Trois livrables : le benchmark d'outils À DATE, la carte « quoi automatiser et
> comment », et les process métiers écrits comme des SOP. C'est la phase qui évite
> de payer le mauvais outil et d'automatiser la mauvaise chose.

---

## PROMPT À COLLER

Lis `docs/planning/CADRAGE.md` et `docs/planning/AUDIT_PRE_IMPLEMENTATION.md`.
Trois livrables, dans cet ordre. Ne code rien.

### 1 · `docs/planning/BENCHMARK_OUTILS.md` — les meilleurs outils, vérifiés à date

Pour CHAQUE besoin du projet (génération de texte, vision, images, emails,
automatisation, paiement, analytics, scraping… selon le cadrage) :

- **Recherche web OBLIGATOIRE et datée** : les prix et capacités des outils IA
  changent tous les mois — aucun chiffre de mémoire. Cite tes sources.
- Compare 3-5 options par besoin sur : prix réel à notre volume, qualité pour NOTRE
  cas d'usage (pas les benchmarks génériques), contraintes d'API qui changent tout
  (ex. : accepte-t-il les images par URL ? le format de sortie est-il contraignable ?
  quota, latence), risque de blocage (validation d'accès, compliance).
- Conclus chaque section par UN choix par défaut + le second en réserve, et le
  **critère de bascule** (« si X dépasse Y, passer à Z »).
- Règle d'or : **tout choix de modèle/outil IA se valide sur un batch de test réel**
  (5-10 cas de VRAIES données du projet, jugés à l'œil) avant industrialisation —
  prévois ce batch dans le plan.
- Prévois l'outillage pour changer d'avis sans douleur : **catalogue des modèles en
  base, configurable par tâche depuis l'admin** (changer d'outil = un clic, pas un
  déploiement) + un estimateur de coûts par client dans l'admin.

### 2 · `docs/planning/CARTE_AUTOMATISATION.md` — quoi automatiser, et avec quel niveau d'agentique

Classe CHAQUE tâche du parcours (reprends le parcours du cadrage) dans un des
quatre niveaux, et justifie :

| Niveau | Quand | Exemples d'outils |
|---|---|---|
| **1 · Code déterministe** | Le résultat doit être exact, auditable, reproductible : calculs, prix, assemblage de prompts, correspondances, seuils, verdicts | Fonctions dans l'app, SQL |
| **2 · Workflow orchestré** | Enchaînement d'étapes déclenché par un événement, avec retries et journal — la production fiable | n8n, Inngest, Trigger.dev |
| **3 · Appel IA à tâche unique** | Une entrée → une sortie contrainte (rédiger, lire une image, traduire), TOUJOURS suivie d'un QA et/ou d'un gate humain | API LLM via le routeur configurable |
| **4 · Agent autonome** | Exploration ouverte multi-étapes où le chemin n'est pas connu d'avance | Claude Code/Agent SDK, Hermes Agent, agents n8n |

Règles d'arbitrage à appliquer (issues de projets réels) :
- **Commencer au niveau le plus BAS qui marche.** Un agent autonome là où un cron
  suffit = coût, latence et imprévisibilité gratuits.
- **Niveau 4 jamais dans le parcours client de production** : les agents autonomes
  servent à l'interne (build, recherche, ops exploratoires), pas à produire ce qui
  part chez un client — la production exige du reproductible et de l'auditable.
- **L'IA ne décide jamais d'une donnée métier** (prix, montant, statut) : elle lit,
  rédige, exécute ; le code décide, l'humain valide.
- **Chaque sortie IA a son QA** (contre-lecture vs données sources) et chaque sortie
  client-facing a un gate humain OU un repli déterministe.
- Les apps n'appellent jamais le moteur de workflows directement : elles écrivent un
  ÉTAT en base, un webhook déclenche (découplage, rejouabilité).
- Documente aussi **ce qui reste manuel et pourquoi** (donnée récupérable uniquement
  à la main, geste commercial, validation légale) — et l'outillage qui rend ce manuel
  rapide (boutons, templates à copier, rappels automatiques).

### 3 · `docs/planning/PROCESS_METIERS.md` — chaque process écrit comme une SOP

Pour CHAQUE process métier du parcours (acquisition, vente, livraison, suivi,
facturation, relances, clôture…), une fiche :

- **Déclencheur** (événement, cron, action humaine)
- **Étapes numérotées**, chacune taguée [CODE] / [WORKFLOW] / [IA+QA] / [HUMAIN],
  avec entrées → sorties
- **États** : la machine à états du process (ce sont les statuts en base — la SOP
  encodée), et qui a le droit de faire quelle transition
- **Exceptions et relances** : que se passe-t-il si le client ne répond pas (J+3 ?
  combien de relances ? espacées de combien ?), si le paiement échoue, si la donnée
  est périmée — chaque exception a une réponse AUTOMATIQUE ou un responsable
- **Gates humains** : où un humain valide, et ce qu'il voit pour décider (le QA,
  les données sources)
- **KPI du process** : la mesure qui dit s'il fonctionne (délai moyen, taux de
  conversion, taux de relance efficace)

Ces fiches deviennent ensuite : les enums de statut en base, les workflows, les
crons de relance, et les files « À traiter » de l'admin — une SOP = du code.

Termine par la liste des arbitrages qui attendent ma décision.
