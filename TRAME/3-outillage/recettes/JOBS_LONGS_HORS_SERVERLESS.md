# Recette — jobs longs hors serverless (file en base + exécuteur sans plafond)

**Problème** : un bouton du back-office lance un traitement de 3-5 min ; sur
un hébergeur serverless (Vercel hobby : 300 s) il meurt sans écrire son statut.

**Recette** (usine ecom, 29/08/2026) :
1. Le bouton **demande** le job : une ligne dans une table/config de file
   (`jobs_demandes` : job, params, demandé le, par), dédupliquée. Réponse
   immédiate + toast « démarre sous 2 min ».
2. Une tâche planifiée (n8n sur le VPS, toutes les 2 min) appelle
   `POST /api/cron/jobs-demandes` sur l'admin **local du VPS** (secret partagé)
   qui dépile et exécute chaque job en appelant sa route locale (verrou
   anti-doublon, run `running` en base, notifications) — sans plafond.
3. Le back-office affiche un bandeau générique « en file → en cours depuis
   n min (étape courante) → terminé », avec auto-rafraîchissement 30 s.
4. À CHAQUE appel cron, les runs `running` > 15 min (tous codes) sont clôturés
   en erreur : un processus tué n'écrit jamais sa propre fin.
5. Le job écrit son **étape courante** dans le run (callback) : l'attente est
   lisible.

**Alternatives** : QStash (délai/queue HTTP), Inngest/Trigger.dev (workflows
durables) — même principe : la demande et l'exécution sont découplées.
