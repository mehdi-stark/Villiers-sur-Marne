# Plateforme web — back-office / cockpit / SaaS

Stack de référence (voir `3-outillage/OUTILS.md`) : Next.js App Router (front
ET back), Postgres (Supabase, Neon en repli) + Drizzle (migrations générées),
Vercel + un VPS pour les jobs longs, n8n/QStash pour l'orchestration.

## Exigences spécifiques (en plus de `0-socle/EXIGENCES.md` §3)
- Auth : **OTP obligatoire** + magic-link optionnel (code en premier en mode installé),
  whitelist ou comptes, session signée 30 j ; tout échec d'envoi = alerte ; passkeys en V2
  (`3-outillage/recettes/AUTH_OTP_MAGIC_LINK.md`).
- **Responsive partout ; PWA pour toute application à compte** (manifest, icônes par code, SW push-only, fichiers publics, push, badge) — `3-outillage/recettes/PWA_APPLICATION.md`.
- **Pilotage dès le maillon 0** : `/pilotage/cadrage` et `/pilotage/backlog` rendent
  les documents canoniques et écrivent les décisions en base (recette
  `3-outillage/recettes/COCKPIT_SQUELETTE.md`) — le cadrage se fait depuis le cockpit.
- Cockpit : verdicts sur chaque décision, textes générés structurés, listes
  groupées, vides expliqués, palette ⌘K, notifications push (PWA) pour les
  décisions et les pannes critiques, bandeau « travail en cours » + état.
- Mobile : drawer + header collant, safe areas, inputs ≥ 16 px, tables qui
  défilent, `min-width: 0` sur les items de grille — vérifié en capture 390 px.
- Jobs > 10 s : file en base, exécuteur sans plafond, run visible, clôture
  garantie des fantômes.
- Un script de capture (playwright, session forgée, multi-écrans, viewport
  paramétrable, détection de débordement) existe dès la première session.

Skill : `skills/audit-app` (la boucle d'audit visuel outillée).

## Design — deux registres (leçon CartCall / Une Chance)
- **Produit client (marketing-facing)** : stylé ET fluide — shadcn/Radix stylé charte, motion discret (transitions de page, compteurs, CTA), « la qualité perçue vend ».
- **Admin / cockpit** : Linear / Stripe, sobre, dense, lisible.
- Commun : tokens `:root`, next/font, primitives accessibles, états vides distincts, libellés humains, fuseau explicite ; gabarit `REFERENTIEL_DESIGN.md`.
