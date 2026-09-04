# Recette — direction artistique AVANT le code (payé sur `ville`, 04/09/2026 : « affreux le design »)

## Pourquoi cette recette existe
Des jetons, next/font, Radix, « niveau Linear / Stripe » et une capture 390 px sans
débordement ne FONT PAS un bon design. Sur `ville`, trois apps sont sorties propres,
responsives, prouvées — et fades : cartes grises, un accent, aucune identité, aucun
mouvement, une barre hamburger sur un produit grand public. Ce qui manquait n'était
pas la finition, c'était la DIRECTION : personne n'avait décidé à quoi ça devait
ressembler, ni mesuré l'écart avec les meilleurs du segment.

## Les six manques, et ce qu'on pose désormais
1. **Une référence visuelle réelle, par registre** — trois produits du segment que
   l'opérateur reconnaît (produit client : ex. Doctolib, Lydia, Apple Santé ;
   admin : Linear, Stripe Dashboard, Notion). On EXTRAIT leurs patterns
   (navigation, densité, hiérarchie, couleurs de rôle, mouvement, états vides) dans
   `docs/planning/REFERENTIEL_DESIGN.md` §Références — captures à l'appui quand
   l'outillage le permet, sinon liste explicite des patterns empruntés.
2. **Une maquette VALIDÉE par l'opérateur avant le code** — skill `design` (canvas
   Claude Design) : un artboard par écran clé (mobile 390 + desktop), publié, tranché
   depuis le téléphone comme une décision (`/pilotage/decisions`, sujet `design`).
   Un écran codé sans maquette validée est un brouillon, pas une livraison.
3. **Un système de design PARTAGÉ en paquet** (`packages/ui`) — jetons COMPLETS
   (rôles de couleur clair/sombre, échelle typographique 12→40, espacement 4 pt,
   rayons, élévations, durées), primitives typées avec variantes (Bouton, Carte,
   Badge, Tuile chiffre, ÉtatVide illustré, BarreOnglets, Feuille, Champ) —
   jamais une feuille CSS copiée d'une app à l'autre.
4. **Une navigation par registre** — produit client mobile : barre d'onglets en bas
   (pouce), en-tête qui salue, une action primaire par écran ; admin : barre latérale
   desktop, rangées denses, raccourcis. Le hamburger n'est pas une navigation grand
   public.
5. **Identité et mouvement** — logo/initiale travaillés, illustrations d'états vides
   (SVG inline, palette de la charte), micro-interactions `motion` (spring au tap,
   apparition en cascade des listes, compteurs) — 150-300 ms, jamais spectaculaires.
6. **Une rubrique d'audit CHIFFRÉE à la livraison** (skill `audit-app`) : chaque
   écran est noté /5 sur hiérarchie, contraste et lisibilité, densité et respiration,
   cohérence avec le système, identité et émotion, mouvement, états (vide, chargement,
   erreur, disabled). Moins de 4 sur un axe = pas livrable. La note s'écrit à côté de
   la capture, avec ce qui la fait monter.

## Où ça s'insère dans le déroulé
- Étape 0 (cockpit squelette) : `packages/ui` naît ici, avec les jetons complets.
- **Étape 4bis — direction artistique** (nouvelle) : références, maquettes canvas,
  validation opérateur, REFERENTIEL_DESIGN rempli. Aucun écran produit avant.
- Étape 5-6 : chaque écran = primitives du paquet + rubrique /5 sur capture.

## Preuves attendues
Maquettes publiées et tranchées ; `packages/ui` importé par toutes les apps (grep :
aucune `globals.css` qui redéfinit des jetons) ; captures notées /5 par axe ; au moins
une illustration d'état vide et une micro-interaction visibles en capture/vidéo.
