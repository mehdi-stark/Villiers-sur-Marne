# Leçons gravées — ville

> Toute erreur corrigée = une ligne ici + le garde-fou (codé de préférence) dans la même session.
> Leçon de MÉTHODE → `trames.sh lecon` (remonte dans le repo trames).

- **2026-09-04 — Un cadrage en markdown n'est pas un point de validation** : 200 lignes et 7 décisions livrées dans un fichier à un opérateur qui lit sur son téléphone → session bloquée. Cause : pas d'écran pour trancher. Fix : maillon 0 = squelette du cockpit avec `/pilotage/cadrage` (un bouton par option) + table `decisions` relue par `pnpm decisions`. Règle gravée dans la trame (recette `COCKPIT_SQUELETTE`, leçon 11bis, publiée).
- **2026-09-04 — Un script qui crée puis plante laisse un orphelin** : `creer-base-neon.sh` a créé la base Neon puis échoué sur un `\"` dans une f-string (Python 3.14) — une relance aurait créé une seconde base. Fix : `.format()` sans échappement, et le script est IDEMPOTENT (cherche le projet par nom avant de créer). Règle : tout script de provisionnement se relance sans effet de bord ; le prouver par une seconde exécution.
- **2026-09-04 — Une note multi-ligne rendue sur une ligne** : le `<span>` de la note ignorait les retours (`\n`) saisis dans le textarea — l'opérateur voyait sa condition écrasée. Fix : `white-space: pre-line` sur l'élément qui affiche un texte saisi ; la normalisation CRLF→LF reste à l'écriture (leçon 55 de la trame).
