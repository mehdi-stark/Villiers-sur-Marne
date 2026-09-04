# Référentiel design — <projet>

## Deux registres (leçon CartCall / Une Chance)
- **Produit client** (marketing-facing) : stylé ET fluide — composants shadcn/Radix stylés charte, motion discret (transitions, compteurs), CTA.
- **Admin / cockpit** : Linear / Stripe, sobre, dense, lisible.
- Commun : tokens `:root`, next/font, jamais de `confirm()`, états vides distincts (« rien » vs « aucun résultat de filtre »), libellés humains, fuseau explicite.

## Tokens (source unique)
## Primitives et patterns (listes groupées, textes structurés, verdicts, bandeau travail en cours)
## Mobile (drawer, header collant, min-width:0, safe areas, inputs ≥ 16 px) — preuve : capture 390 px
## Références du marché (audit outillé des meilleurs du segment — on s'inspire, on adapte)

## Icônes et logos
- Marques/services : logos officiels SVG (`simple-icons`) — badges de paiement, intégrations, réseaux ; guidelines respectées.
- Icônes d'interface : `lucide` (traits cohérents) ; emoji seulement pour l'humeur d'un texte, jamais comme icône fonctionnelle.
