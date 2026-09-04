# Phase 2 · Règles projet — le CLAUDE.md

> Prérequis : l'audit pré-implémentation validé par vous.
> Livrable : `CLAUDE.md` à la racine — le fichier que l'agent relit à CHAQUE session.
> C'est la mémoire longue du projet : tout ce qui n'y est pas sera oublié un jour.

---

## PROMPT À COLLER

Lis `docs/planning/CADRAGE.md` et `docs/planning/AUDIT_PRE_IMPLEMENTATION.md`.

Écris le `CLAUDE.md` du projet en t'appuyant sur le gabarit `TEMPLATE_CLAUDE_MD.md`
(fourni à côté de ce prompt). Règles d'écriture :

- **Uniquement du non négociable et du non déductible.** Pas de description de code (le
  code se lit tout seul), pas de choses évidentes. Chaque ligne doit empêcher une erreur
  réelle ou fixer une convention qu'on ne peut pas deviner.
- Chaque règle porte son POURQUOI en une phrase — une règle sans raison sera contournée.
- Sections obligatoires : stack retenue · structure du repo · règles base de données
  (source de vérité unique, migrations générées) · règles de sécurité (secrets,
  sessions, isolation des apps) · conventions des documents/templates · ce qu'il faut
  vérifier avant de committer · **la liste explicite de ce qui reste À FAIRE** (pour
  qu'aucune session ne suppose que c'est fait).
- Ajoute la règle de méthode : « construire maillon par maillon ; chaque maillon est
  testé EN RÉEL de bout en bout avant de passer au suivant ; un maillon terminé = commit
  + pipeline visuel mis à jour ; proposer les optimisations et signaler les incohérences
  au fil de l'eau ».

Ensuite, initialise le squelette du projet conformément à l'audit (apps, package partagé,
schéma de base V1, migrations, CI de build) — et rien de plus : pas de feature, juste le
socle qui compile et se déploie.
