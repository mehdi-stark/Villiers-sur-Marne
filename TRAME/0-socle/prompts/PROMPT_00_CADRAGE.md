# Phase 0 · Cadrage — de l'idée au besoin structuré

> Collez le prompt ci-dessous dans Claude Code, dans un dossier vide (git init fait).
> Durée typique : 1 session. Livrables : `docs/planning/CADRAGE.md` + vos réponses intégrées.

---

## PROMPT À COLLER

Je démarre un nouveau projet. Voici l'idée brute :

**[IDEE — décrivez en 3-10 lignes : le problème, pour qui, comment vous imaginez le résoudre, comment ça gagne de l'argent]**

Ton rôle dans cette phase : me challenger AVANT de structurer. Ne code rien.

1. **Interroge-moi d'abord.** Pose-moi toutes les questions dont les réponses changent
   l'architecture ou le périmètre : qui sont les utilisateurs exacts et que font-ils
   aujourd'hui sans le produit ? Quel est le geste manuel le plus coûteux à automatiser ?
   Qu'est-ce qui DOIT rester manuel (gates humains) ? Quelles données entrent, d'où,
   à quelle fréquence, et lesquelles sont sensibles ? Quel est le modèle de revenu précis
   (montants, récurrence, moment de l'encaissement) ? Quelles intégrations externes sont
   indispensables vs souhaitables, et lesquelles risquent d'être bloquées (validation
   d'API tierce, conformité) ? Quel budget outillage (préférence : outils gratuits) ?
   Pose-les par lots de 4-5 maximum, attends mes réponses.

2. **Challenge le concept.** Avant de structurer, dis-moi franchement : les points faibles
   du modèle, ce qui existe déjà sur le marché, les deux ou trois risques qui peuvent tuer
   le projet, et ce que tu simplifierais dans la V1. Propose des alternatives quand tu en
   vois — je veux tes contre-arguments, pas ton approbation.

3. **Puis écris `docs/planning/CADRAGE.md`** avec exactement ces sections :
   - **Le problème et la promesse** (3 phrases max, mesurables)
   - **Personas** : qui utilise quoi, avec leur niveau technique réel
   - **Parcours bout en bout** : du premier contact à la fin de vie du client, étape par
     étape, en distinguant à chaque étape [AUTOMATIQUE] / [HUMAIN VALIDE] / [MANUEL]
   - **Périmètre V1 / V2 / hors périmètre** — sois brutal sur ce qui sort de la V1
   - **Modèle de revenu** : offres, prix, moment d'encaissement, ce que dit le contrat
   - **Données** : ce qui entre, ce qui est produit, ce qui est sensible, rétention
   - **Dépendances externes et risques** : APIs tierces, validations, délais, plan B
   - **Points ouverts** : tout ce qui attend une décision de ma part, numéroté

4. Terminas en me listant les points ouverts un par un pour que je tranche.

Contraintes de forme : français, direct, pas de remplissage. Chaque affirmation sur le
marché ou un outil doit être vérifiée (recherche web) et sourcée, pas supposée.
