Nouveau projet — déroule la trame jusqu'au premier maillon testé en réel.

IDÉE : Ville — Application web / SaaS
Je voudrais recréer le dashboard des services publics de Villiers-sur-Marne. Actuellement leur application des services familiaux, etc. est affreusement nulle, tant en termes de design qu'en termes de fonctionnalité, ça marche pas. Du coup il faut vraiment tout refaire. En fait je voudrais leur proposer une nouvelle version. Une fois que j'aurai accès à leur API, ça pourra être fait correctement,

PLATEFORMES / DOMAINES : --plateforme web --domaine saas (dans .trame.json)
CONTRAINTES : <budget, délai, comptes disponibles, ce qui existe déjà — ou « aucune »>

Règles : lis d'abord CLAUDE.md, TRAME/DEMARRER.md, TRAME/0-socle/EXIGENCES.md,
TRAME/0-socle/DOCS_PROJET.md et les 10 leçons de TRAME/0-socle/lecons/. Charge
les skills amelioration-continue, doctrine-commerce, analyse-marche (si le
projet vend). Le niveau attendu est celui d'EXIGENCES.md, sans exception.

Étapes (un livrable par étape, dans docs/planning/ à partir des gabarits) :
1. CADRAGE.md — besoin, personas, parcours, périmètre, risques, décisions à
   valider. ⏸ STOP : je valide le cadrage.
2. ANALYSE_MARCHE.md — demande MESURÉE (mesurer-demande.mjs), grille pondérée
   avec preuves, P&L par code (taxes incluses), moat/tête de pont, verdict
   go/no-go. ⏸ STOP : je valide le verdict.
3. AUDIT_PRE_IMPLEMENTATION.md — stack (défauts de TRAME/3-outillage/OUTILS.md
   sauf raison écrite), architecture, invariants, décisions numérotées ;
   BENCHMARK_OUTILS.md daté avec quotas ; CARTE_AUTOMATISATION.md ;
   PROCESS_METIERS.md. ⏸ STOP : je valide les décisions et les outils.
4. CLAUDE.md complété (état courant, stack, structure, invariants) ;
   PLAN_EXECUTION.md par maillons ordonnés par ce qu'ils débloquent.
5. Squelette du projet au niveau attendu : repo, CI (typecheck, build, tests,
   schéma ↔ migrations), charte en tokens, auth (magic-link + OTP si
   opérateur — recette AUTH_OTP_MAGIC_LINK : OTP obligatoire, lien optionnel),
   layout responsive + mobile PARTOUT, **PWA installable pour toute application à
   compte (recette PWA_APPLICATION)**, cron résilient
   (heartbeat, verrou, journal), file de jobs longs, alertes ; ENV.md et
   DEPLOIEMENT.md ; script de capture (TRAME/3-outillage/scripts/capturer.mjs
   adapté) et collecteur de revue. Rien de « à faire à la main » sans avoir
   tenté l'API.
6. Premier maillon MÉTIER : code → test EN RÉEL bout en bout → captures
   desktop + 390 px sans débordement → commit détaillé → docs à jour.
7. Termine par : l'état (ce qui est fait/prouvé), ce qui m'attend (comptes,
   clés, argent — les seuls irréductibles), et 3 propositions Feature/Design/UX.

Ne saute aucune étape ; n'invente aucun chiffre ; chaque affirmation porte
sa preuve ; chaque erreur corrigée devient une leçon dans LECONS.md.
