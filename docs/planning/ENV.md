# Inventaire des variables d'environnement — ville (AUCUNE valeur ici)

## Cockpit (Next.js, racine du repo)
| Variable | Rôle | Où elle vit (hébergeur / VPS / CI) | Obligatoire |
|---|---|---|---|
| `DATABASE_URL` | Base Neon « ville » (une base PAR projet, id `crimson-band-15200530`, eu-central-1) | Vercel (prod) · `.env.local` (dev) · CI : URL factice (build seulement) | oui |
| `AUTH_SECRET` | Signature HMAC des sessions et des empreintes OTP — propre à ce projet | Vercel · `.env.local` | oui |
| `ADMIN_EMAILS` | Whitelist des e-mails autorisés à se connecter (virgules) | Vercel · `.env.local` | oui |
| `RESEND_API_KEY` | Envoi des codes OTP (Resend, seul fournisseur). Absente → alerte « email_cle_absente », aucun code ne part | Vercel | oui en prod |
| `AGENT_SECRET` | Autorise `POST /api/agent` (l'agent notifie l'opérateur, `pnpm notifier`) | Vercel · `.env.local` | oui pour les notifications |
| `COCKPIT_URL` | URL du cockpit visée par `pnpm notifier` | `.env.local` (Mac) | non (défaut localhost) |
| `PUSH_CONTACT` | Contact VAPID (`mailto:`) | Vercel | non |
| `EMAIL_FROM` | Expéditeur (`Ville <…@domaine-vérifié>`) ; défaut `onboarding@resend.dev` (tests seulement) | Vercel | non |

Modèle : `.env.example`. Le test `scripts/tests/tap-decision.mjs` exige `test@ville.local` dans `ADMIN_EMAILS` du serveur visé — **dev uniquement**, jamais en prod.

## Accès & comptes — qui possède quoi
| Service | Compte | Propriétaire | Récupération |
|---|---|---|---|
| Neon (base) | organisation `org-square-star-05491818`, projet `ville` | Mehdi | clé API `~/.config/trames/neon.env` ; URI via `creer-base-neon.sh ville` (idempotent) |
| Vercel (hébergement) | compte `contact-6950` (CLI connectée sur le Mac) | Mehdi | `vercel whoami` |
| Resend (e-mail) | **à créer / clé à poser** pour ce projet — un service ≠ un compte : ne pas réutiliser la clé d'un autre projet | Mehdi | dashboard Resend → API Keys |
| GitHub (CI) | `mehdi-stark/ville` — remote posé, dépôt À CRÉER (jeton `~/.config/trames/github.env` puis `creer-depot-github.sh mehdi-stark ville`) | Mehdi (mehdi-stark) | SSH du Mac authentifié comme mehdi-stark |
| Vercel cible | compte **mehdi-stark** demandé le 04/09/2026 — la CLI du Mac est connectée à `contact-6950` / équipe `yuqots-projects` (déploiement actuel) | Mehdi | `vercel login` (mehdi-stark) ou import du dépôt GitHub depuis le dashboard |

Règles : jamais de `NEXT_PUBLIC_*` pour un secret ; `.env*` jamais commité (`.gitignore`) ; fichier append-only si plusieurs mains.
