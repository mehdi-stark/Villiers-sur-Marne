# Analyse de marché — ville (2026-09-04) — AVANT tout code métier

> Doctrine : `TRAME/0-socle/regles/DOCTRINE_MARCHE.md`. Demande MESURÉE (jamais
> jugée), notes prouvées ou plafonnées PAR CODE (`lib/marche.ts`, tests
> `scripts/tests/marche.test.ts`), contre-analyse adversariale, sources datées.
> Le verdict s'affiche et se tranche dans le cockpit (`/pilotage/marche`).

## 1 · Demande mesurée (autocomplétion Google FR, `mesurer-demande.mjs`, 04/09/2026)
| Requête / signal | Pays | Mesure | Lecture |
|---|---|---|---|
| portail famille | FR | FORTE — 9 suggestions (paris, bry-sur-marne, nogent-sur-marne, fontenay-sous-bois…) | Le terme est installé ; les gens cherchent LEUR commune |
| espace famille mairie | FR | FORTE — 9 (montreuil, bagneux, gennevilliers, courbevoie) | Idem, synonyme |
| réserver cantine en ligne | FR | FORTE — 10 (réservation / inscription cantine en ligne…) | Le geste n° 1 du parent est cherché tel quel |
| inscription périscolaire en ligne | FR | FORTE — 10 | Idem |
| portail famille agora | FR | FORTE — 9 (clichy-sous-bois, agora plus, tampon, toulon) | L'incumbent a une empreinte nationale |
| portail famille villiers sur marne | FR | FAIBLE — 2 | Une commune = une longue traîne ; aucun signal de douleur local |
| portail famille bug / ne fonctionne pas | FR | FAIBLE 1 / NULLE 0 | La douleur ne se cherche pas sur Google (elle s'appelle au 01 49 41 28 00) |
| logiciel portail famille collectivité | FR | NULLE — 0 | Les acheteurs publics ne cherchent pas sur Google : ils passent par UGAP, marchés, syndicats |

Signal légal (non optionnel) : décret 2018-689 — paiement en ligne obligatoire
pour toute collectivité encaissant ≥ 5 000 €/an (depuis le 01/01/2022) ; PayFIP
gratuit pour la collectivité (collectivites-locales.gouv.fr).

## 2 · Marché et concurrence — la FORME du moat
- **Acheteurs** : ~1 050 communes ≥ 10 000 habitants en France (97 % des ~34 900 communes
  sont sous 10 000 — OFGL/illiwap 2026) + intercommunalités et syndicats (Infocom'94 = 13 communes).
- **Leaders** : Arpège (Concerto / Espace Citoyens), Berger-Levrault (BL.enfance / BL.citoyens,
  app « BL Portail Famille » : 4,35/5 sur 1 057 avis App Store), Abelium (Domino), Ciril,
  Agora Plus (Agora Famille, app store sortie 26/03/2026 : 0 avis), Docaposte (Axel),
  Technocarte (250 collectivités), Aiga (6 000 clients), Sigec. **Part du leader et HHI MESURÉS** (`scripts/mesurer-hhi.mjs`, DECP + Sirene, 2026-09-04) :
  43 marchés, 18 titulaires distincts, **HHI 1228** (nb de marchés) / 2089 (montants)
  → marché **fragmenté** (seuils DOJ : < 1 500 fragmenté, > 2 500 concentré). Tête : ARPEGE 23.3 % des marchés (25.2 % des montants) ; TEAMNET (SA) 20.9 % des marchés (34 % des montants) ; FAMILEA (ABELIUM) 7 % des marchés (9.5 % des montants) ; TECHNOCARTE 7 % des marchés (5.4 % des montants) ; MUSHROOM SOFTWARE (MUSHROOM SOFTWARE) 7 % des marchés (12.2 % des montants).
  Lecture : deux éditeurs (Arpège, Teamnet/Docaposte) prennent ~44 % des marchés, chacun en vendant
  gestion + portail ; les 16 autres se partagent le reste — un nouvel entrant n'affronte pas un
  winner-take-all, mais il n'entre pas par appel d'offres sans back-office : il entre par la porte
  d'un syndicat ou d'une commune sponsor.
- **Plaintes minées** : côté Villiers, constats directs (AngularJS EOL, franglais en prod,
  zoom interdit, cookies non conformes — plainte Services Publics+ 2023 sans réponse).
  Côté national : l'App Store ne renvoie aucun avis récent exploitable via le flux RSS
  (0 entrée pour BL et Agora) — **le wedge n'est pas encore miné sur des plaintes de parents**.
- **Tête de pont** : Villiers-sur-Marne (mandat 2026-2032 fraîchement renouvelé), puis les
  13 communes d'Infocom'94 avec le même backend Agora+ — si l'interopérabilité est obtenue.
- **Brique d'État sous-exploitée** : API Particulier (quotient familial CAF/MSA, habilitation
  ~14 jours, gratuite) — un portail neuf peut l'intégrer nativement.

## 3 · Grille pondérée (somme 100 — calculée dans `lib/marche.ts`, affichée dans le cockpit)
| Dimension | Poids | Note effective | Preuve | Faille |
|---|---|---|---|---|
| Demande réelle & durable | 15 | 8 | 5 requêtes FORTES/9 ; obligation légale ; 45 marchés DECP | La demande est celle des communes, pas des parents |
| Willingness-to-pay | 15 | 8 | DECP : médiane 64 800 € HT / 48 mois, 26 880 € HT/an annualisé | Montants = gestion + portail ; un front seul vaut moins |
| Moat / différenciation | 10 | 5 | Défauts d'Agora+ constatés ; API Particulier | Une UX se copie ; le moat réel = interop signée |
| Économie unitaire (P&L net) | 15 | 9 (dérivée du P&L) | marge nette 17 144 € (64 %) sur 26 880 € HT/an | Coûts = hypothèses tant qu'aucun pilote n'a tourné |
| Compétition & saturation | 10 | 6 | DECP : 18 titulaires, HHI 1228 (fragmenté), leader Arpège 23.3 % | Deux titulaires ≈ 44 % ; chacun vend gestion + portail |
| Opérations & risque | 10 | 4 | commande publique, PayFIP, RGAA/RGPD, dépendance interop | Sans interop = démonstrateur |
| Récurrence / LTV | 10 | 9 | marchés de 48 mois, renouvellements négociés | La même inertie protège l'incumbent |
| Saisonnalité & fenêtre | 5 | 6 | mandat 2026-2032, rentrée, budgets en fin d'année | Fin du marché Infocom'94 inconnue |
| Accès au décideur / tête de pont (B2G) | 10 | **3 (plafonnée)** | décision 6 du cadrage non tranchée | Sans porte d'entrée, cycle indéfini |

**Score : 68/100** (calibration `v1-2026-09-04` ; GO ≥ 70, GO conditionnel ≥ 55).

## 4 · P&L par code (par commune et par an — `pnlCommuneAn`, testé)
prix HT annuel **26 880 €** (médiane annualisée mesurée) → hébergement 723 € (HYPOTHÈSE :
Vercel Pro 20 $/mois + Neon Launch 19 $/mois + Resend Pro 20 $/mois + domaine) → support
2 880 € (HYPOTHÈSE 4 h/mois × 60 €) → amortissement du pilote 6 000 €/an (HYPOTHÈSE 400 h × 60 €
sur 4 ans) → trésorerie 133 € (30 j de mandatement à 6 %) → **marge nette 17 144 € = 64 %**
(confort ≥ 30 %). Pas de TVA dans la marge (reversée). Pas de CAC mesuré : en B2G l'acquisition
est du temps de vente (réunions, mémoire technique) — à chiffrer au premier pilote.
Doctrine commerce : aucun pilote rentable refusé, même < 60 k€ ; avance 30 % pour ne pas vendre à crédit.

## 5 · Contre-analyse adversariale
| Faille | Gravité | Parade |
|---|---|---|
| **Aucune API/export Agora+ accordé** — le front seul ne se vend pas sans lien à la gestion | **haute, non parée** | Interop écrite dans le pilote (portée par Infocom'94) ; plan B = reprise de données à l'échéance ; adaptateur |
| Le décideur est le syndicat (13 communes), pas la commune | moyenne | Pitcher le syndicat, mairie sponsor |
| Marché fragmenté sans mesure de parts | moyenne | Mesurer sur les DECP avant l'architecture |

## 6 · Verdict (calculé) et fenêtre de lancement
**Score 68/100 · verdict brut GO conditionnel · dégradé à NO-GO** par la faille haute non parée.
Lecture honnête : **le marché existe et paie (demande, WTP, LTV prouvées) ; ce qui manque
n'est pas le marché, c'est la PORTE** — l'accès au décideur et l'interopérabilité. Dès que la
faille est parée (`paree: true` quand l'interop est écrite dans un pilote signé) le calcul,
sans changer une note, rend **GO conditionnel** ; avec un contact nommé (dernière note
plafonnée, « accès au décideur »), il atteint GO (≥ 70). Conditions à remplir : voir
le cockpit. Fenêtre : budgets 2027 votés en décembre 2026 ; rentrée = pic d'usage.

## Sources (datées, péremption)
- `mesurer-demande.mjs` — 9 requêtes, hl=fr gl=fr, 04/09/2026 (péremption 6 mois).
- data.economie.gouv.fr, jeu `decp-v3-marches-valides`, `search(objet,"portail famille")`, 52 marchés dont 45 exploitables, relevés le 04/09/2026 (montants HT notifiés 2021-2023).
- `scripts/mesurer-hhi.mjs` — DECP + recherche-entreprises.api.gouv.fr (noms par SIRET), 04/09/2026.
- itunes.apple.com/lookup — BL Portail Famille id1497351725 (4,35 / 1 057 avis) ; Agora Portail Famille id6758836291 (sortie 26/03/2026, 0 avis) — 04/09/2026.
- particulier.api.gouv.fr — cas d'usage « tarification municipale enfance » (habilitation ~14 j, gratuit).
- Légifrance décret 2018-689 ; collectivites-locales.gouv.fr (PayFiP) ; francemarches.com (seuil 60 k€ HT au 01/04/2026).
- illiwap.com / OFGL — 97 % des communes < 10 000 habitants (2026).
- Sites éditeurs : arpege.fr, berger-levrault.com, agoraplus.fr, technocarte (via tool-advisor), aiga, sigec.fr — 04/09/2026.
- Tarifs d'hébergement (Vercel, Neon, Resend) : HYPOTHÈSES à re-vérifier avant tout engagement.
