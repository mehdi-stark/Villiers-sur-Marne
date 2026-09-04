# Recette — le cockpit AVANT le cadrage (maillon 0 de tout projet — règle Mehdi 04/09/2026)

## La règle
**Le cadrage et le backlog se lisent, se tranchent et se valident DEPUIS le
back-office du projet** — jamais dans un terminal, jamais dans un fichier
markdown qu'on n'ouvre pas depuis un téléphone. Donc, même quand on n'est pas
encore sûr de faire l'application, **le maillon 0 est un squelette de cockpit**
sur lequel le cadrage commence. Le squelette est jetable ; le cadrage fait
dessus ne l'est pas.

Pourquoi (leçon payée sur `ville`, 04/09/2026) : un cadrage de 200 lignes livré
en markdown avec sept décisions « à trancher » a produit une session bloquée —
l'opérateur lit sur son téléphone, ne parcourt pas un fichier, et ne peut pas
répondre point par point. Un « ⏸ STOP : je valide » sans écran de validation
est une session qui pend (leçon 54) ; le cockpit EST cet écran.

## Ce que contient le squelette (2-3 h, pas plus — le reste vient à l'étape 5)
1. **App Next.js** (défaut `OUTILS.md`), lançable en local et déployable (Vercel),
   charte en **tokens** (`:root`, next/font, zéro couleur en dur), layout
   responsive **drawer + header collant**, safe areas — vérifié en capture 390 px.
2. **Auth minimale** : OTP e-mail sur whitelist (recette `AUTH_OTP_MAGIC_LINK`,
   partie OTP seulement ; passkeys, appareils et session glissante à l'étape 5).
   Un cockpit qui expose un cadrage sans mot de passe n'est pas déployable.
3. **Page `/pilotage/cadrage`** : rend `docs/planning/CADRAGE.md` (source de
   vérité = le fichier, édité par l'agent, lu à la construction ou au runtime)
   **et** extrait la section « Décisions à valider » en cartes : chaque décision
   porte ses options, la recommandation, et **un bouton par option** (+ note).
4. **Page `/pilotage/backlog`** : rend le tableau `BACKLOG.md` en lignes
   tranchables — go / plus tard (avec condition saisie) / non.
5. **Table `decisions`** (`sujet`, `cle`, `choix`, `note`, `acteur`, `tranche_le`)
   — chaque tap écrit une ligne ; **l'agent la relit au début de chaque session**
   (`.claude-consignes.md` ou requête directe) et reporte le choix dans le
   document canonique, avec la date. Le fichier reste la vérité relue à froid ;
   la table est le canal de décision.
6. **Script de capture** (`capturer.mjs` adapté) sur ces deux pages, desktop +
   390 px — la preuve que le cockpit est lisible AVANT d'y mettre le cadrage.

## Ce que le squelette ne contient PAS (étape 5)
CI complète, PWA/push, cron résilient, file de jobs, alertes, appareils/passkeys,
thème par client. On ne construit pas l'usine pour lire un cadrage — on construit
l'écran qui permet de le trancher.

## Ordre du jour 1, corrigé
0. Squelette cockpit (cette recette) → capture → commit.
1. Cadrage **écrit dans `docs/planning/CADRAGE.md` ET rendu dans le cockpit**,
   décisions tranchées depuis le téléphone → l'agent les reporte.
2. Analyse de marché (le verdict s'affiche dans le cockpit, avec son score).
3. Architecture/outils ; 4. CLAUDE.md + plan ; 5. squelette complété ;
6. premier maillon métier ; 7. clôture.

## Preuves attendues
Capture desktop + 390 px de `/pilotage/cadrage` avec au moins une décision
tranchée depuis l'écran ; ligne correspondante dans `decisions` ; report daté
dans `CADRAGE.md` ; `/pilotage/backlog` avec une ligne portant une décision.
