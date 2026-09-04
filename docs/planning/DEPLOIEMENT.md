# Runbook de déploiement — ville

## Pré-requis (une fois)
- Node 22, pnpm 10, CLI Vercel connectée (`vercel whoami`).
- Base Neon créée : `~/code/trames/3-outillage/scripts/creer-base-neon.sh ville` (idempotent : renvoie l'URI si la base existe).
- Variables posées sur Vercel (voir `ENV.md`) : `vercel env add <NOM> production`.

## Déployer (une commande par cible)
- Cockpit : `pnpm typecheck && pnpm build` (local, doit passer) → `vercel --prod` → **vérifier READY** (`vercel ls` ou `vercel inspect <url>`), jamais supposer → smoke test : `/connexion` en 200, `/` redirige vers `/connexion` hors session, OTP reçu en réel.
- Captures après déploiement : `node scripts/capturer.mjs --base https://<url> --forger <email whitelisté> --viewport 390x844` (la session forgée exige `AUTH_SECRET` de prod dans l'env local — sinon capturer la page de connexion seulement).

## Cible en place (04/09/2026) : GitHub `mehdi-stark/Villiers-sur-Marne` + Vercel `mehdi-starks-projects/villiers-sur-marne`
- Déployer : `T="$(grep '^VERCEL_ACCESS_TOKEN=' .env.local | cut -d= -f2-)"; vercel deploy --prod --yes --token "$T" > /tmp/deploy.log 2>&1` puis `vercel ls --token "$T"` → **READY**, puis `curl -I https://villiers-sur-marne.vercel.app/connexion` → 200.
- Toujours citer le jeton (`--token "$T"`) : non cité, la CLI l'AFFICHE dans son message d'erreur (payé le 04/09/2026 → jeton à révoquer).
- Deployment Protection : retirée par l'API (`PATCH /v9/projects/{id} {"ssoProtection":null}`) — le cockpit a son OTP.
- Connexion GitHub → Vercel (déploiement à chaque push) : `vercel link` a échoué (« Failed to connect ») car l'app GitHub de Vercel n'est pas installée sur le compte mehdi-stark — un clic dashboard (Settings → Git → Connect). En attendant, déployer par la CLI ci-dessus.
- Ancien projet `yuqots-projects/ville` : à supprimer par Mehdi (`vercel remove ville --scope yuqots-projects`) — non fait, c'est destructif.

## Migrations
- Générées depuis `db/schema.ts` (`pnpm db:generate`), jamais écrites à la main ; appliquées AVANT le code qui s'en sert : `pnpm db:migrate` avec `DATABASE_URL` de la cible, par l'agent lui-même.
- La CI échoue si le schéma a divergé des migrations.

## Rollback
- Vercel : `vercel rollback` (ou promouvoir le déploiement précédent) ; les migrations sont additives — ne jamais dropper une colonne dans la même version que le code qui cesse de la lire.

## Pièges payés
- `vercel --prod --yes 2>&1 | grep … | head -3` reste bloqué indéfiniment (le pipe attend la fin du processus) : lancer `vercel deploy --prod --yes > journal 2>&1 &` puis lire le journal. Le 04/09/2026, deux déploiements sont restés en état `UNKNOWN` > 6 min sans journal de build : vérifier `vercel ls` avant de dire « en ligne ».
- **Protection SSO Vercel de l'équipe `yuqots-projects`** : au 04/09/2026 elle renvoie `/connexion` vers `vercel.com/sso-api` — le cockpit est injoignable depuis un téléphone. À retirer sur CE projet (Vercel → ville → Settings → Deployment Protection → « Only Preview Deployments » ou Off ; ou ajouter un domaine de production, non protégé par défaut). La lecture du jeton CLI pour le faire par l'API a été refusée par le garde-fou de la session : geste opérateur.
- Vercel Hobby : 100 déploiements/jour (annulés compris), 300 s/fonction → pousser en lot.
- Auteur de commit : `cartcallai-lab` (config locale du repo) — à confirmer avant d'ajouter un remote.
- Le script `creer-base-neon.sh` créait une base puis plantait à l'affichage (f-string avec `\"`, Python 3.14) : corrigé et rendu idempotent le 04/09/2026.
