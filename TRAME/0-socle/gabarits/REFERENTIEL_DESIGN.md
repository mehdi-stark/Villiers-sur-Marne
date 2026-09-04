# Référentiel design — <projet>

## Deux registres (leçon CartCall / Une Chance)
- **Produit client** (marketing-facing) : stylé ET fluide — composants shadcn/Radix stylés charte, motion discret (transitions, compteurs), CTA.
- **Admin / cockpit** : Linear / Stripe, sobre, dense, lisible.
- Commun : tokens `:root`, next/font, jamais de `confirm()`, états vides distincts (« rien » vs « aucun résultat de filtre »), libellés humains, fuseau explicite.

## Direction artistique (recette DIRECTION_ARTISTIQUE — validée le <date> par <opérateur>)
- Références (3 par registre, patterns empruntés, ce qu'on refuse) : <…>
- Maquettes canvas validées : <liens artefacts> · décisions `design:*` dans le cockpit
- Ce que l'utilisateur doit RESSENTIR en 2 s (produit client) / ce qu'il doit VOIR en 2 s (admin) : <…>

## Tokens (source unique : `packages/ui/tokens.css`)
- Rôles de couleur (accent, accent-soft, surfaces 0-3, texte 1-3, ok/warn/danger + soft), clair ET sombre
- Échelle typographique (12 · 13 · 14 · 16 · 18 · 22 · 28 · 36) et graisses ; display + body via next/font
- Espacement 4 pt (4 · 8 · 12 · 16 · 24 · 32 · 48), rayons (8 · 12 · 16 · 24 · pill), élévations (0-3), durées (120 · 200 · 300 ms)

## Primitives (`packages/ui`) : Bouton (primaire/secondaire/discret/danger, sm/md/lg), Carte, Badge, TuileChiffre, ÉtatVide illustré, BarreOnglets (mobile), BarreLaterale (admin), Feuille, Champ, Rangée dense
## Navigation par registre : onglets bas + en-tête qui salue (client) · barre latérale + rangées denses + raccourcis (admin)
## Mouvement : spring au tap, cascade des listes, compteurs — 150-300 ms, `prefers-reduced-motion` respecté
## Rubrique /5 par écran (audit-app) : hiérarchie · contraste/lisibilité · densité/respiration · cohérence · identité/émotion · mouvement · états — < 4 = pas livrable
## Primitives et patterns (listes groupées, textes structurés, verdicts, bandeau travail en cours)
## Mobile (drawer, header collant, min-width:0, safe areas, inputs ≥ 16 px) — preuve : capture 390 px
## Références du marché (audit outillé des meilleurs du segment — on s'inspire, on adapte)

## Icônes et logos
- Marques/services : logos officiels SVG (`simple-icons`) — badges de paiement, intégrations, réseaux ; guidelines respectées.
- Icônes d'interface : `lucide` (traits cohérents) ; emoji seulement pour l'humeur d'un texte, jamais comme icône fonctionnelle.
