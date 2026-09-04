# Prompt 05 — Amélioration continue & design premium (règles permanentes)

> À coller dans le **CLAUDE.md** (ou les instructions projet) de chaque nouveau
> projet, dès le jour 1. Ce sont les deux règles qui font la différence entre un
> agent qui exécute et un agent qui fait progresser le produit.

## Bloc à copier dans CLAUDE.md

```markdown
## Règles de travail permanentes

### 1. Amélioration continue (fin de CHAQUE réponse)
Termine chaque réponse par une section « Propositions d'amélioration » avec
exactement trois axes :
- **Feature** — une fonctionnalité qui apporterait de la valeur métier maintenant
- **Design** — une amélioration visuelle ou de cohérence de l'interface
- **UX** — une friction réelle d'utilisateur à supprimer

Règles : propositions CONCRÈTES et actionnables (pas de généralités), ancrées
dans ce qui vient d'être livré ou observé dans le code, jamais répétées d'une
fois sur l'autre si elles n'ont pas été retenues. Si je dis « ajoute les
propositions » ou « continue », applique-les.

### 2. Design premium — niveau d'exigence
Tout écran livré doit viser le niveau Linear / Stripe Dashboard, pas un rendu
de prototype. Concrètement :
- **Charte unique** : couleurs, typographies (une display + une body via
  next/font, jamais les polices par défaut), rayons, ombres — définis en
  tokens CSS (:root) et utilisés PARTOUT. Zéro gris Tailwind par défaut.
- **Micro-interactions discrètes** : moteur `motion` (Framer Motion) —
  transitions 200-300 ms, spring léger au tap sur les gros boutons, compteurs
  animés sur les chiffres clés. JAMAIS d'effets spectaculaires (particules,
  3D) dans un outil de travail — réserve-les aux landing pages.
- **Primitives accessibles** : dialogs/menus/tooltips sur Radix (copy-in
  stylé charte, philosophie shadcn) — jamais un confirm() navigateur, jamais
  une modale maison sans focus trap.
- **Finition avant livraison** (checklist bloquante) : libellés humains (pas
  de codes techniques affichés), états disabled cohérents, responsive mobile
  vérifié, fuseau horaire explicite sur toute heure affichée, téléchargements
  en blob côté client, tables qui scrollent dans leur conteneur.
- Contrainte : uniquement des librairies éprouvées (licence MIT claire,
  traction réelle) — jamais de librairie douteuse.
```

## Pourquoi ça marche (contexte pour toi)

- La section imposée à CHAQUE fin de réponse force l'agent à relire ce qu'il
  vient de livrer avec un œil critique — c'est le moteur de l'amélioration
  continue de Delivup (l'agent y a mémorisé la règle après un seul rappel).
- Le niveau « Linear/Stripe » est un ancrage concret que l'agent connaît :
  plus efficace que « fais beau ». Nommer les interdits (gris par défaut,
  confirm(), polices système) évite les régressions.
- Sur claude.ai / Claude Code, la mémoire persistante retient ces règles
  d'une session à l'autre — mais le CLAUDE.md reste la source de vérité :
  la mémoire complète, elle ne remplace pas.

## Option : charte en skill

Si le projet a une charte de marque (HTML/PDF), la déposer dans
`.claude/skills/<projet>-brand/SKILL.md` avec les tokens exacts (hex, polices,
rayons, interdits) et ajouter au CLAUDE.md : « charger la charte avant TOUTE
génération ou modification de design ». C'est ce qui garantit la cohérence
sur la durée — l'agent ne « réinvente » plus les couleurs.
