# Backlog — ville (priorisé par ce que chaque item DÉBLOQUE, jamais par facilité)

| Item | Débloque | Taille | Décision (go / plus tard avec condition / non) |
|---|---|---|---|
| Simulateur de tarif QF public dans la démo (proposé 04/09/2026, Feature) | Un argument chiffré pour l'élu ; réutilise la grille QF codée | ~½ j | En attente — recommandé au maillon 2, après le verdict marché |
| Thème par commune en tokens (couleurs, logo, nom) dès le squelette (proposé 04/09/2026, Design) | Le pitch « 13 communes Infocom'94 » sans refonte | ~2 h | En attente — recommandé à l'étape 5 |
| Verdict de délai codé sur chaque créneau (« modifiable jusqu'à mardi 12 h ») (proposé 04/09/2026, UX) | La promesse n° 1 vs « contactez les services » du portail actuel | ~1 j | En attente — recommandé au maillon 1 |
| Retrouver la date de fin du marché Infocom'94 M2015/02-Enf (BOAMP / délibérations du syndicat) | La fenêtre de remplacement réelle ; le calendrier du pitch | ~1 h de recherche | Go à l'étape 2 (analyse de marché) |
| Retirer la protection SSO Vercel sur le projet ville (Deployment Protection) | L'accès au cockpit depuis le téléphone | 1 clic opérateur | Go — opérateur |
| Poser RESEND_API_KEY (+ EMAIL_FROM sur domaine vérifié) en production | Les codes OTP partent réellement ; l'alerte « clé absente » se ferme seule | 5 min opérateur | Go — opérateur |
| Créer le dépôt GitHub distant et pousser (CI active) | La CI tourne réellement ; le repo n'est plus seulement sur le Mac | 5 min | Go — auteur git à confirmer (cartcallai-lab) |
| Page « Analyse de marché » dans le cockpit (proposé 04/09/2026, Feature) | Le verdict marché se lit et se tranche depuis le téléphone | ~2 h | **Fait le 04/09/2026** (`/pilotage/marche`, verdict par code) |
| Cockpit en PWA installable (proposé 04/09/2026, Design) | Icône sur l'écran d'accueil, push | ~1 h | **Fait le 04/09/2026** (manifest, icônes par code, SW push-only, bandeau) |
| Boucle de notification agent → opérateur (proposé 04/09/2026, UX) | L'opérateur est prévenu quand une décision l'attend | ~2 h | **Fait le 04/09/2026** (`pnpm notifier`, /api/agent, abonnements push) ; sens opérateur → agent = `pnpm decisions` en début de session |
| Dépôt GitHub + projet Vercel sur le compte mehdi-stark (demande Mehdi 04/09/2026) | CI réelle ; déploiement sur le bon compte | `vercel login` | **GitHub fait** (`mehdi-stark/Villiers-sur-Marne`, main poussée) ; **Vercel : opérateur** — importer le dépôt depuis le dashboard mehdi-stark (chaque push déploie) + poser les variables d'`ENV.md` |
| Mesurer les parts de marché (HHI) sur les DECP — titulaires par SIRET (proposé 04/09/2026, Feature) | Déplafonne « compétition » (3 → 6) ; forme du moat | ~2 h | **Fait le 04/09/2026** (`pnpm dlx`-free : `node scripts/mesurer-hhi.mjs`, HHI 1 228, score 65 → 68) |
| Écran « Décisions » unique + badge d'icône PWA (proposé 04/09/2026, Design) | Tout ce qui attend l'opérateur au même endroit, compteur sur l'icône | ~2 h | **Fait le 04/09/2026** (`/pilotage/decisions`, `/api/decisions`, `setAppBadge`) |
| « Prévenir l'agent maintenant » → consigne au Lanceur (proposé 04/09/2026, UX) | L'agent relit sans attendre la session suivante | ~1 h | **Fait le 04/09/2026** (Lanceur `action=consigne`, `lib/lanceur.ts`, bouton sous chaque décision prise) |
