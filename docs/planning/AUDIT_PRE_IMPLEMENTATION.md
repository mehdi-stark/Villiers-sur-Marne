# Audit pré-implémentation — ville (2026-09-04)

## §1 Stack retenue (arbitrages écrits)
| Besoin | Outil | Pourquoi | Repli | Quota connu |
|---|---|---|---|---|

## §2 Architecture
- Apps et frontières (déployées séparément ? couplage ?) : <…>
- Schéma = source de vérité unique ; migrations GÉNÉRÉES ; machines à états = enums.
- Où tournent les jobs longs (jamais serverless) : <…>

## §3 Invariants (non négociables — chacun vérifiable)
1. L'IA ne décide jamais d'une donnée métier ; toute sortie IA a un QA ; client-facing = gate ou repli par code.
2. L'argent a toujours un gate humain ; plafonds en base revalidés à l'exécution.
3. Aucun secret côté navigateur ; webhooks signés et idempotents ; écritures sensibles auditées.
4. État en base + webhook ; jamais d'appel direct app → orchestrateur.
5. <invariants propres au projet>

## §4 Décisions numérotées
| # | Décision | Alternatives écartées | Réversible ? | Date |
|---|---|---|---|---|

## §5 Sécurité et rôles
<qui accède à quoi ; RLS par script ; rôle vérifié par route>

## §6 Ce qui reste explicitement à faire (ne pas supposer que c'est fait)
