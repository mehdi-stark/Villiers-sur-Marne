# ville — état courant (04/09/2026) — LIRE EN PREMIER

**Projet** : portail famille de nouvelle génération pour Villiers-sur-Marne (B2G :
client = mairie / Infocom'94, paiement famille = PayFIP). Cadrage rédigé
(`docs/planning/CADRAGE.md`), **en attente des décisions de l'opérateur**.
Étapes 1-2/7 : cadrage (7 décisions) et **verdict marché calculé : 68/100, GO
conditionnel dégradé à NO-GO** tant que la faille « pas d'API Agora+ » n'est pas parée
(`lib/marche.ts`, `/pilotage/marche`) — **aucun code MÉTIER avant** que l'opérateur tranche.

**Au début de CHAQUE session** : `pnpm decisions` — les décisions prises depuis le
cockpit (table `decisions`) ; les reporter dans le document canonique avec la
date, puis `pnpm decisions --reporter <id,…>`. Puis relire `.claude-consignes.md`.

**Structure (monorepo pnpm, 04/09/2026)** : `apps/cockpit` (pilotage, port 3000) · `apps/famille` (portail famille PWA, 3001) ·
`apps/agents` (back-office agents PWA, 3002) · **`packages/ui`** (jetons `tokens.css` + `base.css` + primitives React — SEULE source de style, aucune app ne redéfinit de jetons) · `packages/core` (`db/schema.ts` + migrations, `src/auth.ts` `creerAuth` PAR app,
`src/donnees/` adaptateur + règles réelles, `src/communes.ts` thème par commune, e-mail, alertes, push). Les documents
canoniques restent à la racine (`docs/planning`), lus par le cockpit via `../../docs/planning`. **Trois déploiements séparés,
trois cookies/secrets** (`ville_session`/`AUTH_SECRET`, `famille_session`/`FAMILLE_AUTH_SECRET`, `agents_session`/`AGENTS_AUTH_SECRET`).

**Ce qui existe et est PROUVÉ** (maillon 0, recette `TRAME/3-outillage/recettes/COCKPIT_SQUELETTE.md`) :
- Cockpit Next.js 15 (App Router, TS strict) dans `apps/cockpit` : `/` pilotage, `/pilotage/cadrage`
  (décisions en un tap), `/pilotage/decisions` (tout ce qui attend, badge PWA), `/pilotage/marche` (verdict par code), `/pilotage/backlog`, `/connexion`
  (OTP e-mail, whitelist `ADMIN_EMAILS`). PWA (manifest, `public/sw.js` push-only, icônes `pnpm icones`),
  push web (`lib/push.ts`, `pnpm notifier "Titre" "Corps" /url` → l'opérateur).
- Base Neon « ville » (une base par projet) ; schéma `db/schema.ts` (Drizzle, migrations
  GÉNÉRÉES dans `db/migrations`) : `decisions`, `otp_codes`, `journal_connexions`, `alertes`, `parametres`, `push_abonnements`.
- Charte en jetons `app/globals.css` (clair/sombre, registre admin sobre), coquille
  `components/coquille.tsx` (header collant, drawer Radix), `components/decision.tsx`.
- Preuves : `captures/*-1440.png` et `*-390.png` sans débordement (`pnpm capturer --forger <email>`),
  test réel du tap `scripts/tests/tap-decision.mjs` (auto-purgé), CI `.github/workflows/ci.yml`.
- Convention du §7 du cadrage : dernière ligne `Options : A · B — Recommandation : A` (parsée par `lib/docs.ts`).

**Déployé (3 projets Vercel mehdi-starks-projects, sans SSO)** : cockpit `https://villiers-sur-marne.vercel.app` · famille `https://villiers-famille.vercel.app` · agents `https://villiers-agents.vercel.app` — `pnpm deployer cockpit|famille|agents` (depuis la racine). GitHub `mehdi-stark/Villiers-sur-Marne`.
**Données** : adaptateur `packages/core/src/donnees/` (`SOURCE_DONNEES=fictif`), règles réelles de Villiers sourcées, écritures persistées (`reservations.ts` : réserver/annuler avec verdict, pointer), page `/pilotage/donnees`.
**Design** : recette `TRAME/3-outillage/recettes/DIRECTION_ARTISTIQUE.md` — références, maquette validée AVANT tout nouvel écran (skill `design`, décision `design:*`), rubrique /5 par capture (`docs/planning/REFERENTIEL_DESIGN.md`).
**Auth (3 apps)** : OTP + passkeys (`packages/core/src/passkeys.ts`, `/api/passkey`, `/appareils`) ; identité `mehdi.stark@gmail.com` (JAMAIS `admin@delivup.io`, réservé à Delivup).
**Tests réels** : `apps/cockpit/scripts/tests/*` (tap décision, consigne Lanceur), `apps/famille/scripts/tests/*` (réservation, passkey), `apps/agents/scripts/tests/tap-pointage.mjs` — tous auto-purgés, acteur `test@ville.local` (à mettre dans la liste blanche du serveur de dev).

**Ce qui n'existe PAS encore** : connexion GitHub → Vercel (app GitHub à installer),
`RESEND_API_KEY` en prod (sans elle aucun code ne part — alerte affichée), passkeys/appareils,
cron, file de jobs, thème par commune, tout le métier (réservations, factures…).

**Commandes (racine)** : `pnpm dev` (cockpit) · `pnpm -r typecheck` · `pnpm -r build` · `pnpm -r test` · `pnpm db:generate` /
`db:migrate` / `db:check` (core) · `pnpm decisions` · `pnpm notifier` · captures : `cd apps/<app> && node ../cockpit/scripts/capturer.mjs --base http://localhost:<port> --app famille|agents --forger <email> --viewport 390x844 [--dark]`.
Secrets locaux : `apps/*/.env.local` et `packages/core/.env.local` (jamais commités).

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
