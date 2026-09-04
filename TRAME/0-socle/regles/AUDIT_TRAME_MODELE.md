# Audit de mise à niveau — <projet> (<date>)

> Écart entre CE projet et le niveau attendu (`TRAME/0-socle/EXIGENCES.md`).
> Rempli par l'agent (skill `audit-trame`) sur PREUVES (captures, requêtes,
> code lu), jamais sur impression. Chaque écart devient un maillon, priorisé
> par ce qu'il débloque — jamais une refonte.

Légende : ✅ conforme · 🟡 partiel · 🔴 absent · ⬜ non applicable (dire pourquoi)

## 1. Expertise & décisions
- [ ] Les décisions présentées à l'opérateur portent un AVIS (valider/refuser/attendre) avec raisons et chiffres vs seuils —
- [ ] Un socle de règles métier injecté aux agents runtime existe —
- [ ] Les décisions manuelles répétées que la machine sait trancher sont automatisées (tracé) —

## 2. Business
- [ ] Analyse de marché documentée, mesurée, datée (`DOCTRINE_MARCHE.md`) —
- [ ] P&L / rentabilité par code, taxes et coûts probables inclus —
- [ ] Doctrine commerce respectée (aucun profit refusé, aucune vente retardée, cashflow direct) —
- [ ] L'argent a toujours un gate humain ; plafonds en base —

## 3. Produit (back-office / cockpit)
- [ ] Charte en tokens, zéro couleur en dur ; primitives accessibles —
- [ ] Responsive et mobile réels (capture 390 px sans débordement) —
- [ ] Textes générés structurés ; listes groupées ; vides expliqués —
- [ ] Toute action > 10 s en arrière-plan avec état visible —
- [ ] Responsive partout ; PWA si application à compte (manifest + sw.js publics, push, badge) — preuve : 200 hors session, notification reçue —
- [ ] Connexion par OTP (obligatoire) + lien optionnel — preuve : OTP réussi depuis la PWA installée, hash en base —
- [ ] Script de capture multi-écrans existe (`TRAME/3-outillage/scripts/capturer.mjs` adapté) —

## 4. Automatisation & IA
- [ ] Tâches répétitives = code + tâche planifiée (heartbeat, verrou, journal) —
- [ ] L'IA ne décide aucune donnée métier ; QA par code ; repli déterministe côté client —
- [ ] Replis IA croisés, timeouts calibrés, environnement sondé —
- [ ] Jobs longs hors serverless ; fantômes clôturés —

## 5. Qualité, sécurité, robustesse
- [ ] Aucun secret côté navigateur ; webhooks signés/idempotents ; audit des écritures sensibles —
- [ ] Sécurité base par script rejoué ; rôle vérifié —
- [ ] Migrations générées, appliquées avant le code ; CI schéma ↔ migrations —
- [ ] Échecs d'envoi alertés ; auto-vérification déclaré ↔ réel ; push/e-mail sur critique —
- [ ] Checklist pré-live (`TRAME/0-socle/regles/CHECKLIST_PRE_LIVE.md`) —

## 6. Méthode
- [ ] CLAUDE.md à jour (état courant, règles permanentes) —
- [ ] Registre des leçons ; leçons de méthode remontées dans `trames` —
- [ ] Revue de pilotage sur chiffres (`revue-hebdo`) —

## Plan de mise à niveau (par ce que chaque maillon DÉBLOQUE)
1. …
2. …
3. …
