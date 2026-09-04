# Phase 1 · Architecture — l'audit pré-implémentation

> Prérequis : `docs/planning/CADRAGE.md` relu et corrigé par vous.
> Livrable : `docs/planning/AUDIT_PRE_IMPLEMENTATION.md` — LE document que tout le code
> référencera ensuite. Sur Delivup, c'est ce document qui a évité les allers-retours.

---

## PROMPT À COLLER

Lis `docs/planning/CADRAGE.md`. Nous passons à l'architecture. Ne code toujours rien.

Écris `docs/planning/AUDIT_PRE_IMPLEMENTATION.md` :

1. **Stack proposée, avec arbitrage écrit.** Pour chaque brique (front, back, base de
   données, stockage fichiers, emails, automatisation, monitoring, paiement), propose UN
   choix + les alternatives écartées et POURQUOI (coût, verrouillage, simplicité). Ma
   préférence par défaut : Next.js (front ET back), Supabase (Postgres + Storage),
   Resend, Sentry, n8n pour l'automatisation, Stripe pour le paiement, outils gratuits
   partout où c'est viable. Challenge cette préférence si le projet le justifie.

2. **Découpage en applications.** Quelles apps distinctes, sur quels domaines, avec quelle
   règle d'isolation (une app interne et une app client-facing ne partagent JAMAIS de
   session ; le code partagé se limite au strict commun : schéma, clients techniques,
   validation). Justifie chaque séparation.

3. **Décisions d'architecture numérotées** (§1, §2…) — les invariants que le code devra
   respecter. Sur Delivup c'étaient : schéma de base unique généré par migrations, jamais
   de SQL à la main ; aucun secret côté navigateur ; les apps n'appellent jamais le moteur
   d'automatisation directement — elles écrivent un ÉTAT en base et un webhook déclenche ;
   accès client par lien à usage unique plutôt que par compte ; toujours stocker les
   données structurées ET l'instantané rendu d'un document. Adapte au projet, chaque
   décision avec son pourquoi.

4. **Modèle de données V1** : les tables, leurs colonnes clés, les statuts (machines à
   états explicites), les points d'idempotence (webhooks, imports).

5. **Cartographie des automatisations** : liste des workflows avec un code court chacun
   (ex. XX-01 dispatcher, XX-02 erreurs…), leur déclencheur (état en base, cron,
   webhook externe), et les GATES HUMAINS — les endroits où rien ne part sans validation.

6. **Là où l'IA intervient** — et la règle : l'IA lit, rédige, exécute ; elle ne décide
   jamais d'un prix, d'un montant ou d'une donnée métier ; tout ce qui peut être
   déterministe EST déterministe (assemblé par code). Prévois dès maintenant : une table
   de configuration des modèles par tâche (changer de modèle sans redéployer), et un agent
   QA par génération (contre-lecture contre les données sources, verdict historisé).

7. **Estimation des coûts de fonctionnement** par client/mois (API IA, outils) et
   **points ouverts** numérotés pour que je tranche.

Vérifie les prix et disponibilités des services par recherche web — pas de chiffres de
mémoire. Termine en me présentant les arbitrages qui attendent ma décision.
