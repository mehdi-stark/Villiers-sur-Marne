# Recette — tâche planifiée résiliente

- Endpoint HTTP idempotent protégé par secret partagé (`x-cron-secret`), jamais
  d'appel direct app → orchestrateur : état en base + webhook.
- Verrou anti-chevauchement (un run `running` récent = skip), journal
  `workflow_runs` (code, statut, durée, payload, erreur).
- Heartbeat toutes les 5 min + auto-vérification quotidienne « déclaré ↔ réel »
  (cron silencieux au-delà de 2× sa fenêtre = critique) ; alertes dédupliquées
  par clé, e-mail + push sur critique.
- Grille 7 jours par cron sur l'écran pipeline : QUEL jour ça a cassé.
- Export JSON de chaque workflow versionné dans le repo (sans secret).
