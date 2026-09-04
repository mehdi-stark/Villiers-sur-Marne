# OUTILS — le référentiel (utiliser en entier ou en partie, selon le besoin)

> Benchmark **daté 2026-08-30** : usage réel sur DelivUp et l'usine ecom +
> connaissance à date. Les prix, quotas et « meilleur outil » périment :
> **re-vérifier par recherche web avant tout engagement** (phase 1bis). Un
> outil entre ici avec son *pourquoi*, son *repli* et ses *pièges payés*.

| Besoin | Outil par défaut | Repli / alternative | Pièges payés · quand |
|---|---|---|---|
| Front + back web | **Next.js** (App Router, TS) — front ET back, pas d'API séparée | Remix | Server Actions : jamais d'attente > 10 s, pas de waitUntil qui retient la réponse |
| Hébergement web | **Vercel** | VPS (Docker + reverse proxy), Cloudflare Pages pour du statique | Plan hobby : **300 s/fonction**, 100 déploiements/jour, 4 h CPU/mois — jobs longs INTERDITS ici ; vérifier l'état READY après chaque push |
| Serveur sans plafond | **VPS** (Hetzner/OVH ~10 €/mois, pm2 + Docker) | Railway, Fly.io, Coolify | Ports fermés par défaut (ufw vs bridges Docker) ; c'est l'exécuteur des jobs longs et le secours de l'hébergeur |
| Base de données | **Supabase** (Postgres + Storage + Auth) | **Neon** (Postgres serverless) si Supabase indisponible ; Postgres sur le VPS | Pooler saturé = pages qui « chargent à l'infini » → une transaction par page ; pause des projets gratuits inactifs → keep-alive |
| ORM / migrations | **Drizzle** — migrations GÉNÉRÉES | Prisma | Jamais de SQL de migration à la main ; `numeric` arrive en string ; ne jamais `JSON.stringify` vers un jsonb (double-encodage) |
| Orchestration / crons | **n8n** self-host (VPS) | **QStash** (Upstash) pour cron/queues HTTP sans serveur ; Trigger.dev / Inngest pour des workflows codés | Import n8n = upsert par id + redémarrage ; état en base + webhook, jamais d'appel direct app → n8n ; heartbeat + alerte sur silence |
| Jobs longs / files | **file en base** + exécuteur VPS (pattern `recettes/`) | QStash (délai/queue), Inngest | Un bouton met en file, il n'exécute pas ; clôture des runs fantômes par un tiers fréquent |
| Erreurs | **Sentry** | Better Stack, Highlight | DSN en prod sur TOUTES les apps ; hub d'erreurs qui notifie un humain |
| Uptime | Better Stack / UptimeRobot | page /statut publique maison | Un moniteur externe par app ET pour l'orchestrateur |
| E-mails | **Resend** (transactionnel + inbound) | Postmark, Brevo | Domaine vérifié (SPF/DKIM/DMARC) ; tout échec d'envoi = alerte, jamais un catch silencieux |
| Analytics produit | **PostHog** (events, funnels, session replay) | Umami/Plausible (simple, RGPD), GA4 | Pas de PII dans les events ; brancher avant le premier trafic |
| IA — texte | **DeepSeek** (v4 pro/flash) + **Gemini** (flash/flash-lite) | OpenAI, Anthropic (Claude) selon budget/qualité | Replis CROISÉS ; timeout ≥ 180 s pour les tâches longues ; Gemini refuse certaines géolocalisations de serveur → sonder chaque environnement ; confidentiel = fournisseur UE-compatible seulement |
| IA — vision / images | Gemini (vision) ; génération : Recraft / Ideogram / Flux | — | Photos réelles avant génération ; jamais de faux signal social |
| Agents / orchestration IA | **Hermes AI** (à préciser : cadre d'agents retenu par l'opérateur — documenter l'usage réel au premier projet) | LangGraph, Mastra, Vercel AI SDK | L'IA argumente, le code décide ; contrats JSON ; QA par code |
| Scraping / données | Apify (acteurs), APIs officielles d'abord | Playwright maison | API officielle > scraper fragile (leçon delivup) |
| Captures / audit visuel | **Playwright** (script de capture maison) | — | La capture prouve ; détection de débordement ; viewport mobile |
| Paiement | Stripe (SaaS) · Shopify Payments / 2Checkout (ecommerce via entité) | Paddle, Lemon Squeezy (MoR) | Webhooks signés, idempotents ; produits recréés en Live ; l'argent a un gate |
| Social | Postiz (self-host) | Buffer | Contenu réel amplifié, jamais inventé |
| Push / PWA | Web Push (VAPID auto-généré, clés en base) | OneSignal | Service worker push-only, ZÉRO cache sur un cockpit |
| Suivi colis | 17TRACK API (gratuit 100/mois) | AfterShip | Statut « livrée » auto → e-mails J+15 factuels |
| Secrets / config | `.env` par environnement, jamais dans le repo ni le navigateur | Doppler, 1Password CLI | Audit de l'historique git avant le premier live |
| Voix IA (appels sortants) | **Retell** (agents voix, schémas de nœuds) | Vapi | Schémas JSON exacts et variables dynamiques à respecter ; registre culturel (voicemail FR/EU = trop forcé) (CartCall) |
| Visio | Daily.co | Whereby, Jitsi | Sessions planifiées côté serveur (Une Chance) |
| Base légère pour cockpits | **Neon** (Postgres serverless) | Supabase | Un projet Neon par cockpit d'usine ; ne jamais réutiliser la base d'un autre projet (usine mobile) |
| Migrations distantes | Supabase **Management API** (HTTPS) | connexion Postgres directe | Quand la connexion directe échoue (placeholder/IPv6) : SQL par l'API, token dans l'env de l'admin (Tarlim) |
| Mobile — build/release | Expo EAS (build, submit, OTA) | Fastlane | Deux verrous humains : comptes développeur et review ; compte ORGANISATION Play (D-U-N-S) sinon 12 testeurs/14 j |
| Mobile — abonnements | RevenueCat | StoreKit/Play Billing direct | Sans objet sur le web (Stripe suffit, aucun store ne taxe) (Une Chance) |
| Watchdog sans VPS | **GitHub Actions** (cron → sonde /api/watchdog) | n8n dès qu'un VPS existe | Jamais sur l'instance n8n d'un associé/autre projet (CartCall) |
| Docs & pilotage | Notion (hub technique, kanban) — synchro par l'agent, validation admin avant écriture | Linear, GitHub Projects | WAF Notion : pages une par une ; l'app ne pousse jamais seule (DelivUp) |
| Présentations | Gamma (deck = bundle dynamique servi inline) | Slides | Ne jamais dépaqueter/injecter ; optimiser les PNG (DelivUp) |
| Réseaux sociaux — API | LinkedIn / Meta / TikTok : demandes d'accès API DOCUMENTÉES (`docs/api-access/`) | Postiz self-host | Les accès se demandent tôt : délais de plusieurs semaines (DelivUp) |
| Notation / avis | Judge.me (Shopify) · avis stores | — | Zéro faux signal social ; un avis réel vaut un moat (P-06b) |
| Icônes & logos | **simple-icons** (logos officiels SVG des marques, npm/CDN) + **lucide** (icônes UI) | Heroicons, Phosphor | Un logo PayPal/Stripe en texte ou emoji est une faute de design ; respecter les guidelines de marque (couleur, espace) |
| CI | GitHub Actions : typecheck, build, tests, schéma ↔ migrations en phase | — | La CI échoue si le schéma diverge des migrations |

## Comment choisir (phase 1bis)
1. Lister les BESOINS du projet (colonne 1), pas les outils.
2. Prendre le défaut sauf raison écrite ; noter le repli dès le jour 1.
3. Écrire les QUOTAS de chaque outil retenu et vérifier que l'usage prévu
   tient avec marge ×3 (checklist pré-live).
4. Dater le choix. Re-benchmarker avant toute montée en charge.

## Améliorer ce référentiel
Un outil s'ajoute avec : besoin, pourquoi lui, repli, quotas, piège(s) payé(s),
date. Un outil se retire quand un incident ou un benchmark daté le justifie.
`./publier.sh "outillage : …"`.
