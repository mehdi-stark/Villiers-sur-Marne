# Direction artistique — ville (skill `directeur-artistique`, 04/09/2026) — À VALIDER par Mehdi

## 1 · Registre et promesse
- **Portail famille** (produit client) : en 2 secondes, un parent doit ressentir « c'est ma ville, c'est simple, je sais quoi faire » — la couleur de Villiers, son prénom de famille, sa semaine sous les yeux, un tap = un état qui change.
- **Back-office agents** (admin) : en 2 secondes, l'agent doit voir « ce qu'il reste à pointer et où ».
- **Cockpit** (admin) : en 2 secondes, Mehdi doit voir « ce qui l'attend et ce que ça bloque ».

## 2 · Références réelles
| Référence | Patterns empruntés | Refus |
|---|---|---|
| Doctolib (app) | créneaux = pastilles tapables, une action par écran, confirmation en place, en-tête qui salue | densité d'annuaire |
| Lydia / Qonto | carte « montant » lisible en 2 s, chiffres tabulaires, badges d'état par rôle | gamification |
| Apple Santé / Calendrier iOS | onglets en bas (pouce), rayons 16-24, couleurs de rôle par activité, blancs généreux | skeuomorphisme |
| Linear | barre latérale, rangées denses, raccourcis, mouvement 150 ms | modales lourdes |
| Stripe Dashboard | tuiles chiffres avec seuils, tables qui respirent, états vides expliqués | graphiques décoratifs |
| Notion | hiérarchie par la typographie, pas par les cadres | icônes emoji |

## 3 · Identité — extraite du site officiel (villiers94.fr, 04/09/2026), à confirmer par la charte
- **Bleu Villiers `#015f89`** (38 occurrences dans les styles du site) = accent ; **vert `#71b21a`** = secondaire ; **orange `#ff6600`** = appel, avec parcimonie.
- **Police de titre « Exo »** (Google Fonts, celle du site) sur Inter pour le corps.
- **Emblème** : feuilles de vigne blanches sur disque bleu (favicon) ; logo horizontal `villiers-header.svg`. Utilisés tels quels sur les icônes PWA dès que la ville confirme ; en attendant, l'initiale « V » sur le bleu Villiers.
- Anti-généricité : ce bleu précis, ce vert précis, cette police — pas « un bleu institutionnel ».

## 4 · Système (`packages/ui/tokens.css`)
- Typographie : Exo (titres, 600-700) + Inter (corps) ; échelle 12 · 13 · 14 · 16 · 18 · 22 · 28 · 36.
- Couleurs par rôle : accent/fort/soft (commune), secondaire (vert : présent, ok), appel (orange : un seul CTA par écran, jamais pour du texte courant), chaud (repas), loisir (ALSH), ok/warn/danger/info, surfaces 1-3, texte 1-3 — clair et sombre.
- Espacement 4 pt ; rayons 8/12/16/24/pill (client 16-24, admin 8-12) ; élévations 1-3 ; durées 120/200/320 ms, easing `cubic-bezier(.2,.8,.2,1)`.
- Mouvement : spring au tap (créneaux, CTA), cascade des listes (8 px, 40 ms), compteurs sur les chiffres ; rien ne bouge en continu ; `prefers-reduced-motion` respecté.
- Iconographie : lucide (trait 1,75) ; logos officiels SVG ; illustrations d'états vides en SVG inline aux couleurs de rôle.

## 5 · Navigation et gabarits
- Client : onglets bas (Ma semaine · Factures · Enfants · Appareils), salut + titre, carte accent de résumé, légende, listes en cascade. Gabarits : semaine, facture, dossier, vide (illustré + qui débloque), erreur (cause + geste).
- Admin : barre latérale ≥ 900 px, en-tête + tiroir en dessous ; tuiles chiffres en tête, segment de dates, rangées par état (liseré de couleur de rôle). Cockpit : décisions **une à la fois** (assistant) quand > 7 ouvertes.

## 6 · Anti-patterns (refusés)
Hamburger en produit client · gris par défaut · emoji fonctionnel · modale maison sans focus trap · cadres partout (hiérarchie par la typo) · pavé de texte · plus de 7 cartes pleines sans repli · orange d'appel sur plusieurs boutons · animation continue ou décorative · identité « générique » présentée comme définitive.

## 7 · Décisions à valider (depuis le cockpit, sujet `design`)
1. **Identité Villiers** — adopter le bleu `#015f89`, le vert, l'orange d'appel et la police Exo extraits du site officiel (à confirmer par la charte).
   Options : Oui, charte du site · Garder l'identité neutre — Recommandation : Oui, charte du site
2. **Navigation famille** — onglets en bas sur mobile (pouce), liens en haut sur desktop.
   Options : Onglets bas · Menu latéral — Recommandation : Onglets bas
3. **Densité admin** — barre latérale + rangées denses (Linear) pour agents et cockpit.
   Options : Dense (Linear) · Aéré (cartes) — Recommandation : Dense (Linear)
4. **Mouvement** — spring au tap, cascade des listes, compteurs ; rien de décoratif.
   Options : Discret (recommandé) · Aucun — Recommandation : Discret (recommandé)
5. **Maquettes** — les 3 artboards publiés (famille, agents, cockpit assistant) sont la direction à coder.
   Options : Valider · Retoucher (note) · Refaire — Recommandation : Valider
