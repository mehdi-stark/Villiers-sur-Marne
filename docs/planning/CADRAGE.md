# Cadrage — ville (2026-09-04)

> Idée brute (opérateur) : « recréer le dashboard des services publics de
> Villiers-sur-Marne (services familiaux…) — design et fonctionnel à refaire ;
> proposer une nouvelle version à la mairie ; faire "correctement" une fois
> l'accès à leur API obtenu ». Contraintes fournies : **aucune** (champ laissé
> vide dans le prompt — voir point ouvert 7).

## 0 · Verdict de viabilité (après l'analyse de marché)
_À remplir à l'étape 2 (ANALYSE_MARCHE.md)._ Pré-lecture honnête : **le
produit est viable comme démonstrateur → pilote B2G ; il n'est PAS viable comme
« surcouche » branchée sur une API qui n'existe pas publiquement** (§5).

## 1 · Le problème et la promesse

### Ce qui existe aujourd'hui (constaté le 04/09/2026, pas supposé)
- Le « Portail Famille » de Villiers-sur-Marne est **Agora+ (éditeur Agora Plus,
  Malakoff)**, hébergé et mutualisé par **Infocom'94** (syndicat informatique
  du Val-de-Marne, 13 communes adhérentes dont Créteil, Sucy-en-Brie,
  Villiers) : `https://infocom94.agoraplus.fr/villiers/…` — source :
  villiers94.fr/…/portail-famille, infocom94.fr/applications/agora.
- Périmètre fonctionnel réel (libellés extraits de `assets/lang/fr.js`,
  944 clés) : Mon espace · Réservations (calendrier, **semaine type**, panier à
  régler sous 3 h) · Enfants · Activités · Factures + paiement **TIPI/PayFIP**
  (`INVOICE_NO_TIPI`) · Attestation de paiement (CESU / autres) · Quotient
  familial (tranche) · Mandat SEPA · Démarches (workflow à étapes, pièces :
  CNI, justificatif de domicile, relevé CAF, vaccins, acte de naissance) ·
  Notifications e-mail/SMS · FranceConnect (`franceconnect.js`) · 50 langues.
- Stack constatée (en-têtes HTTP + HTML de la page d'accueil) : **AngularJS
  1.x + Angular Material 1** (fin de vie AngularJS : janvier 2022), backend
  **Oracle PL/SQL web toolkit** (routes `pck_home.home_view`,
  `pck_dashboard_services.translator`), `Content-Type: charset=Windows-1252`,
  `Access-Control-Allow-Origin: *`, `user-scalable=0` (zoom interdit — défaut
  RGAA), objet `userInfo` avec un champ `PASSWORD` en sessionStorage.
- Défauts de qualité visibles sans compte : libellés franglais livrés en prod
  (« Mandat a créé », « Attestation payment », « Bulletin d'vaccins »,
  « Hmm… c'est embarrassant »), bandeau cookies sans information (plainte
  publique Services Publics+ du 08/10/2023, restée sans réponse de la mairie).

### Qui souffre de quoi
- **Les parents** (33 162 habitants en 2023 ; 8 maternelles + 7 élémentaires,
  soit ≈ 3 000-3 500 enfants du 1er degré à réserver chaque mois — ordre de
  grandeur à confirmer auprès de la ville, pas un chiffre mesuré) : réserver
  la cantine / l'accueil du soir / le centre de loisirs sur un téléphone, le
  soir, avec un délai de prévenance ; payer ; produire une attestation pour
  l'employeur ou les impôts ; ne pas rater une inscription (rentrée 2026-2027 :
  inscriptions obligatoires en ligne depuis le 01/06/2026, dossier à mettre à
  jour avant le 31/08/2026 — villiers94.fr).
- **L'Espace Accueil et Facturation** (01 49 41 28 00) : absorbe au guichet et
  au téléphone tout ce que le portail ne sait pas faire (annulations hors
  délai, « activité sans réservation : désinscription auprès des services »).
- **La collectivité** : image (le portail est le service municipal le plus
  utilisé par les familles), conformité (RGAA obligatoire pour un service
  public en ligne, RGPD sur des données d'enfants), dépendance à un éditeur.

### La promesse en une phrase
Un portail famille **au niveau des meilleures apps grand public** (installable
sur le téléphone, réservation en trois gestes, paiement PayFIP, notifications
utiles), conçu pour **remplacer le front d'Agora+ sans casser la gestion
métier** — d'abord pour Villiers, puis pour les 13 communes d'Infocom'94.

### Ce qui prouve que le problème existe
- Preuve directe : les défauts listés ci-dessus (constatés, reproductibles).
- Preuve indirecte : plainte publique 2023 ; l'éditeur lui-même annonce une
  « version 3 » censée « rendre plus pratique et intuitif » (mairie-bailly.fr)
  — aveu que la version actuelle ne l'est pas.
- **Manque** : aucune mesure de la douleur côté parents (pas d'avis publics
  exploitables : l'app « Portail Famille » d'Agora Plus n'a « pas assez de
  notes » sur l'App Store). À mesurer à l'étape 2 (autocomplétion, avis des
  autres communes Agora+, sondage terrain — voir point ouvert 6).

## 2 · Personas et parcours
| Persona | Situation | Parcours clé (étapes) | Moment de vérité |
|---|---|---|---|
| **Parent réservant** (ex. mère de 2 enfants, smartphone, 22 h) | Doit réserver cantine + accueil du soir pour la semaine, sous délai | Ouvre l'app installée → code OTP/biométrie → voit la semaine des 2 enfants → applique la semaine type → confirme → reçoit la confirmation | La réservation passe en < 60 s sans « erreur est survenue » |
| **Parent payeur** | Facture mensuelle, veut payer et garder une attestation | Notification « facture disponible » → détail par enfant/activité → PayFIP → attestation PDF | Le paiement aboutit du premier coup, l'attestation est juste |
| **Parent nouvel arrivant** | Inscription scolaire/périscolaire, dossier à pièces | Démarche guidée → pièces photographiées → suivi d'état → validation par le service | Sait toujours où en est son dossier sans appeler |
| **Agent Accueil & Facturation** | Traite exceptions, impayés, dossiers | Back-office : file des démarches à valider, réservations hors délai à arbitrer, régularisations | Moins d'appels ; chaque action tracée |
| **Directeur d'accueil de loisirs** | Pointage présences/absences | Liste du jour par activité, pointage tactile, écarts réservé/présent | Le pointage nourrit la facturation sans ressaisie |
| **Décideur** (élu enfance, DGS/DSI, Infocom'94) | Mandat 2026-2032 (J.-A. Bénisti réélu, 1er tour 47,46 %) ; arbitre budget et marchés | Démo → pilote → marché | Voit la différence en 2 minutes sur son téléphone |

## 3 · Modèle business (B2G — pas un SaaS grand public)
- **Le client est la collectivité** (ou Infocom'94 pour ses 13 communes),
  jamais le parent. Les parents ne paient rien à l'éditeur ; les flux d'argent
  des familles vont au **Trésor public via PayFIP** (décret 2018-689, portail
  DGFiP dont l'usage est gratuit pour la collectivité) — **aucun Stripe
  possible** sur des recettes de régie publique.
- **Comment on gagne** : (a) prestation initiale de conception/développement,
  (b) licence + maintenance + hébergement annuels par commune, (c) extension
  aux autres communes du syndicat. Seuil clé : depuis le **01/04/2026, un
  marché de fournitures/services < 60 000 € HT** se passe sans publicité ni
  mise en concurrence (décret du 30/12/2025) — c'est la porte d'entrée d'un
  pilote signé directement par la commune.
- **Doctrine commerce, appliquée à la lettre** :
  1. aucun profit refusé → un pilote même modeste (< 60 k€ HT) se prend ;
  2. aucune vente retardée → la démo se montre AVANT d'avoir l'API, avec des
     données fictives réalistes ; la mise en production n'attend pas la
     perfection du back-office ;
  3. pas de crédit → en B2G le mandatement à 30 jours (Chorus Pro) est la loi,
     pas un choix : on le neutralise par **une avance de 30 % à la signature**
     (autorisée par le code de la commande publique) et des jalons courts
     facturés à la livraison prouvée.
- Prix et marge : **non chiffrés ici** (interdit d'inventer) — grille P&L à
  l'étape 2 sur la base des marchés Agora+/Infocom'94 publiés (BOAMP,
  openprocurements) et des prix concurrents (Arpège, Berger-Levrault,
  Abelium, Ciril).

## 4 · Périmètre
- **V1 — le démonstrateur qui vend (puis le pilote)** :
  - PWA installable, connexion OTP e-mail (+ passkey), multi-enfants.
  - Tableau de bord : semaine en cours par enfant, factures à payer, dossiers
    en attente, messages du service — vides expliqués.
  - Calendrier de réservation cantine/accueil/loisirs avec semaine type,
    délais de prévenance CODÉS (jamais « contactez les services » sans dire
    pourquoi ni quand), panier et verdict clair.
  - Factures : détail par enfant/activité, paiement PayFIP (sandbox en V1),
    attestation PDF exacte (données + instantané rendu conservés).
  - Démarches à pièces avec suivi d'état ; notifications push utiles (rares).
  - Back-office minimal : activités, calendriers, tarifs/QF, file des démarches,
    pointage — le strict nécessaire pour faire tourner une classe pilote.
  - **Couche adaptateur** isolant tout accès aux données : `source fictive`
    aujourd'hui, `Agora+ (API ou export)` demain, sans toucher au front.
- **V2** : FranceConnect, SEPA, régularisations de masse, pointage tablette,
  multi-communes (thème + règles par commune), RGAA audité par un tiers,
  hébergement SecNumCloud.
- **Non-périmètre explicite** : la gestion financière/comptable (régie, Hélios,
  titres de recettes), la petite enfance (crèches, commission d'attribution),
  le logiciel de gestion scolaire (dérogations, carte scolaire), toute
  aspiration des données Agora+ avec les identifiants des parents (voir §5).

## 5 · Contraintes externes (le gate qui dimensionne tout)
1. **« Leur API » n'existe pas publiquement.** Agora+ n'expose que les
   endpoints PL/SQL internes appelés par son propre front. Y accéder suppose
   un accord d'Agora Plus **ou** une exigence contractuelle d'interopérabilité
   portée par Infocom'94 (client de l'éditeur) — ou une reprise de données à
   la rupture du contrat. Tant que ce n'est pas signé, on ne code rien qui en
   dépende (d'où l'adaptateur).
2. **Le portail n'est pas décidé par Villiers seule** : il est acheté et
   hébergé par Infocom'94 pour 13 communes (marché M2015/02-Enf « fourniture
   et maintenance d'un logiciel de gestion des services enfance/petite
   enfance », 2015 — date de renouvellement à retrouver). Le vrai décideur
   technique est le syndicat ; l'élu de Villiers est le sponsor.
3. **Commande publique** : < 60 k€ HT sans procédure ; au-delà, marché
   (MAPA), délais de 3 à 9 mois, mémoire technique, références demandées.
4. **Paiement** : PayFIP obligatoire (recettes de régie), avec ses tests DGFiP.
5. **Conformité** : RGAA (accessibilité, déclaration obligatoire), RGPD sur
   données de mineurs (AIPD, DPO de la commune, hébergement UE, durée de
   conservation), CGU/cookies (le défaut actuel est public).
6. **Scraping avec identifiants des parents = non** : contraire aux CGU du
   portail, stockage de mots de passe tiers, données d'enfants — risque
   juridique disproportionné pour une tête de pont.

## 6 · Risques et parades
| Risque | Probabilité | Impact | Parade |
|---|---|---|---|
| Aucune API/export Agora+ jamais accordé | Élevée | Bloque le passage démo → prod | Adaptateur ; exiger l'interop dans le pilote ; plan B = reprise de données à échéance du marché Infocom'94 |
| Le décideur est Infocom'94, pas la mairie | Élevée | Cycle de vente ×2 | Pitcher la mairie ET le syndicat ; positionner « 13 communes » dès la démo |
| Concurrents installés (Arpège, Berger-Levrault, Abelium, Ciril, Agora+…) avec back-office complet | Certaine | Clone sans back-office = pas achetable | Ne pas concurrencer le back-office : « le meilleur front famille, compatible avec votre gestion » |
| Cycle de vente public long, trésorerie | Élevée | Mois sans encaissement | Pilote < 60 k€ HT, avance 30 %, jalons courts |
| Conformité RGAA/RGPD sous-estimée | Moyenne | Refus DSI/DPO | Tokens + primitives accessibles dès le squelette ; registre de traitements dès la V1 |
| Chiffres inventés dans le pitch (nb d'enfants, coûts) | Moyenne | Crédibilité | Tout chiffre sourcé ou marqué « à confirmer » (règle du projet) |

## 7 · Décisions à valider par l'opérateur AVANT l'analyse de marché

> Se tranchent depuis le cockpit (`/pilotage/cadrage`) — un bouton par option.
> Convention : dernière ligne = `Options : A · B · C — Recommandation : A`.

1. **Stratégie** — (A) démonstrateur premium sur données fictives → pilote
   Villiers → extension Infocom'94 ; (B) surcouche multi-communes branchée sur
   Agora+ (impossible sans accord éditeur) ; (C) éditeur complet
   gestion + portail (2-3 ans, frontal aux incumbents). A est architecturé
   pour devenir B si l'interop est obtenue.
   Options : A — démonstrateur puis pilote · B — surcouche Agora+ · C — éditeur complet — Recommandation : A — démonstrateur puis pilote
2. **Données de la V1** — jeu fictif réaliste (tarifs, QF, calendriers de
   Villiers repris des documents publics) derrière un adaptateur, pour montrer
   avant d'avoir l'API.
   Options : Oui · Non — attendre l'API — Recommandation : Oui
3. **Modèle de revenu** — prestation pilote < 60 k€ HT + maintenance annuelle
   par commune, avance 30 % à la signature ; chiffrage à l'étape 2.
   Options : Oui · Autre modèle (note) — Recommandation : Oui
4. **Marque** — nom neutre réutilisable pour plusieurs communes (le repo
   s'appelle `ville`) plutôt que « Villiers Famille » ; thème par commune.
   Options : Neutre multi-communes · Villiers Famille — Recommandation : Neutre multi-communes
5. **Périmètre back-office V1** — minimal (activités, tarifs, démarches,
   pointage) et non la facturation/régie, qui reste chez l'éditeur de gestion
   tant que l'interop n'est pas signée.
   Options : Minimal · Avec facturation — Recommandation : Minimal
6. **Mesure terrain** — as-tu un accès (parent d'élève, contact mairie,
   Infocom'94) permettant de mesurer la douleur réelle ou d'obtenir la date de
   fin du marché Agora+ ? Sans cela l'étape 2 se limite aux sources publiques.
   Options : Oui — je précise en note · Non, sources publiques seulement
7. **Contraintes** — budget, délai, comptes disponibles (Vercel, base, e-mail),
   ce qui existe déjà : le champ était vide. Réponse en note.
   Options : Aucune contrainte · Contraintes en note

## Sources (datées)
- villiers94.fr — Le Portail Famille ; Inscriptions aux activités périscolaires (consultées le 04/09/2026).
- infocom94.fr/applications/agora — Agora+, 13 communes adhérentes (04/09/2026).
- agoraplus.fr — éditeur, modules, partenaires (Oracle, API.gouv.fr…) (04/09/2026).
- infocom94.agoraplus.fr/villiers — en-têtes HTTP, HTML, `assets/lang/fr.js`, `pck_transversal_objects.global_configs` (relevés le 04/09/2026 05:51 UTC, une requête par ressource).
- plus.transformation.gouv.fr — expérience 4030757 « Impossible de refuser les cookies » (08/10/2023).
- fr.wikipedia.org/wiki/Villiers-sur-Marne — population 2023, écoles (04/09/2026).
- resultats-elections.interieur.gouv.fr — municipales 2026, 94079 (04/09/2026).
- francemarches.com/fiches/seuils ; laviecommunale — seuil 60 000 € HT au 01/04/2026 (décret du 30/12/2025).
- collectivites-locales.gouv.fr — PayFiP ; Légifrance décret 2018-689.
- mairie-bailly.fr — « Évolution du Portail Famille AGORA : version 3 ».
- Péremption : seuils et marchés à re-vérifier tous les 6 mois.
