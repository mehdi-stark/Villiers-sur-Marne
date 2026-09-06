# Process métiers (SOP) — ville

## D'où vient un enfant ? (tranché le 06/09/2026)

**Un parent ne crée jamais un enfant.** C'est la règle du métier, pas une contrainte
technique : la commune tient le **dossier famille**, constitué à la mairie lors de
l'**inscription scolaire** (justificatif de domicile, livret de famille, quotient
familial) ; les services périscolaires — cantine, accueils, étude, accueil de loisirs —
en **découlent**. Un portail famille qui laisserait un parent déclarer un enfant
créerait des dossiers fantômes, des facturations sans base et des doublons avec le
fichier scolaire.

Chaîne réelle attendue :

| Étape | Qui | Outil | Ce que ça produit |
|---|---|---|---|
| Inscription scolaire | Famille au guichet ou en ligne | Service scolaire de la ville | Dossier famille + enfants, école et classe |
| Affectation à l'école | Ville | Fichier scolaire | École, niveau, année |
| Reprise dans le périscolaire | Ville / Infocom'94 | **Agora+** (export ou API) | La source que ce portail LIT |
| Consultation et réservation | Famille | **Portail famille** (ce produit) | Réservations, démarches, paiements |

**Tant que la reprise Agora+ n'est pas branchée** (faille haute du verdict marché), le
rattachement se fait **côté agents** : back-office → Familles → *Ouvrir le dossier* →
« Rattacher un enfant ». Chaque rattachement porte le nom de l'agent et son horodatage.
Deux garde-fous codés et testés : l'**école doit appartenir aux groupes scolaires de la
commune** (liste, jamais du texte libre — une école mal orthographiée casse la
facturation), et la **date de naissance doit être plausible** ; un doublon exact
(même prénom, même date) est refusé avec son motif.

**On ne supprime jamais un enfant, on le DÉTACHE** (déménagement, fin de scolarité) :
la ligne reste en base, horodatée, pour que les factures et les pointages passés restent
lisibles. Un enfant venu de la source de la ville ne se corrige pas dans le back-office :
il se corrige **à la source**, sinon la prochaine reprise écrase la correction.

Côté parent, avec plusieurs enfants : un **sélecteur** « Tous · <prénom> » en tête des
trois échelles du planning ; le choix voyage dans l'URL (partageable, réversible) et
**suit** le changement d'échelle.

## Process

| Process | Déclencheur | Étapes (qui · outil · gate) | Sortie | Délai cible |
|---|---|---|---|---|
| Rattacher un enfant | Appel d'un parent, ou dossier incomplet constaté | Agent · back-office `/familles/<id>` · règles de validation codées (école de la commune, naissance plausible, pas de doublon) | Enfant visible côté famille, réservable | immédiat |
| Détacher un enfant | Déménagement, fin de scolarité | Agent · même écran · confirmation en deux temps | Enfant retiré des vues, historique conservé | immédiat |
| Réserver un service | Parent | Portail · vue Jour, Semaine ou Mois · **le code** juge le délai de prévenance | Réservation journalisée (acceptée ou refusée avec motif) | immédiat |
| Pointer une présence | Agent, sur place | Back-office · file du jour · date future refusée | Présence/absence → base de la facture | le jour même |
| Valider une démarche | Dépôt d'une famille | Agent · file des démarches · refus TOUJOURS motivé | Démarche validée ou renvoyée avec le motif | 48 h |

Table des pouvoirs : ce que la machine fait seule / propose / ne touche jamais.

| Décision | La machine | L'humain |
|---|---|---|
| Délai de prévenance dépassé ? | **décide** (règle de la ville, sourcée) | ne peut pas forcer depuis l'écran |
| Tarif applicable | **calcule** (tranche de quotient) | corrige le quotient, pas le tarif |
| Rattachement d'un enfant | **vérifie** (école, date, doublon) | **décide** |
| Refus d'une démarche | propose l'état | **écrit le motif** — jamais de refus muet |
| Paiement | prépare (PayFIP) | la régie encaisse |
