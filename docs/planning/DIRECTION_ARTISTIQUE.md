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

## 3 · Identité — RELEVÉE dans la feuille de style du site officiel (05/09/2026)
Source : `villiers94.fr/wp-content/themes/villiers94-2023/assets/css/theme.css` (428 Ko), comptage des occurrences.

| Couleur | Occurrences | Rôle dans le site | Rôle chez nous |
|---|---|---|---|
| **Vert `#71b21a`** | 105 — la plus utilisée | couleur dominante, boutons, filets | **couleur de la commune** : aplats, badges, liserés (`--accent-vif`) |
| Vert foncé `#558614` | 18 | survols | base de la couleur d'ACTION |
| **Bleu `#015f89`** | 73 | en-têtes, blocs institutionnels | **institutionnel** : bandeaux qui parlent au nom de la ville, registre admin |
| **Crème `#f4f0eb`** | 43 | fond des sections | **fond de l'app en clair** — c'est ce qui donne la chaleur du site |
| Orange `#ef984b` | 24 | mises en avant | **appel** : restauration, un CTA à la fois |
| Gris `#333333` | 37 | texte courant | texte |
| Police **Exo** | 15 déclarations | tous les titres | titres (Google Fonts), Inter pour le corps |
| Rayons | 0 majoritaire, 3/4/6 px, 15 px (pilules) | site très carré | app : rayons modernes, pilules alignées sur 15 px |

**Correctif de contraste (mesuré, testé) :** le vert brut ne fait que **2,6:1** sur blanc — illisible en texte. La couleur d'ACTION est son cran foncé **`#4a7411` (5,5:1)** ; le vert vif reste aux aplats. En sombre, `#8fd43a` (10,5:1). Test : `packages/core/tests/communes.test.ts` échoue si une commune passe sous 4,5.

**Logo** : le logo horizontal officiel (`villiers-header.svg`) est affiché dans l'en-tête des trois apps et sur la vitrine, avec la mention « Ville de Villiers-sur-Marne — maquette de proposition, sans lien officiel ». Les icônes PWA gardent l'emblème dessiné pour le projet tant que la ville n'a pas donné son accord.

**Ce qu'on emprunte au site, au-delà des couleurs** : le fond crème plutôt qu'un gris froid, le bloc institutionnel bleu plein pour ce qui parle au nom de la commune, et les liserés de couleur par service.

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
5. **Maquettes** — les artboards publiés (famille, agents, cockpit assistant) sont la direction à coder.
   Options : Valider · Retoucher (note) · Refaire — Recommandation : Valider
6. **Charte de la ville** — appliquer la charte relevée dans le site officiel : vert de la ville en
   couleur d'action (cran foncé pour le contraste), bleu institutionnel pour les bandeaux au nom de
   la commune, fond crème, orange pour la restauration, police Exo, logo officiel dans l'en-tête.
   Options : Charte de la ville (recommandé) · Rester sur le bleu institutionnel · Identité neutre — Recommandation : Charte de la ville (recommandé)
7. **Vitrine publique** — garder `/decouvrir` en ligne (page de démonstration avec la mention
   « proposition, sans lien officiel ») comme support de vente à envoyer à l'élu.
   Options : Oui, la garder en ligne · Non, sur demande seulement — Recommandation : Oui, la garder en ligne
