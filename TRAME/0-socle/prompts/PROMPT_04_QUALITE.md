# Phase 4 · Qualité — agents QA et gates sur tout le process

> À lancer quand les chaînes de génération existent (textes, images, documents).
> Sur Delivup, cette phase a attrapé des scores incohérents et protège la seule sortie
> IA qui part directement au client.

---

## PROMPT À COLLER

Audite toutes les chaînes de génération du projet (textes, images, documents) et mets
en place la couche qualité :

1. **Une table `qa_reviews`** : sujet (client/lead/document), périmètre, verdict
   (ok/attention), score, problèmes détectés, modèle utilisé, horodatage. Une ligne par
   génération, avant la relecture humaine.

2. **Un agent QA par type de génération**, avec le bon référentiel :
   - texte : contre-lecture CONTRE LES DONNÉES SOURCES (chiffres introuvables dans la
     source, entités inexistantes, placeholders, mauvaise langue) — jamais un jugement
     de style dans le vide ;
   - image : comparaison à l'image source (fidélité du sujet, artefacts, texte halluciné),
     avec des critères ADAPTÉS AU TYPE (une bannière ne se juge pas comme une photo) ;
   - le verdict final est calculé PAR CODE depuis la réponse du QA (seuils explicites),
     pas laissé à l'appréciation du modèle.

3. **La règle de routage** : le QA informe, l'humain tranche — SAUF pour toute sortie qui
   part directement à un client sans relecture : là, un verdict négatif déclenche un
   REPLI DÉTERMINISTE (contenu neutre généré par code) + une alerte interne. Rien de
   douteux ne peut atteindre un client.

4. **Affichage** : badge QA (verdict + score) partout où un humain relit — liste des
   documents, fiche client, notifications internes de relecture.

5. **Garde-fous par code en amont du QA** : listes blanches d'identifiants, interdiction
   d'écraser un champ déjà validé, longueurs bornées, idempotence des écritures. Tout ce
   qui peut être vérifié sans IA doit l'être sans IA.

6. **Teste chaque agent QA en réel** (une génération par chaîne) et montre-moi les
   verdicts. Ajoute les tâches QA à la table de configuration des modèles (modèle
   économique par défaut — la contre-lecture doit coûter des centimes).

---

## CHECKLIST_PRE_LIVE — voir le fichier dédié

La couche qualité ne remplace pas le durcissement avant le premier vrai client
(`CHECKLIST_PRE_LIVE.md`) : signature des webhooks, produits de paiement en mode réel,
protections base de données, rate-limits d'authentification, monitoring.
