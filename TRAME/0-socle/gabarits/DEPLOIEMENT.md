# Runbook de déploiement — <projet>

## Pré-requis (une fois)
## Déployer (une commande par cible)
- <app> : `<commande>` → vérifier **READY** (jamais supposer) → smoke test post-déploiement.
## Migrations
- Appliquées AVANT le code qui s'en sert ; par l'agent lui-même avec les env fournies.
## Rollback
## Pièges payés
- Quota déploiements/jour ; auteur de commit attendu ; secrets de session partagés Edge/Node ; …
