# Recette — responsive PARTOUT, PWA pour toute application à compte (règle Mehdi 30/08, challengée)

## Quand
| Type | Responsive | PWA | Pourquoi |
|---|---|---|---|
| Cockpit / back-office / outil interne | ✅ toujours | ✅ **systématique** | l'opérateur pilote au téléphone : icône, plein écran, push, badge |
| Application web / SaaS / portail client | ✅ toujours | ✅ **systématique** | usage répété, notifications, session qui tient |
| App mobile (stores) | ✅ | ✅ **d'abord** (avant les stores) si le store n'est pas indispensable | teste le marché sans revue Apple/Google (4.3 durcie juin 2026) ; la native vient quand la traction le justifie — **et une version web reste par défaut** : les gens sont aussi sur ordinateur (à challenger projet par projet, jamais supprimée sans raison écrite) |
| Site vitrine / landing | ✅ toujours | ⬜ non | pas d'usage répété ; performance et SEO priment |
| Storefront Shopify (thème) | ✅ (thème responsive) | ⬜ non | le thème n'est pas à nous ; Shopify gère |

## Ce qu'on pose (code de référence : usine ecom, `apps/admin`)
1. `app/manifest.ts` : name, short_name, `display: "standalone"`, couleurs charte, icônes
   192/512 + maskable **générées par code** (même identité que le favicon).
2. `layout.tsx` : `manifest`, `appleWebApp` (capable, title, statusBarStyle), `icons.apple`,
   `viewport` (themeColor clair/sombre, `viewportFit: "cover"`).
3. **Middleware** : manifest, icônes, `sw.js` PUBLICS — un 401 rend l'app non installable
   (piège payé).
4. `public/sw.js` : **push uniquement, ZÉRO cache** (jamais un chiffre périmé) ; actions
   dans la notification via jeton signé (décisions non-argent).
5. Web Push : VAPID auto-généré en base, subscriptions par appareil, purge 410/404 ;
   push sur décisions ET pannes critiques ; badge d'icône = éléments en attente.
6. Mobile : drawer + header collant, safe areas, inputs ≥ 16 px, `min-width: 0`,
   tables qui défilent, bandeau « travail en cours » + auto-refresh.

## Le bandeau « Installe l'app » (composant de référence : usine ecom `apps/admin/app/installer-pwa.tsx`)
Détecte navigateur mobile hors mode installé → un bandeau discret, refermable (mémorisé),
qui explique le geste (iOS : Partager → Sur l'écran d'accueil ; Android : menu → Installer)
— c'est en mode installé que push et badge existent.

## Limites iOS à connaître (pas des surprises)
- Push et badge seulement si l'app est **installée** sur l'écran d'accueil (iOS ≥ 16.4).
- Un lien externe (magic link) s'ouvre dans **Safari, hors de la PWA** → session au
  mauvais endroit : d'où l'OTP obligatoire (`AUTH_OTP_MAGIC_LINK.md`).
- Le stockage local peut être purgé après inactivité : jamais d'état critique côté client.
- Pas de « Ajouter à l'écran d'accueil » automatique : un bandeau discret explique le geste.

## Preuves attendues (audit)
`manifest.webmanifest` et `sw.js` en 200 hors session ; capture 390 px en mode installé
sans débordement ; une notification push reçue en réel ; connexion par OTP réussie
depuis la PWA installée.
