# Runbook de déploiement — ville

## Pré-requis (une fois)
- Node 22, pnpm 10, CLI Vercel connectée (`vercel whoami`).
- Base Neon créée : `~/code/trames/3-outillage/scripts/creer-base-neon.sh ville` (idempotent : renvoie l'URI si la base existe).
- Variables posées sur Vercel (voir `ENV.md`) : `vercel env add <NOM> production`.

## Déployer (une commande par cible)
- Cockpit : `pnpm typecheck && pnpm build` (local, doit passer) → `vercel --prod` → **vérifier READY** (`vercel ls` ou `vercel inspect <url>`), jamais supposer → smoke test : `/connexion` en 200, `/` redirige vers `/connexion` hors session, OTP reçu en réel.
- Captures après déploiement : `node scripts/capturer.mjs --base https://<url> --forger <email whitelisté> --viewport 390x844` (la session forgée exige `AUTH_SECRET` de prod dans l'env local — sinon capturer la page de connexion seulement).

## Migrations
- Générées depuis `db/schema.ts` (`pnpm db:generate`), jamais écrites à la main ; appliquées AVANT le code qui s'en sert : `pnpm db:migrate` avec `DATABASE_URL` de la cible, par l'agent lui-même.
- La CI échoue si le schéma a divergé des migrations.

## Rollback
- Vercel : `vercel rollback` (ou promouvoir le déploiement précédent) ; les migrations sont additives — ne jamais dropper une colonne dans la même version que le code qui cesse de la lire.

## Pièges payés
- **Protection SSO Vercel de l'équipe `yuqots-projects`** : au 04/09/2026 elle renvoie `/connexion` vers `vercel.com/sso-api` — le cockpit est injoignable depuis un téléphone. À retirer sur CE projet (Vercel → ville → Settings → Deployment Protection → « Only Preview Deployments » ou Off ; ou ajouter un domaine de production, non protégé par défaut). La lecture du jeton CLI pour le faire par l'API a été refusée par le garde-fou de la session : geste opérateur.
- Vercel Hobby : 100 déploiements/jour (annulés compris), 300 s/fonction → pousser en lot.
- Auteur de commit : `cartcallai-lab` (config locale du repo) — à confirmer avant d'ajouter un remote.
- Le script `creer-base-neon.sh` créait une base puis plantait à l'affichage (f-string avec `\"`, Python 3.14) : corrigé et rendu idempotent le 04/09/2026.
