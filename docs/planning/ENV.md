# Inventaire des variables d'environnement — ville (AUCUNE valeur ici)

## Cockpit (Next.js, racine du repo)
| Variable | Rôle | Où elle vit (hébergeur / VPS / CI) | Obligatoire |
|---|---|---|---|
| `DATABASE_URL` | Base Neon « ville » (une base PAR projet, id `crimson-band-15200530`, eu-central-1) | Vercel (prod) · `.env.local` (dev) · CI : URL factice (build seulement) | oui |
| `AUTH_SECRET` | Signature HMAC des sessions et des empreintes OTP — propre à ce projet | Vercel · `.env.local` | oui |
| `ADMIN_EMAILS` | Whitelist des e-mails autorisés à se connecter (virgules) | Vercel · `.env.local` | oui |
| `RESEND_API_KEY` | Envoi des codes OTP (Resend, seul fournisseur). Absente → alerte « email_cle_absente », aucun code ne part | Vercel | oui en prod |
| `EMAIL_FROM` | Expéditeur (`Ville <…@domaine-vérifié>`) ; défaut `onboarding@resend.dev` (tests seulement) | Vercel | non |

Modèle : `.env.example`. Le test `scripts/tests/tap-decision.mjs` exige `test@ville.local` dans `ADMIN_EMAILS` du serveur visé — **dev uniquement**, jamais en prod.

## Accès & comptes — qui possède quoi
| Service | Compte | Propriétaire | Récupération |
|---|---|---|---|
| Neon (base) | organisation `org-square-star-05491818`, projet `ville` | Mehdi | clé API `~/.config/trames/neon.env` ; URI via `creer-base-neon.sh ville` (idempotent) |
| Vercel (hébergement) | compte `contact-6950` (CLI connectée sur le Mac) | Mehdi | `vercel whoami` |
| Resend (e-mail) | **à créer / clé à poser** pour ce projet — un service ≠ un compte : ne pas réutiliser la clé d'un autre projet | Mehdi | dashboard Resend → API Keys |
| GitHub (CI) | dépôt à créer (`git remote` absent au 04/09/2026) | Mehdi | — |

Règles : jamais de `NEXT_PUBLIC_*` pour un secret ; `.env*` jamais commité (`.gitignore`) ; fichier append-only si plusieurs mains.
