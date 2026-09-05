# Recette — la coquille d'une application (standard, payé sur `ville` le 04-05/09/2026)

## Le défaut qu'elle corrige
« Les menus s'empilent et on ne sait pas quoi fait quoi » (Mehdi). Une barre latérale qui
grandit sans sections devient une liste plate où l'on navigue à tâtons ; et le compte, le
thème et la sortie finissent éparpillés (un bouton « Quitter » dans l'en-tête, un lien
« Appareils » dans un tiroir, aucun réglage d'apparence).

## Ce que toute application à compte embarque, dès le maillon 0
1. **Navigation PAR SECTIONS** — jamais une liste plate au-delà de 4 entrées. Chaque section
   porte un titre court qui dit le RÔLE, pas le contenu : « Aujourd'hui » / « Dossiers » /
   « Référentiel » (métier), « Pilotage » / « Le projet » / « Le produit » (cockpit).
   Chaque entrée peut porter un **compteur** (ce qui attend), tonalité `warn` si ça bloque.
2. **Menu profil, au même endroit, toujours** : en bas de la barre latérale (admin), dans
   l'en-tête à droite (produit client). Il contient, dans cet ordre : l'identité (avatar,
   nom, rôle ou e-mail), l'état utile du compte, **l'apparence (clair / sombre / système)**,
   les réglages et la sécurité (appareils, notifications), puis **Se déconnecter** en dernier
   et en rouge. Rien de tout cela ne vit ailleurs.
3. **Thème choisissable ET persistant** : jetons sous `[data-theme="dark"]`, `[data-theme="light"]`
   ET `prefers-color-scheme` pour le mode système ; un **script inline dans `<head>`** applique
   le choix AVANT le premier rendu (sans lui, flash blanc à chaque chargement).
4. **Une page `/reglages`** qui reprend apparence + notifications + dossier : le menu est un
   raccourci, pas le seul chemin.
5. **Produit client** : onglets en bas (pouce), pastille de compteur sur l'onglet concerné,
   l'avatar en haut à droite ouvre le même menu profil.

## Une démo POURRIT si on la cloue dans le temps (payé le 05/09/2026)
Le jeu de démonstration était figé sur un mois : deux semaines plus tard, l'écran principal
serait vide en plein rendez-vous. **Toute donnée de démonstration se génère RELATIVEMENT à la
date du jour** (fenêtre glissante : quelques semaines en arrière avec des états consommés,
quelques semaines en avant avec des états à venir ; période facturée = mois écoulé). Un test
doit échouer si on re-cloue les données à une date fixe.

## Le mode PRÉSENTATION (montrer sans donner de code) se BORNE
Un lien qui ouvre l'app « déjà connectée » contourne l'authentification. Il n'est acceptable
qu'avec les cinq garde-fous, tous codés : (1) refusé si la source n'est pas fictive — jamais
sur des données réelles ; (2) refusé sans secret dédié (`DEMO_SECRET`) ; (3) jeton SIGNÉ à
durée courte (2 h) ; (4) chaque ouverture journalisée ; (5) bandeau de démonstration
**non refermable** pendant la session de présentation — une capture ne doit jamais pouvoir
passer pour du réel. Et une page PUBLIQUE n'affiche ni la navigation privée ni le menu profil.

## Ce qu'un écran vide n'apprend à personne
Une démo se juge PEUPLÉE : prévoir un **jeu de démonstration réaliste** (plusieurs dossiers,
des états variés — en cours, en retard, refusé) et un script `seed-demo.mjs` idempotent et
purgeable. Un écran vide se juge seulement sur son **état vide illustré et expliqué**.

## Preuves attendues
Capture du menu profil ouvert ; capture en thème sombre CHOISI (pas hérité) qui survit à un
rechargement ; capture de chaque écran avec des données ; sections visibles dans la barre.
Code de référence : `packages/ui` de `ville` (`CoquilleAdmin` à sections, `MenuProfil`,
`BasculeTheme` + `scriptTheme`).
