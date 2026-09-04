# Leçons de terrain — usine ecom (août 2026)

> Règles GÉNÉRIQUES nées d'incidents réels sur l'usine agentique e-commerce.
> À relire au jour 1 de tout projet. Les leçons spécifiques (Shopify, pièges
> de code du repo) restent dans le LECONS.md du projet.

## Exécution & infrastructure
1. **Connaître le plafond d'exécution AVANT d'y loger un job.** Vercel hobby :
   300 s par fonction — une analyse IA à 3 itérations (~5 min) y meurt sans
   écrire son statut. Un bouton ne lance jamais un job long là où il
   s'exécute : il le met en FILE (état en base) et l'exécuteur sans plafond
   (VPS via une tâche planifiée toutes les 2 min) dépile.
2. **Un run long a une clôture GARANTIE par un tiers fréquent** (nettoyage des
   « running » > 15 min à chaque passage d'un cron) — un processus tué
   n'écrit jamais sa propre fin (« en cours depuis 486 min »).
3. **Un repli IA qui ne revient pas vers le fournisseur d'origine n'est pas un
   repli, c'est un aller simple.** Repli croisé complet + erreur composite qui
   cite chaque fournisseur. Et chaque ENVIRONNEMENT se sonde pour chaque
   fournisseur (Gemini refusait la géolocalisation du VPS).
4. **Un timeout d'appel IA se calibre sur la tâche la plus longue** (fiche
   produit + socle : > 60 s) — sinon tous les replis échouent « en cascade ».

## Produit & cockpit
5. **Une action > 10 s = arrière-plan + état visible** (en cours depuis n min
   / erreur avec message / terminé avec résultat). Un bouton muet est un
   bouton cassé pour l'utilisateur.
6. **Un chiffre sans seuil n'est pas une information ; une décision sans avis
   n'est pas une aide.** Chaque valeur affichée porte sa tonalité vs seuil ;
   chaque décision porte l'AVIS de la machine (valider/refuser/attendre/à
   toi) avec ses raisons — l'opérateur ne devine jamais si c'est bon.
7. **Les décisions manuelles doivent être rares** : ce que la machine sait
   trancher (verdict net, non-argent) se tranche seul après un délai de grâce,
   tracé. L'argent reste TOUJOURS humain — mais validable en un tap.
8. **La capture prouve, l'intuition ment** : audit visuel outillé, bissection
   mesurée (masquer bloc par bloc) — les suspects évidents sont souvent
   innocents ; une régression (page entière en erreur par un enum inventé) se
   voit sur la capture, pas dans les tests.
9. **Toute requête SQL brute nouvelle s'exécute en réel avant déploiement**
   (une valeur d'enum inexistante fait tomber toute la page).
10. **Un envoi sortant avalé par un catch silencieux fait passer le système
    pour mort** : tout échec d'envoi pose une alerte.

## Données & modèle
11. **Un changement de modèle de calcul re-joue le STOCK** (P&L, scores) —
    sinon l'ancien chiffre faux reste affiché et décide.
12. **Un dossier joint les données de l'entité DÉCIDÉE, par identifiant stable,
    jamais par position** (« le premier », « le meilleur »).
13. **Un incident d'import se purge par MOTIF sur tout le lot**, pas exemplaire
    par exemplaire (14 résidus hors-niche retrouvés des jours après).
14. **Ne JAMAIS passer JSON.stringify à un driver qui sérialise déjà** (jsonb
    double-encodé, rendu qui tient par chance) — et une sonde de cohérence le
    surveille.

## Méthode
15. **Trame ET skills** : la trame démarre un projet (une fois) ; les skills
    portent les exigences récurrentes, chargées quand la tâche correspond ;
    le socle injecté aux agents runtime porte les leçons métier. Trois
    réceptacles, jamais de doublon.
16. **Un repo central pour la méthode** : une copie divergente = une leçon
    repayée (Vercel 300 s était déjà écrit ailleurs).
- **29/08 — répétition à blanc : la chaîne a tenu jusqu'à la fiche produit,
  puis « IA indisponible sur tous les replis »** : timeout 60 s trop court
  pour une fiche + socle (DeepSeek pro ET flash), et Gemini REFUSE la
  géolocalisation du VPS (400 FAILED_PRECONDITION) — donc, sur le VPS, les
  tâches confidentielles Gemini-only (SAV) échoueraient aussi. Fix : timeout
  180 s ; sonde EC-02 quotidienne « Gemini joignable depuis cet
  environnement » → alerte critique. Règle : chaque environnement d'exécution
  se sonde pour CHAQUE fournisseur — un repli n'existe que s'il est
  joignable d'ici.
