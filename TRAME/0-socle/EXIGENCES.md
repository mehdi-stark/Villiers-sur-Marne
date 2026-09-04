# EXIGENCES — le niveau attendu de TOUT projet (non négociable)

> Ce document est la raison d'être de la trame : qu'un projet parte, dès le
> jour 1, avec le niveau de qualité et d'expertise atteint sur les précédents —
> sans le réexpliquer en dix prompts. Chaque exigence est vérifiable, et
> chacune a été payée quelque part (voir `lecons/`).

## 1. Expertise — l'agent est l'expert, pas l'opérateur
- L'opérateur donne l'intention ; l'agent produit le **niveau expert** du
  domaine (marché, produit, technique, conformité) et **dit si une décision
  est bonne ou mauvaise** avec ses raisons et ses chiffres vs seuils.
- Un chiffre sans seuil n'est pas une information ; une décision sans avis
  n'est pas une aide. Les décisions manuelles sont rares ; ce que la machine
  sait trancher (verdict net, non-argent) se tranche seul, tracé.
- Toute expertise s'écrit dans un **socle injecté aux agents runtime** (règles
  nées d'incidents datés) : le projet suivant part équipé.

**Preuves attendues** : capture d'une décision avec avis, raisons et chiffres vs seuils ; le socle injecté (fichier + test que le prompt le contient) ; une auto-décision tracée (acteur machine, motif).

## 2. Business — on ne construit rien sans marché prouvé (`regles/DOCTRINE_MARCHE.md`)
- **Marché prouvé + amélioration réelle + tête de pont** — jamais un clone moins
  cher ; forme du moat mesurée (HHI) ; wedge miné dans les plaintes réelles.
- **Analyse de marché poussée AVANT tout code** : grille pondérée avec preuve
  par note (plafond sans preuve), demande MESURÉE (pas jugée), fiscalité de
  transaction modélisée (TVA/taxes dans la marge), coût d'entrée à côté de la
  marge (langue, autorité, CPC), contre-analyse adversariale, sources datées.
- **Doctrine commerce dans l'absolu** : ne jamais refuser un profit, ne jamais
  retarder une vente, ne pas vendre à crédit (cashflow direct).
- L'argent a TOUJOURS un gate humain (validable en un tap, jamais automatique) ;
  plafonds revalidés en base ; pub autofinancée.

**Preuves attendues** : un dossier de marché daté avec chiffres mesurés (sortie de `mesurer-demande.mjs`, grille remplie, sources) ; un P&L calculé par une fonction de code avec ses tests ; un gate d'argent visible dans le back-office avec son plafond en base.

## 3. Produit — back-office / cockpit au niveau Linear / Stripe
- Charte en **tokens CSS**, zéro couleur en dur ; typographie soignée ;
  micro-interactions discrètes ; primitives accessibles (jamais de confirm()).
- **Responsive et mobile réels** : drawer, header collant, `min-width: 0` sur
  les items de grille, tables qui défilent dans leur conteneur, safe areas.
- **Responsive PARTOUT, sans exception.** **PWA pour toute application à compte**
  (cockpit, SaaS, portail — et l'app mobile D'ABORD, avant les stores) ; seules
  exceptions : site vitrine et storefront Shopify — recette
  `3-outillage/recettes/PWA_APPLICATION.md`.
- **Connexion : OTP obligatoire, magic link optionnel** (un lien sort de la PWA
  installée), code en premier en mode installé, hash en base, essais limités,
  alerte sur échec d'envoi ; passkeys en V2 — recette
  `3-outillage/recettes/AUTH_OTP_MAGIC_LINK.md`.
- **Icônes et logos** : les marques et services (PayPal, Stripe, Shopify, Google…)
  s'affichent avec leur **logo officiel en SVG** (simple-icons), jamais en texte
  ni en emoji ; icônes d'interface vectorielles cohérentes (lucide) ; guidelines de
  marque respectées (couleur, espace, pas de déformation).
- **Lisibilité** : textes générés structurés (jamais de pavé), listes groupées
  par étape (l'action d'abord, l'historique replié), badges porteurs de sens,
  vides EXPLIQUÉS (pourquoi vide, qui débloque).
- **Toute action > 10 s = arrière-plan + état visible** (en cours / erreur /
  terminé) ; un bouton muet est un bouton cassé.
- **La capture prouve, l'intuition ment** : audit visuel outillé (script de
  capture multi-écrans, desktop + mobile, détection de débordement),
  bissection mesurée, re-capture après correction.

**Preuves attendues** : capture desktop ET 390 px de chaque écran principal, sans débordement signalé par `capturer.mjs` ; zéro `#hex` hors tokens (grep) ; un run > 10 s visible en « en cours » sur capture ; état vide capturé avec son explication.

## 4. Automatisation & IA — la machine assemble, elle n'invente jamais
- Tout ce qui se répète devient code + tâche planifiée ; « à faire à la main »
  seulement après avoir TENTÉ l'API/CLI.
- L'IA argumente et rédige ; les chiffres et décisions viennent du code ;
  contrats de sortie JSON ; **QA systématique** (verdict calculé par code) ;
  repli déterministe pour tout ce qui part à un client.
- Replis IA **croisés** entre fournisseurs, timeouts calibrés sur la tâche la
  plus longue, chaque environnement sondé pour chaque fournisseur.
- Jobs longs HORS serverless (file en base + exécuteur sans plafond) ; clôture
  garantie des runs par un tiers fréquent ; état visible.

**Preuves attendues** : journal des runs (heartbeat, verrou) consultable ; un appel IA avec repli exercé en réel (log de repli) ; une sortie IA refusée par le QA et remplacée par le repli (trace) ; un job long lancé depuis un bouton et exécuté hors serverless (run + résultat).

## 5. Qualité, sécurité, robustesse
- Aucun secret côté navigateur ; webhooks signés et idempotents ; écritures
  sensibles auditées ; RLS/policies par script rejoué ; rôle vérifié, pas
  seulement la session.
- Migrations GÉNÉRÉES, jamais écrites à la main ; schéma = source de vérité.
- Tout échec d'envoi sortant pose une alerte (le silence est un mensonge
  d'état) ; auto-vérification déclaré ↔ réel quotidienne, alertes dédupliquées,
  push sur critique.
- Checklist pré-live intégrale avant le premier vrai utilisateur.

**Preuves attendues** : script de sécurité base rejoué (sortie) ; grep « secret/API_KEY » côté client vide ; test d'idempotence de webhook (rejouer = pas de doublon) ; alerte posée sur un envoi en échec (ligne en base) ; checklist pré-live cochée avec preuve par ligne.

## 6. Méthode de travail — amélioration continue (skill `amelioration-continue`)
- **On apprend de chaque expérience et de chaque erreur pour ne plus la refaire** ;
  on améliore à chaque itération le marché, la rentabilité, la qualité et la
  méthode — mesurés, jamais supposés. Une leçon repayée est un incident.
- **Le cadrage et le backlog se font DEPUIS le back-office** : le maillon 0 de
  tout projet est un squelette de cockpit (`recettes/COCKPIT_SQUELETTE.md`) —
  même si l'app n'est pas encore certaine — sur lequel les documents se lisent
  et les décisions se tranchent en un tap (table `decisions`, relue par l'agent).
- Documents avant le code ; un maillon à la fois, testé EN RÉEL, commité,
  documenté pour reprise à froid.
- Chaque réponse — et chaque session, cadrage et reprise compris — se termine par
  3 propositions (Feature / Design / UX) numérotées, avec ce qu'elles débloquent,
  leur coût et une recommandation ; « ajoute les propositions » = les appliquer.
  Elles remontent dans le résumé de fin de session (donc jusqu'au téléphone) et
  celles qui ne sont pas prises descendent dans le backlog avec leur décision :
  une proposition qui n'arrive pas, ou qui se reperd, n'a pas été faite.
- Chaque erreur corrigée = une leçon gravée dans le bon réceptacle, la même
  session (skill `graver-lecon`) ; les leçons de méthode remontent dans CE repo.
- Une revue de pilotage sur chiffres collectés (skill `revue-hebdo`), que la
  machine finit par s'envoyer elle-même.

**Preuves attendues** : CLAUDE.md daté de la session ; registre des leçons avec la dernière erreur corrigée ; dernière revue sur chiffres archivée ; les 3 propositions en fin de chaque réponse ET dans le dernier résumé de session remonté ; une ligne de backlog portant une proposition non retenue avec sa décision.

## Authentification des cockpits/PWA — STANDARD (31/08/2026, validé Mehdi)

Toute application avec login (cockpit, back-office, PWA) embarque D'OFFICE :
1. **OTP e-mail 6 chiffres** sur whitelist stricte (hash stocké, 5 essais,
   10 min, pas d'oracle d'énumération) + magic-link en second.
2. **Passkey (Face ID / Touch ID)** proposée juste APRÈS le premier code réussi
   — jamais à la place du code : le code reste le repli universel.
3. **Session glissante** (réémise sous 7 j de l'expiration) + **verrou
   biométrique au retour** (> 1 h) sur les appareils à passkey.
4. Page **Appareils** : liste, dernier usage, révocation tracée, journal des
   connexions ; alerte (e-mail/push) à chaque nouvel appareil.

Recette complète : `3-outillage/recettes/AUTH_OTP_MAGIC_LINK.md`. Limite
assumée : les passkeys sont par domaine — un projet = son entrée propre.

## Une base de données PAR projet (01/09/2026, incident évité)

Deux projets ne partagent jamais une base, même « en attendant » : une migration,
une purge ou une mise en pause chez l'un arrête l'autre, et un secret qui fuit
ouvre les deux. Coût réel : zéro (Neon, offre gratuite).

- Créer : `3-outillage/scripts/creer-base-neon.sh <projet> [region]` → URI prête.
- Migrer un projet déjà branché ailleurs : copier ses lignes vers la nouvelle
  base, basculer `DATABASE_URL`, redéployer, vérifier — la source garde une
  copie (rollback en 30 s). Exemple outillé : `lanceur/scripts/basculer-base.sh`.
- Clés d'API d'infrastructure : `~/.config/trames/*.env` (chmod 600), jamais
  dans un repo, jamais affichées ; rotation si elles ont transité par un chat.

## Identités et comptes — `admin@delivup.io` n'est PAS un compte personnel (04/09/2026, règle Mehdi)

`admin@delivup.io` appartient au projet d'ÉQUIPE Delivup et ne s'utilise que là. Tout
projet personnel (usines, cockpits, ville, apps mobiles…) utilise **`mehdi.stark@gmail.com`** :
listes blanches d'OTP (`ADMIN_EMAILS`, `AGENT_EMAILS`…), comptes de démo, contact VAPID,
expéditeurs, comptes d'hébergeur/GitHub/Vercel (`mehdi-stark`). Un projet qui embarque
l'adresse Delivup mélange deux périmètres — et une révocation côté équipe couperait un
projet personnel. Vérification : `git grep -n "admin@delivup.io"` vide hors Delivup.
