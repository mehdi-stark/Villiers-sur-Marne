# Checklist pré-live — avant le PREMIER vrai utilisateur

> À dérouler intégralement. Chaque case doit être cochée ou explicitement acceptée
> comme risque. Donnez ce fichier à l'agent : « déroule la checklist pré-live ».

## Paiements
- [ ] Vérification de **signature des webhooks** (HMAC) — sans elle, n'importe qui
      connaissant l'URL peut fabriquer un faux paiement
- [ ] Produits/prix recréés en **mode Live** (les IDs test ne migrent pas), constantes
      migrées en table de configuration
- [ ] Clé restreinte (pas la clé secrète complète), scopes minimaux
- [ ] Idempotence des événements testée (rejouer un webhook ne double rien)

## Base de données
- [ ] **RLS/policies** activées sur toutes les tables exposées, ou rôle applicatif à
      portée limitée — la clé service ne doit plus être le seul rempart
- [ ] Sauvegardes automatiques vérifiées (et UNE restauration testée)
- [ ] Les tokens d'accès expirent et les liens à usage unique se consomment

## Authentification & accès
- [ ] Rate-limit sur le login/OTP admin (verrouillage après N échecs)
- [ ] Liste blanche des emails admin revue
- [ ] Aucun secret dans le repo (audit de l'historique git aussi), `.env` complet
      côté hébergeur, variables `NEXT_PUBLIC_*` passées en revue

## Emails & domaines
- [ ] Domaine d'envoi vérifié (SPF/DKIM/DMARC) — sinon spam
- [ ] Adresse de réponse surveillée par un humain
- [ ] Templates relus par un natif de la langue cible

## Monitoring & reprise
- [ ] Sentry (ou équivalent) branché sur toutes les apps, DSN en production
- [ ] Un moniteur d'uptime externe sur chaque app + le moteur d'automatisation
- [ ] Le hub d'erreurs de l'automatisation notifie un humain
- [ ] Journal des exécutions consultable depuis l'admin

## Légal (selon juridiction)
- [ ] Pages privacy/terms publiées (souvent prérequis des validations d'API tierces)
- [ ] Base légale de la signature électronique vérifiée pour la juridiction
- [ ] Rétention des données conforme à ce que promettent les CGU

## Dernier test
- [ ] UN parcours complet en conditions réelles avec un vrai compte (pas [TEST]) et un
      petit paiement réel, du premier contact au livrable final

## Ajouts v2 (leçons de prod DelivUp — détail dans LECONS_TERRAIN.md)

- [ ] Les QUOTAS du plan d'hébergement sont listés par écrit (déploiements/jour,
      CPU serverless/mois, durée max par fonction, bande passante) et l'usage
      prévu tient dedans avec marge ×3
- [ ] Un fallback auto-hébergé existe (VPS + Docker) et a été déployé au moins
      une fois — avec la commande de mise à jour en une ligne
- [ ] Les tâches longues (> 60 s) tournent HORS serverless
- [ ] Après chaque push : l'état du déploiement est VÉRIFIÉ (READY), jamais supposé
- [ ] La sécurité base de données (RLS/policies/triggers) est posée par un
      script idempotent rejoué après chaque migration — jamais à la main
- [ ] Chaque route/page sensible vérifie le RÔLE, pas seulement la session
- [ ] Les tests de charte (tokens, conventions) tournent en CI
- [ ] Le contrôle de cohérence sur données réelles passe sans rouge
