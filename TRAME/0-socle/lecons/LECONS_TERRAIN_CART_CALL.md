# Leçons de terrain — cart_call

> Remontées automatiquement depuis le registre du projet (remonter_lecon.sh).

- **31/08/2026 — Un compte mécanique n'est pas une preuve** : `auditer.sh` annonçait « 4 confirm() » (réel : 1 appel + 3 commentaires) et « 278 hex en dur » (réel : ~120, le grep comptait les builds `.next/`). Toujours re-vérifier un chiffre d'audit sur pièces avant de dimensionner un maillon — ici le maillon « primitives » était 4× plus petit qu'annoncé et livrable en une session. Garde-fou : exclure `.next/`, `node_modules/` et les lignes de commentaire de tout grep de preuve.
