# Leçons de terrain — capitalisation DelivUp (juillet-août 2026)

> Tout ce qui a été appris EN PRODUCTION depuis la première version de la
> trame. Chaque règle vient d'un incident réel ou d'un retour utilisateur —
> pas d'une théorie. À relire au démarrage de CHAQUE nouveau projet, et à
> intégrer au CLAUDE.md du projet dès la phase 2.

## 🚀 Déploiement & infrastructure

1. **Un push n'est jamais une mise en ligne.** Vérifier l'état du déploiement
   (READY) après chaque push — un build qui passe peut mourir après
   (limites de plan, config invalide). Incident : 19 déploiements morts en
   silence, app figée une journée.
2. **Connaître les quotas des plans gratuits AVANT qu'ils mordent.** Vercel
   Hobby : 100 déploiements/JOUR (les annulés comptent), 4 h de CPU
   serverless/MOIS, 300 s max par fonction, 100 Go de bande passante.
   Un monorepo à 3 apps consomme 3 déploiements PAR PUSH → grouper les
   commits, et couper le déploiement automatique des apps rarement touchées
   (deploy hooks ciblés déclenchés seulement quand leurs fichiers changent).
3. **Quand plus rien ne se déploie : vérifier le QUOTA avant de diagnostiquer
   un webhook.** Et ne JAMAIS enchaîner des pushes « ping » en rafale — ils
   salissent l'historique et aggravent le quota.
4. **Un fallback auto-hébergé dès que le produit est en prod.** Un VPS à
   ~10 €/mois (Docker + le reverse proxy déjà en place) sert de : secours
   quand l'hébergeur principal bloque, ET poste de travail pour les tâches
   LOURDES (générations IA, gros exports) qui explosent les quotas
   serverless. Déploiement par rsync + docker compose : une commande, 4 min.
5. **Les tâches longues n'ont rien à faire sur du serverless.** Toute
   fonction > 60 s (génération d'images, traitement de fichiers) finira par
   coûter trop cher ou heurter un plafond — la placer d'emblée sur une
   machine sans compteur.
6. **Répartir par RISQUE, pas par outil.** Le visage public (landing,
   portail client) sur un hébergeur managé avec CDN ; l'usine (automations,
   générations) sur le VPS. Deux paniers indépendants = une panne n'éteint
   jamais tout. Multiplier les hébergeurs au-delà de deux = dispersion.

## 🗄 Base de données & sécurité

7. **La sécurité posée à la main n'existe pas.** Une RLS cliquée dans un
   dashboard disparaît au premier `db:push` qui recrée la table. TOUTE
   sécurité vit dans un script idempotent rejoué après CHAQUE migration.
   Incident : 88 tables de prod intégralement lisibles par la clé publique.
8. **Migration appliquée AVANT de pousser le code qui s'en sert** — sinon la
   prod sert des requêtes sur des colonnes qui n'existent pas.
9. **Selects explicites, jamais `select()` complet** sur les tables qui
   évoluent : un décalage code/schéma casse toute la page au lieu d'un champ.
10. **Ce que l'ORM ne gère pas (triggers, policies) se rejoue par script**
    après chaque migration — même logique que la RLS.
11. **Vérifier le RÔLE, pas seulement la session.** Une colonne `role` que
    personne ne lit ne protège rien. Chaque route/page sensible exige le
    rôle requis — à poser AVANT d'embaucher le premier non-admin.

## ✅ Qualité & mesure

12. **Des tests de charte en CI** : les conventions visuelles (tokens de
    couleurs, échelle typographique, limites de config) se vérifient par des
    tests qui lisent le code — chaque exception en dur porte sa
    justification écrite. Une convention non testée dérive en une semaine.
13. **Un contrôle de cohérence sur les DONNÉES RÉELLES**, à lancer avant
    d'affirmer que quoi que ce soit « est bon » : les trous vivent dans les
    jointures entre morceaux (vocabulaire d'un formulaire vs clés de
    routage, documents sans instantané…), aucune relecture de code ne les
    trouve.
14. **Calibrer les seuils par la donnée, jamais par l'intuition.** Mesurer le
    pouvoir prédictif d'un seuil sur l'historique réel avant de le poser.
    Un score IA sans corrélation avec le jugement humain (mesuré : bande
    40-59 validée à 92 %) ne doit JAMAIS bloquer — seuls des FAITS bloquent.
15. **Diagnostiquer sur les données réelles avant de coder le fix.** Le bug
    rapporté (« la photo n'apparaît pas ») avait une cause différente de
    l'hypothèse évidente — 10 minutes de requêtes sur la prod évitent un
    correctif à côté.
16. **Vérifier que le correctif est DANS l'artefact livré** (chercher une
    chaîne du composant dans le bundle) — un build qui compile ne prouve pas
    que l'insertion a réussi (les outils sans typecheck laissent passer).

## 🎨 Interface

17. **L'UI parle le langage de l'utilisateur, jamais les concepts internes**
    (pas de « menu.csv », de « référentiels », de noms de tables). Rouge =
    seul un conflit humain ; orange = à refaire.
18. **Le document récent fait foi** : quand deux briefs/retours se
    contredisent, appliquer le plus récent et SIGNALER l'écart.
19. **Structurer par mondes nommés** : intertitres de groupe sur les pages
    denses, actionnable à l'écran / explication en infobulle, listes fermées
    par défaut, actions destructives dans une zone à gravité (réversible
    au-dessus, destructif en dessous, conséquences en face).
20. **Les popups en portal au premier plan** — un panneau rendu dans un
    conteneur `overflow-hidden` sera rogné un jour ; un z-index sous la
    barre sticky sera recouvert. Auditer le pattern PARTOUT dès le premier
    signalement.

## 🤖 IA en production

21. **La machine assemble, la donnée décide.** Matrices, seuils, mappings,
    archétypes : en BASE, pas dans le code — modifiables sans redéploiement.
    Les prompts sont assemblés par code depuis ces données, jamais écrits à
    la main par requête.
22. **Repli fournisseur multi-comptes** : sur une erreur de quota/crédit, ne
    JAMAIS réessayer un modèle du même fournisseur (même compte à sec) —
    basculer chez un autre. Sur une erreur transitoire (5xx), une seule
    re-tentative croisée.
23. **Chaque rejet humain devient une contrainte machine** : le motif du
    rejet est réinjecté dans la génération suivante, et les motifs récurrents
    remontent en « leçons » agrégées.
24. **La décision d'équipe orale PRIME sur le document écrit** — mais l'écart
    doit être résorbé dans la journée (mettre le document à jour), sinon le
    ping-pong est garanti.

## 🧭 Méthode de travail avec l'agent

25. **Reformuler la demande avant de coder** quand elle est ambiguë — un
    correctif à côté coûte deux allers-retours et de la confiance.
26. **Un seul chantier après un retour d'incompréhension.** Livrer petit,
    faire vérifier, continuer.
27. **Challenger à CHAQUE itération** — y compris son propre code déjà
    livré : « qu'est-ce qui est encore moyen ici ? »
28. **Grouper les livraisons** : un push par lot cohérent, jamais par
    retouche. L'historique reste lisible et les quotas respirent.
29. **Capitaliser en continu** : chaque incident → une règle dans le
    CLAUDE.md du projet, chaque pattern validé → la trame. Cette page en
    est la preuve.
