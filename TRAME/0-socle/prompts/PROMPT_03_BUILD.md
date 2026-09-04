# Phase 3 · Construction — la boucle de build

> C'est la phase longue. Le prompt ci-dessous se colle UNE fois pour lancer la machine ;
> ensuite chaque session reprend avec le prompt de reprise en bas de page.

---

## PROMPT DE LANCEMENT

Le cadrage, l'architecture et le CLAUDE.md sont en place. On construit.

**Ta méthode, non négociable :**

1. **Maillon par maillon.** Découpe le parcours en maillons (l'audit pré-implémentation
   les liste). Un seul maillon ouvert à la fois. Pour chaque maillon :
   code → **test EN RÉEL de bout en bout** (vraies APIs, vraie base, client de test
   préfixé [TEST] — pas de mock, pas de « ça devrait marcher ») → commit avec message
   détaillé → mise à jour de la page `/pipeline` de l'admin (le plan vivant du projet :
   phases, statuts ok/wip/todo, prochaines actions par personne).

2. **Crée d'abord la page `/pipeline`** dans l'admin si elle n'existe pas : c'est le
   tableau de bord de l'avancement, mis à jour à CHAQUE maillon livré. Elle liste aussi
   « qui débloque quoi » (mes actions vs les tiennes).

3. **Les gates humains d'abord.** Chaque sortie vers un client (email, document, image)
   passe par une validation dans l'admin. Construis le gate en même temps que la
   génération, jamais après.

4. **Challenge en continu.** À chaque maillon : si tu vois une incohérence dans le plan,
   un coût évitable, un outil plus adapté, une simplification — dis-le AVANT de coder,
   propose, et attends mon arbitrage si ça change le périmètre. Les micro-décisions
   réversibles, prends-les et note-les.

5. **Quand une clé/validation externe me revient** (créer un compte, payer, approuver),
   dis-le explicitement, continue sur un autre maillon en attendant, et re-teste dès que
   je te dis que c'est fait.

6. **Tests par script quand l'UI exige une session** : un script temporaire qui rejoue la
   logique de la route (supprimé après), et les webhooks se testent avec de vrais POST.

Commence par le maillon le plus en amont du parcours (l'entrée des utilisateurs) et
déroule dans l'ordre du flux. Avant chaque maillon, redis en une phrase ce qu'il couvre
et comment tu vas le tester.

---

## PROMPT DE REPRISE (chaque nouvelle session)

Reprends le projet : lis `CLAUDE.md`, la page `/pipeline` de l'admin et le dernier
commit. Dis-moi en 3 lignes où on en est, ce qui est bloqué sur moi, et quel est le
prochain maillon — puis continue la boucle (maillon → test réel → commit → pipeline).

---

## Ce que vous devez faire, vous (les gates du build)

- Relire chaque livrable envoyé à un vrai client avant le premier envoi réel
- Fournir les clés API et valider les créations facturables (l'agent doit demander)
- Trancher vite les « points ouverts » — c'est presque toujours ça qui bloque
- Tester vous-même l'UI de temps en temps : vous verrez ce qu'un test script ne voit pas
