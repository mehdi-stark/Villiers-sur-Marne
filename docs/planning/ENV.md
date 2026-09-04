# Inventaire des variables d'environnement — ville (AUCUNE valeur ici)

> Monorepo (04/09/2026) : `apps/cockpit` (pilotage), `apps/famille` (portail famille, PWA), `apps/agents` (back-office agents, PWA), `packages/core` (schéma, migrations, auth par application, adaptateur de données, thème par commune). **Trois déploiements, trois domaines, trois secrets de session — jamais partagés.** Base Neon unique « ville » (une base par PROJET).

## Cockpit (`apps/cockpit`)
| Variable | Rôle | Où elle vit (hébergeur / VPS / CI) | Obligatoire |
|---|---|---|---|
| `DATABASE_URL` | Base Neon « ville » (une base PAR projet, id `crimson-band-15200530`, eu-central-1) | Vercel (prod) · `.env.local` (dev) · CI : URL factice (build seulement) | oui |
| `AUTH_SECRET` | Signature HMAC des sessions et des empreintes OTP — propre à ce projet | Vercel · `.env.local` | oui |
| `ADMIN_EMAILS` | Whitelist des e-mails autorisés à se connecter (virgules) | Vercel · `.env.local` | oui |
| `RESEND_API_KEY` | Envoi des codes OTP (Resend, seul fournisseur). Absente → alerte « email_cle_absente », aucun code ne part | Vercel | oui en prod |
| `SOURCE_DONNEES` | Source de l'adaptateur : `fictif` (défaut) · `export-agora` · `api-agora` (non branchées, elles le disent) | Vercel · `.env.local` | non |
| `VERCEL_ACCESS_TOKEN` | Jeton de déploiement du compte mehdi-stark — lu par les commandes `vercel … --token`, jamais dans le code | `.env.local` seulement | pour déployer |
| `MAQUETTES_URL` | Lien du canvas de maquettes (Claude Design) affiché dans `/pilotage/design` | Vercel · `.env.local` | non |
| `AGENT_SECRET` | Autorise `POST /api/agent` (l'agent notifie l'opérateur, `pnpm notifier`) | Vercel · `.env.local` | oui pour les notifications |
| `COCKPIT_URL` | URL du cockpit visée par `pnpm notifier` | `.env.local` (Mac) | non (défaut localhost) |
| `PUSH_CONTACT` | Contact VAPID (`mailto:`) | Vercel | non |
| `LANCEUR_URL` / `LANCEUR_SECRET` / `LANCEUR_DOSSIER` | « Prévenir l'agent maintenant » dépose une consigne au Lanceur (même secret que l'écouteur du Mac, `~/.config/trames/lanceur.env`) | Vercel · `.env.local` | non (sans elles, le bouton le dit) |
| `PASSKEY_RP_ID` | RP ID WebAuthn (défaut : hôte de la requête — `villiers-sur-marne.vercel.app`) ; à poser quand un domaine propre arrive | Vercel | non |
| `EMAIL_FROM` | Expéditeur (`Ville <…@domaine-vérifié>`) ; défaut `onboarding@resend.dev` (tests seulement) | Vercel | non |

Modèle : `.env.example`. Le test `scripts/tests/tap-decision.mjs` exige `test@ville.local` dans `ADMIN_EMAILS` du serveur visé — **dev uniquement**, jamais en prod.

## Portail famille (`apps/famille`, port 3001 en dev)
| Variable | Rôle | Où elle vit | Obligatoire |
|---|---|---|---|
| `DATABASE_URL` | même base Neon (tables `comptes_familles`, `otp_codes.app='famille'`) | Vercel · `.env.local` | oui |
| `FAMILLE_AUTH_SECRET` | secret de session PROPRE au portail | Vercel · `.env.local` | oui |
| `COMMUNE_ID` | thème et coordonnées de la commune (`packages/core/src/communes.ts`) | Vercel | non (défaut villiers-sur-marne) |
| `SOURCE_DONNEES` | `fictif` (défaut) · `export-agora` · `api-agora` | Vercel | non |
| `RESEND_API_KEY` / `EMAIL_FROM` | codes OTP des familles, e-mail « nouvel appareil » | Vercel | oui en prod |
| `FAMILLE_URL` | URL publique du portail (retour PayFIP) | Vercel | avec PayFIP |
| `PAYFIP_NUMCLI` / `PAYFIP_MODE` | numéro client de la régie (DGFiP) ; `T` test (défaut) ou `M` | Vercel | pour payer |
Comptes : table `comptes_familles` (e-mail → famille de la source) — seed de démo `apps/famille/scripts/seed-familles.mjs email=familleId`.

## Back-office agents (`apps/agents`, port 3002 en dev)
| Variable | Rôle | Où elle vit | Obligatoire |
|---|---|---|---|
| `DATABASE_URL` | même base Neon | Vercel · `.env.local` | oui |
| `AGENTS_AUTH_SECRET` | secret de session PROPRE au back-office | Vercel · `.env.local` | oui |
| `AGENT_EMAILS` | liste blanche des agents (virgules) | Vercel · `.env.local` | oui |
| `COMMUNE_ID`, `SOURCE_DONNEES`, `RESEND_API_KEY` | comme ci-dessus | Vercel | — |

## Accès & comptes — qui possède quoi
| Service | Compte | Propriétaire | Récupération |
|---|---|---|---|
| Neon (base) | organisation `org-square-star-05491818`, projet `ville` | Mehdi | clé API `~/.config/trames/neon.env` ; URI via `creer-base-neon.sh ville` (idempotent) |
| Vercel (hébergement) | compte `contact-6950` (CLI connectée sur le Mac) | Mehdi | `vercel whoami` |
| Resend (e-mail) | compte Resend de Mehdi (domaine vérifié `croscel.com`) — **clé dédiée `ville-…` créée par API le 04/09/2026** (permission envoi), posée sur les 3 projets ; expéditeur provisoire `Ville <contact@croscel.com>` jusqu'à un domaine du projet | Mehdi | dashboard Resend → API Keys |
| GitHub (CI) | `mehdi-stark/Villiers-sur-Marne` — créé par Mehdi le 04/09/2026, `main` poussée | Mehdi (mehdi-stark) | SSH du Mac authentifié comme mehdi-stark |
| Vercel (hébergement) | **`mehdi-starks-projects/villiers-sur-marne`** (id `prj_YuePUUnNhWN7aGyr6mfmLHsTNFfY`), prod `https://villiers-sur-marne.vercel.app`, déployé par jeton `VERCEL_ACCESS_TOKEN` (`.env.local`, jamais commité). **Ce jeton a été affiché par la CLI dans une erreur le 04/09/2026 → à révoquer et régénérer.** L'ancien projet `yuqots-projects/ville` reste en place (à supprimer par Mehdi). | Mehdi (mehdi-stark) | dashboard Vercel |

Règles : jamais de `NEXT_PUBLIC_*` pour un secret ; `.env*` jamais commité (`.gitignore`) ; fichier append-only si plusieurs mains.
