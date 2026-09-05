# ville — état courant (05/09/2026) — LIRE EN PREMIER

**Projet** : portail famille de nouvelle génération proposé à Villiers-sur-Marne
(B2G : client = mairie / Infocom'94, paiement famille = PayFIP). Cadrage, analyse de
marché, audit et direction artistique rédigés dans `docs/planning/`.
**⏸ 21 décisions attendent Mehdi dans le cockpit** (7 cadrage, 7 design, 1 marché,
6 backlog) — le verdict marché reste **NO-GO tant que l'interop Agora+ n'est pas parée**.

**Au début de CHAQUE session** : `pnpm decisions` (décisions tranchées depuis le cockpit),
les reporter dans le document canonique avec la date, puis `pnpm decisions --reporter <id,…>`.
Puis relire `.claude-consignes.md` et `.claude-resume.txt`.

**Trois applications déployées SÉPARÉMENT** (monorepo pnpm, Next.js 15 App Router, TS strict) :
- **Cockpit** `apps/cockpit` → https://villiers-sur-marne.vercel.app — pilotage, décisions,
  cadrage, direction artistique, marché, backlog, données et tarifs, journal des présentations.
- **Portail famille** `apps/famille` → https://villiers-famille.vercel.app — PWA : Ma semaine,
  Calendrier (mois), Factures, Démarches, Activités et tarifs, Enfants, Appareils, Réglages ;
  vitrine publique `/decouvrir` + dossier PDF ; lien de présentation borné `/presentation`.
- **Back-office agents** `apps/agents` → https://villiers-agents.vercel.app — PWA : file du
  jour et pointage, démarches à valider, activités, familles, réglages (réinitialiser la démo).

**Partagé** : `packages/core` (schéma Drizzle unique + migrations GÉNÉRÉES, auth PAR app
`creerAuth`, passkeys, push, données réelles de Villiers, facturation, PayFIP, documents PDF,
démonstration bornée, runs/cron) et `packages/ui` (jetons, primitives, coquilles, thème).
**Jamais** de session, cookie ou secret partagé entre apps.

**Prouvé** (tests réels bout en bout, captures 1440 + 390 sans débordement) : OTP + passkeys,
réservation/annulation avec verdict de délai, semaine type, pointage, démarche à pièces
famille → agent → famille, attestation PDF servie à la seule famille, cron de rappel + push,
lien de présentation (altéré/expiré/absent → 403), anti-pourrissement de la démo.

**Ce qui n'existe PAS** : le numéro client PayFIP (différé par Mehdi, mode MVP), l'accord
écrit de la ville sur son logo, l'auto-déploiement GitHub→Vercel, l'ordonnanceur externe du
cron, toute source de données réelle (Agora+ / API ville).

**Commandes** : `pnpm dev` · `pnpm typecheck` · `pnpm build` · `pnpm db:generate` / `db:migrate`
· `pnpm decisions` · `pnpm deployer <app>` · `pnpm --filter @ville/core test` ·
captures : `node scripts/capturer.mjs --forger mehdi.stark@gmail.com [--dark]` dans chaque app.

---

# Gabarit de CLAUDE.md

> Le CLAUDE.md de Delivup, anonymisé en gabarit. Remplacez les [CROCHETS], supprimez ce
> qui ne s'applique pas — mais gardez la structure : elle a fait ses preuves.

---

```markdown
# [PROJET] — guide pour Claude Code

[Une phrase : ce qu'est le produit.] Contexte complet dans `docs/planning/` — à lire
avant toute décision structurante, notamment `AUDIT_PRE_IMPLEMENTATION.md`.

## Stack retenue

- **[Framework front+back]** pour chaque application — pas d'API séparée.
- **[Base de données]** : source de vérité unique. **[ORM]** : schéma unique dans
  `[chemin]`, migrations GÉNÉRÉES (jamais écrites à la main).
- **[Email]** : un seul fournisseur — ne pas en réintroduire un second.
- **[Automatisation]** : hors de ce repo ; jamais appelée directement depuis du code
  client (voir Sécurité).
- **[Validation]** : toute entrée réseau passe par un schéma de validation.

## Structure du repo

[arbre : apps, package partagé, docs/planning]
Le package partagé contient le strict commun (schéma, clients techniques, validation,
rendu de gabarits). Si un ajout ne sert qu'à une app, il vit dans cette app.

## Base de données — pas de SQL écrit à la main

`[schema]` est la SEULE source de vérité. Toute évolution : modifier le schéma →
générer la migration → l'appliquer. Ne jamais éditer une migration générée.
[Pièges connus du driver : ex. les numériques rendus en string → toujours convertir.]

## Règle non négociable : les apps se déploient séparément

Deux déploiements, deux domaines. JAMAIS : session/cookie partagé entre apps,
build de l'une dépendant de l'autre, logique métier d'une app dans le package partagé.

## Sécurité — patterns en place, à respecter

- **[App client] n'a pas de session utilisateur** : accès par lien à usage unique
  (table de tokens). Ne pas introduire de compte sans décision explicite.
- **Aucun secret côté navigateur.** Toute clé reste dans une route serveur.
- **Les clients techniques contournent les protections de la base** : toute fonction
  qui les utilise filtre explicitement par identifiant après vérification d'un token.
- **Ne jamais appeler [l'automatisation] depuis une route** : écrire l'ÉTAT en base,
  laisser le webhook base-de-données notifier. Les routes ne connaissent aucun secret
  du moteur d'automatisation.

## IA — la machine assemble, elle n'invente jamais

- Les chiffres, prix et décisions viennent du CODE ; l'IA lit (vision/analyse), rédige
  et exécute ; l'humain valide aux gates. Rien ne part chez un client sans validation.
- Modèles configurés par tâche dans la table `[ai_model_settings]` — lue à l'exécution,
  modifiable dans l'admin sans redéploiement.
- Chaque génération passe par un agent QA (contre-lecture contre ses données sources,
  verdict + score historisés dans `[qa_reviews]`).

## Documents générés

Toujours stocker À LA FOIS les données structurées qui ont servi ET l'instantané rendu
réellement montré — jamais l'un sans l'autre. Templates de messages en base, lus au
moment de l'envoi (modifiables dans l'admin sans redéploiement).

## Doctrine commerce — 3 règles à suivre dans l'absolu

Règles d'Abdurrahman Ibn Awf (baraka). Texte complet :
`TRAME/0-socle/regles/DOCTRINE_COMMERCE.md` ; skill global `doctrine-commerce`.
Elles valent pour toute décision de prix, d'offre, de commande, de mode de
paiement, de marché ou de gate d'argent — et se CODENT dans les verdicts, pas
seulement dans les prompts.

1. **Ne jamais refuser un profit, aussi petit soit-il** — profit = net après tous
   les coûts. Les seuils de viabilité choisissent où investir l'effort ; ils ne
   refusent jamais une vente rentable existante.
2. **Ne jamais retarder une vente** — paiement actif = chemin critique ; vente
   payée honorée le jour même ; aucun gate de contenu ne bloque une vente.
3. **Ne pas vendre à crédit, dans la mesure du possible** — paiement immédiat par
   défaut ; pas de COD comme mode principal, pas de crédit B2B.

## Méthode de travail

- Maillon par maillon : un maillon = code + TEST EN RÉEL bout en bout + commit +
  pipeline visuel (`/pipeline`) mis à jour. Jamais deux chantiers ouverts.
- Proposer les optimisations et signaler les incohérences au fil de l'eau.
- Un client/lead de test préfixé `[TEST]` sert à tous les tests bout en bout.

## Règles permanentes de session (elles s'appliquent SANS qu'on les redemande)

1. **Terminer chaque réponse — et chaque session — par 3 propositions
   d'amélioration numérotées** : une Feature, une Design, une UX. Concrètes et
   ancrées dans CE projet, jamais des généralités. Chacune en deux lignes : ce
   qu'elle débloque, son coût approximatif, et la recommandation (faire
   maintenant / plus tard sous condition / non).
   - « ajoute les propositions » ou « applique la proposition 2 » = les
     EXÉCUTER, pas les redécrire.
   - Une proposition écartée ne se répète jamais ; celle qui n'est pas prise
     descend dans `docs/planning/BACKLOG.md` avec sa décision — sinon elle se
     reperd et on la repropose dans trois sessions.
2. **Charger le skill `amelioration-continue`** au début de la session, et
   `doctrine-commerce` dès qu'une décision touche au prix, à l'offre, au mode de
   paiement ou à un gate d'argent.
3. **Design premium par défaut** (charte en jetons, responsive et mobile réels,
   états vides et disabled traités) : un détail brut signale la qualité de tout
   le produit.
4. **Chaque erreur corrigée devient une leçon** dans `docs/planning/LECONS.md`,
   la même session — et remonte dans la trame si elle est générique.

## Avant de committer

- `[commandes de build des apps]` doivent passer.
- [Pièges de build connus, ex. pages dynamiques à forcer.]
- Exclure systématiquement du commit : `[fichiers de secrets, .mcp.json…]`.

## Ce qui reste explicitement à faire (ne pas supposer que c'est fait)

- [Authentification staff / RLS / rate-limits — l'app n'est pas exposable telle quelle]
- [Vérification de signature des webhooks entrants]
- [Passage des produits de paiement en mode réel]
- [Liste vivante — la mettre à jour à chaque maillon terminé]
```

## Trame (repo central ~/code/trames — lire TRAME/DEMARRER.md puis TRAME/0-socle/EXIGENCES.md)
- Plateforme(s) : web · Domaine(s) : saas · voir `.trame.json`.
- Le niveau attendu est dans `TRAME/0-socle/EXIGENCES.md` ; les outils dans `TRAME/3-outillage/OUTILS.md` (choisir en phase 1bis, écrire les quotas).
- Skills : socle = globaux (~/.claude/skills) ; plateformes/domaines = `.claude/skills/` (liens vers ~/code/trames). Leçon de MÉTHODE → repo trames + publier.sh ; leçon métier → socle du projet.

## Règles de travail permanentes

### 1. Amélioration continue (fin de CHAQUE réponse)
Termine chaque réponse par une section « Propositions d'amélioration » avec
exactement trois axes :
- **Feature** — une fonctionnalité qui apporterait de la valeur métier maintenant
- **Design** — une amélioration visuelle ou de cohérence de l'interface
- **UX** — une friction réelle d'utilisateur à supprimer

Règles : propositions CONCRÈTES et actionnables (pas de généralités), ancrées
dans ce qui vient d'être livré ou observé dans le code, jamais répétées d'une
fois sur l'autre si elles n'ont pas été retenues. Si je dis « ajoute les
propositions » ou « continue », applique-les.

### 2. Design premium — niveau d'exigence
Tout écran livré doit viser le niveau Linear / Stripe Dashboard, pas un rendu
de prototype. Concrètement :
- **Charte unique** : couleurs, typographies (une display + une body via
  next/font, jamais les polices par défaut), rayons, ombres — définis en
  tokens CSS (:root) et utilisés PARTOUT. Zéro gris Tailwind par défaut.
- **Micro-interactions discrètes** : moteur `motion` (Framer Motion) —
  transitions 200-300 ms, spring léger au tap sur les gros boutons, compteurs
  animés sur les chiffres clés. JAMAIS d'effets spectaculaires (particules,
  3D) dans un outil de travail — réserve-les aux landing pages.
- **Primitives accessibles** : dialogs/menus/tooltips sur Radix (copy-in
  stylé charte, philosophie shadcn) — jamais un confirm() navigateur, jamais
  une modale maison sans focus trap.
- **Finition avant livraison** (checklist bloquante) : libellés humains (pas
  de codes techniques affichés), états disabled cohérents, responsive mobile
  vérifié, fuseau horaire explicite sur toute heure affichée, téléchargements
  en blob côté client, tables qui scrollent dans leur conteneur.
- Contrainte : uniquement des librairies éprouvées (licence MIT claire,
  traction réelle) — jamais de librairie douteuse.

## Doctrine commerce — 3 règles à suivre dans l'absolu
1. **Ne jamais refuser un profit, aussi petit soit-il.** Profit = gain NET
   après tous les coûts réels et probables (COGS, port, taxes, paiement,
   retours, SAV). Les seuils de viabilité choisissent OÙ investir l'effort ;
   ils ne refusent jamais une vente rentable existante. Rien sur la table :
   bundle, cross-sell, gamme, marchés de même langue.
2. **Ne jamais retarder une vente.** Le paiement actif est LE chemin
   critique ; une vente payée s'honore le jour même ; aucun gate de contenu
   ne bloque une vente possible ; une offre se valide quand elle peut vendre.
3. **Ne pas vendre à crédit, dans la mesure du possible.** Paiement immédiat
   par défaut ; le différé sans frais est licite mais la baraka vient du
   cashflow direct ; pas de contre-remboursement comme mode principal
   (15-30 % de refus = crédit), pas de crédit B2B.
