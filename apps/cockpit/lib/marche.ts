// Analyse de marché — LE VERDICT VIENT DU CODE (score, plafonds, seuils), l'IA
// rédige et argumente. Chaque note porte sa preuve ; sans preuve, elle est
// PLAFONNÉE PAR CODE à 3/10 (jamais par discipline du prompt).
// Calibration versionnée : un seuil qui change rejoue le CALCUL, pas les notes.

export const CALIBRATION = "v1-2026-09-04";

export type Critere = {
  cle: string;
  dimension: string;
  poids: number; // somme = 100
  note: number; // 0-10, telle que l'analyste la propose
  preuve: string | null; // mesure datée ; null = pas de preuve → plafond
  source: string;
  faille: string;
};

export const PLAFOND_SANS_PREUVE = 3;
/** Un feu vert qui engage des semaines exige le palier « solide » (leçon 25bis). */
export const SEUILS = { go: 70, conditionnel: 55 } as const;

export type Verdict = "GO" | "GO conditionnel" | "NO-GO";

export function noteEffective(c: Critere): number {
  const n = Math.max(0, Math.min(10, c.note));
  return c.preuve ? n : Math.min(n, PLAFOND_SANS_PREUVE);
}

export function score(grille: Critere[]): number {
  const poids = grille.reduce((s, c) => s + c.poids, 0);
  if (poids !== 100) throw new Error(`La grille pèse ${poids}, pas 100`);
  return Math.round(grille.reduce((s, c) => s + noteEffective(c) * c.poids, 0) / 10);
}

export function verdictDuScore(s: number): Verdict {
  return s >= SEUILS.go ? "GO" : s >= SEUILS.conditionnel ? "GO conditionnel" : "NO-GO";
}

export type Faille = { titre: string; gravite: "haute" | "moyenne" | "basse"; detail: string; parade: string; paree?: boolean };

/** Une faille HAUTE non PARÉE (parade engagée, pas imaginée) dégrade le verdict d'un cran. */
export function verdictFinal(grille: Critere[], failles: Faille[]): { score: number; brut: Verdict; final: Verdict; degrade: boolean } {
  const s = score(grille);
  const brut = verdictDuScore(s);
  const haute = failles.some((f) => f.gravite === "haute" && !f.paree);
  const final: Verdict = haute && brut === "GO" ? "GO conditionnel" : haute && brut === "GO conditionnel" ? "NO-GO" : brut;
  return { score: s, brut, final, degrade: final !== brut };
}

// ---- P&L B2G par commune et par an (pas de TVA dans la marge : l'éditeur la reverse) ----
export type EntreesPnl = {
  prixAnnuelHT: number; // licence + maintenance + hébergement facturés à la commune
  hebergementAnnuel: number; // Vercel + Neon + Resend + domaine
  supportHeuresParMois: number;
  tauxHoraire: number;
  devInitialHeures: number; // conception + build du pilote
  amortissementAnnees: number; // durée médiane des marchés (48 mois)
  retardPaiementJours: number; // mandatement public
  tauxTresorerie: number; // coût annuel de l'argent immobilisé (ex. 0.06)
};

export type SortiePnl = { chiffre: number; couts: Record<string, number>; margeNette: number; margePct: number; viable: boolean };

/** Seuil de confort SaaS B2G : marge nette ≥ 30 % (doctrine : un profit positif n'est jamais refusé). */
export const MARGE_CONFORT_PCT = 30;

export function pnlCommuneAn(e: EntreesPnl): SortiePnl {
  const couts = {
    hebergement: e.hebergementAnnuel,
    support: e.supportHeuresParMois * 12 * e.tauxHoraire,
    amortissementDev: (e.devInitialHeures * e.tauxHoraire) / e.amortissementAnnees,
    tresorerie: e.prixAnnuelHT * (e.retardPaiementJours / 365) * e.tauxTresorerie,
  };
  const total = Object.values(couts).reduce((s, v) => s + v, 0);
  const margeNette = Math.round(e.prixAnnuelHT - total);
  const margePct = e.prixAnnuelHT ? Math.round((margeNette / e.prixAnnuelHT) * 100) : 0;
  return { chiffre: e.prixAnnuelHT, couts: Object.fromEntries(Object.entries(couts).map(([k, v]) => [k, Math.round(v)])), margeNette, margePct, viable: margeNette > 0 };
}

// ---- Les données de CE projet (mesurées le 04/09/2026 — sources dans ANALYSE_MARCHE.md) ----
export const DEMANDE = [
  { requete: "portail famille", largeur: "FORTE", suggestions: 9 },
  { requete: "espace famille mairie", largeur: "FORTE", suggestions: 9 },
  { requete: "réserver cantine en ligne", largeur: "FORTE", suggestions: 10 },
  { requete: "inscription périscolaire en ligne", largeur: "FORTE", suggestions: 10 },
  { requete: "portail famille agora", largeur: "FORTE", suggestions: 9 },
  { requete: "portail famille villiers sur marne", largeur: "FAIBLE", suggestions: 2 },
  { requete: "portail famille bug", largeur: "FAIBLE", suggestions: 1 },
  { requete: "logiciel portail famille collectivité", largeur: "NULLE", suggestions: 0 },
  { requete: "portail famille ne fonctionne pas", largeur: "NULLE", suggestions: 0 },
] as const;

/** DECP (data.economie.gouv.fr, jeu decp-v3-marches-valides, objet contenant « portail famille »),
 *  45 marchés exploitables sur 52, relevés le 04/09/2026. */
export const MARCHES_DECP = { n: 45, minHT: 5835, q1HT: 35774, medianeHT: 64800, q3HT: 200000, maxHT: 648415, dureeMedianeMois: 48, annualiseMedianeHT: 26880, annualiseQ1HT: 8040, annualiseQ3HT: 50000 } as const;

/** Parts de marché et HHI sur les mêmes DECP (`scripts/mesurer-hhi.mjs`, titulaires par SIRET nommés via Sirene). */
export const CONCURRENCE_DECP = {
  "releveLe": "2026-09-04",
  "exploitables": 43,
  "titulaires": 18,
  "hhiMarches": 1228,
  "hhiMontants": 2089,
  "forme": "fragmenté",
  "partLeaderMarches": 23.3,
  "tete": [
    {
      "siret": "35142130000036",
      "nom": "ARPEGE",
      "marches": 10,
      "partMarches": 23.3,
      "montant": 1393840,
      "partMontant": 25.2
    },
    {
      "siret": "33922000600078",
      "nom": "TEAMNET (SA)",
      "marches": 9,
      "partMarches": 20.9,
      "montant": 1885520,
      "partMontant": 34
    },
    {
      "siret": "42172024400050",
      "nom": "FAMILEA (ABELIUM)",
      "marches": 3,
      "partMarches": 7,
      "montant": 526864,
      "partMontant": 9.5
    },
    {
      "siret": "38873581300056",
      "nom": "TECHNOCARTE",
      "marches": 3,
      "partMarches": 7,
      "montant": 301277,
      "partMontant": 5.4
    },
    {
      "siret": "81122842800017",
      "nom": "MUSHROOM SOFTWARE (MUSHROOM SOFTWARE)",
      "marches": 3,
      "partMarches": 7,
      "montant": 675051,
      "partMontant": 12.2
    },
    {
      "siret": "59205230201514",
      "nom": "KONE",
      "marches": 2,
      "partMarches": 4.7,
      "montant": 21666,
      "partMontant": 0.4
    },
    {
      "siret": "42145531200056",
      "nom": "STRATIS",
      "marches": 2,
      "partMarches": 4.7,
      "montant": 29434,
      "partMontant": 0.5
    },
    {
      "siret": "39825361700045",
      "nom": "AIGA",
      "marches": 1,
      "partMarches": 2.3,
      "montant": 94034,
      "partMontant": 1.7
    }
  ]
} as const;

export const ENTREES_PNL_PILOTE: EntreesPnl = {
  prixAnnuelHT: MARCHES_DECP.annualiseMedianeHT, // mesuré : médiane annualisée des 45 marchés
  hebergementAnnuel: 12 * (20 + 19 + 20) + 15, // HYPOTHÈSE tarifs publics 09/2026 : Vercel Pro 20 $/mois, Neon Launch 19 $/mois, Resend Pro 20 $/mois, domaine ~15 €/an — à re-vérifier
  supportHeuresParMois: 4, // HYPOTHÈSE : 4 h/mois de support et petites évolutions
  tauxHoraire: 60, // HYPOTHÈSE : coût interne horaire
  devInitialHeures: 400, // HYPOTHÈSE : pilote V1 (portail + back-office minimal + PayFIP sandbox)
  amortissementAnnees: 4, // mesuré : durée médiane des marchés = 48 mois
  retardPaiementJours: 30, // règle : délai global de paiement public (30 j)
  tauxTresorerie: 0.06, // HYPOTHÈSE : coût de l'argent immobilisé
};

export const GRILLE: Critere[] = [
  { cle: "demande", dimension: "Demande réelle & durable", poids: 15, note: 8, preuve: "Autocomplétion FR : 5 requêtes FORTES sur 9 (≥ 9 suggestions), dont « réserver cantine en ligne » (10) ; obligation légale de paiement en ligne (décret 2018-689, seuil 5 000 €/an depuis 2022) ; 45 marchés « portail famille » notifiés dans les DECP (2021-2023)", source: "mesurer-demande.mjs 04/09/2026 · DECP · Légifrance", faille: "Demande portée par les COMMUNES (obligation), pas par les parents : le parent ne choisit pas son portail" },
  { cle: "wtp", dimension: "Willingness-to-pay", poids: 15, note: 8, preuve: "DECP : médiane 64 800 € HT / 48 mois (Q1 35 774 · Q3 200 000), soit 26 880 € HT/an annualisé ; procédure adaptée majoritaire", source: "data.economie.gouv.fr decp-v3-marches-valides, 04/09/2026", faille: "Les montants incluent le logiciel de GESTION ; un front seul se vend moins cher" },
  { cle: "moat", dimension: "Moat / différenciation", poids: 10, note: 5, preuve: "Défauts d'Agora+ constatés (AngularJS EOL, franglais en prod, zoom interdit, cookies non conformes) ; API Particulier (QF CAF/MSA, habilitation ~14 j, gratuite) comme brique d'État sous-exploitée", source: "Cadrage §1 · particulier.api.gouv.fr", faille: "Une UX se copie ; le moat réel serait l'interop signée avec Infocom'94 — pas encore acquise" },
  { cle: "unit", dimension: "Économie unitaire (P&L net)", poids: 15, note: 0, preuve: "Calculée par pnlCommuneAn() — voir §4 (note dérivée du P&L)", source: "lib/marche.ts", faille: "Hypothèses de coûts (support, dev) non encore mesurées sur un vrai pilote" },
  { cle: "competition", dimension: "Compétition & saturation", poids: 10, note: 6, preuve: `DECP : ${CONCURRENCE_DECP.titulaires} titulaires distincts sur ${CONCURRENCE_DECP.exploitables} marchés ; HHI ${CONCURRENCE_DECP.hhiMarches} (nb) / ${CONCURRENCE_DECP.hhiMontants} (montants) = marché ${CONCURRENCE_DECP.forme} ; leader ${CONCURRENCE_DECP.tete[0]?.nom} ${CONCURRENCE_DECP.partLeaderMarches} % des marchés, ${CONCURRENCE_DECP.tete[1]?.nom} ${CONCURRENCE_DECP.tete[1]?.partMarches} %`, source: "scripts/mesurer-hhi.mjs, DECP + Sirene, " + CONCURRENCE_DECP.releveLe, faille: "Deux titulaires prennent ~44 % des marchés ; chacun vend gestion + portail — un front seul entre par la porte du syndicat, pas par appel d'offres" },
  { cle: "ops", dimension: "Opérations & risque (plateforme, réglementation)", poids: 10, note: 4, preuve: "Commande publique (< 60 k€ HT sans procédure depuis 01/04/2026) ; PayFIP obligatoire ; RGAA + RGPD mineurs ; dépendance à un accord d'interopérabilité Agora+/Infocom'94", source: "Cadrage §5", faille: "Sans interop, le produit reste un démonstrateur : risque HAUTE (contre-analyse)" },
  { cle: "ltv", dimension: "Récurrence / LTV", poids: 10, note: 9, preuve: "Durée médiane des marchés : 48 mois ; renouvellement par marché négocié sans publicité fréquent (titulaire en place)", source: "DECP 04/09/2026", faille: "La même inertie protège l'incumbent : sortir Agora+ demande une fenêtre" },
  { cle: "saison", dimension: "Saisonnalité & fenêtre de lancement", poids: 5, note: 6, preuve: "Mandat municipal 2026-2032 (élection mars 2026) ; pic d'usage à la rentrée (inscriptions du 01/06 au 31/08) ; budgets votés en fin d'année", source: "resultats-elections.interieur.gouv.fr · villiers94.fr", faille: "Date de fin du marché Infocom'94 M2015/02-Enf inconnue (backlog)" },
  { cle: "acces", dimension: "Accès au décideur / tête de pont (B2G)", poids: 10, note: 6, preuve: null, source: "Décision 6 du cadrage (contact mairie / Infocom'94 / parent) non tranchée au 04/09/2026", faille: "Sans porte d'entrée nommée, le cycle B2G est indéfini : note plafonnée par code" },
];

export const FAILLES: Faille[] = [
  { titre: "Aucune API/export Agora+ accordé", gravite: "haute", detail: "Le front seul ne se vend pas sans lien à la gestion (facturation, pointage). Agora Plus n'a aucun intérêt à ouvrir son backend à un remplaçant.", parade: "Exiger l'interopérabilité dans le pilote (portée par Infocom'94, client de l'éditeur) ; plan B = reprise de données à l'échéance du marché ; adaptateur isolant le front", paree: false /* passe à true quand l'interop est ÉCRITE dans un pilote signé */ },
  { titre: "Le décideur est le syndicat, pas la commune", gravite: "moyenne", detail: "Infocom'94 achète pour 13 communes ; Villiers seule ne peut pas remplacer le portail.", parade: "Pitcher le syndicat avec la mairie comme sponsor ; positionner « 13 communes » dès la démo" },
  { titre: "Marché fragmenté sans mesure de parts", gravite: "moyenne", detail: "≥ 9 éditeurs installés avec back-office complet ; la forme du moat (HHI) n'est pas mesurée.", parade: "Ne pas concurrencer le back-office ; mesurer les parts sur les DECP (titulaires par SIRET) à l'étape 3" },
];

/** Grille avec la note d'économie unitaire DÉRIVÉE du P&L (jamais saisie à la main). */
export function grilleCalculee(): { grille: Critere[]; pnl: SortiePnl } {
  const pnl = pnlCommuneAn(ENTREES_PNL_PILOTE);
  const noteUnit = !pnl.viable ? 0 : pnl.margePct >= 50 ? 9 : pnl.margePct >= MARGE_CONFORT_PCT ? 7 : pnl.margePct >= 15 ? 5 : 3;
  const grille = GRILLE.map((c) => (c.cle === "unit" ? { ...c, note: noteUnit, preuve: `${c.preuve} : marge nette ${pnl.margeNette} € (${pnl.margePct} %) sur ${pnl.chiffre} € HT/an` } : c));
  return { grille, pnl };
}

export function analyse() {
  const { grille, pnl } = grilleCalculee();
  const v = verdictFinal(grille, FAILLES);
  const conditions = [
    "Décision 6 du cadrage tranchée avec un contact NOMMÉ (mairie, Infocom'94 ou parent d'élève)",
    "Interopérabilité (API ou export Agora+) écrite dans le périmètre du pilote, ou date de fin du marché Infocom'94 connue",
  ];
  return { calibration: CALIBRATION, seuils: SEUILS, grille, pnl, failles: FAILLES, demande: DEMANDE, marches: MARCHES_DECP, ...v, conditions };
}
