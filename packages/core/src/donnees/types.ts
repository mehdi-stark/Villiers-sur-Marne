// Modèle métier du portail famille — le strict commun à toutes les sources
// (fictive, export Agora+, API). Les montants sont en centimes d'euro.

/** 1-9 = tranches de quotient familial de la commune ; 10 = extérieurs. */
export type Tranche = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type Famille = { id: string; nom: string; email: string; quotientFamilial: number | null; exterieur: boolean; communeId: string };

export type Enfant = { id: string; familleId: string; prenom: string; naissance: string; ecole: string; classe: string };

export type TypeActivite = "cantine" | "accueil_matin" | "accueil_soir" | "etude" | "alsh_mercredi_journee" | "alsh_mercredi_matin" | "alsh_mercredi_apres_midi" | "alsh_vacances";

/** Délai de prévenance : modification possible jusqu'à `joursAvant` jours
 *  (ouvrés ou francs) avant la date, à `heureLimite` (heure de Paris). */
export type Activite = {
  id: string;
  type: TypeActivite;
  libelle: string;
  horaires: string;
  tarifsParTranche: number[]; // 10 valeurs en centimes, index = tranche − 1 (grille 2025-2026)
  forfaitMensuel?: { montants: number[]; declencheA: number }; // forfait dès N fréquentations dans le mois
  prevenance: { joursAvant: number; type: "ouvres" | "francs"; heureLimite: string; source: string };
  joursServis: number[]; // 1 = lundi … 5 = vendredi ; 3 seul = mercredi
  public: "maternelle" | "elementaire" | "tous";
};

export type EtatReservation = "reservee" | "annulee" | "presence" | "absence";
export type Reservation = { enfantId: string; activiteId: string; date: string; etat: EtatReservation };

export type LigneFacture = { enfantId: string; activiteId: string; date: string; montant: number };
export type Facture = { id: string; familleId: string; periode: string; montant: number; etat: "a_payer" | "payee"; echeance: string; lignes: LigneFacture[] };

export type SourceDonnees = {
  nom: "fictif" | "export-agora" | "api-agora";
  disponible: () => Promise<{ ok: true } | { ok: false; cause: string }>;
  famille: (id: string) => Promise<Famille | null>;
  familles: () => Promise<Famille[]>;
  enfants: (familleId: string) => Promise<Enfant[]>;
  activites: () => Promise<Activite[]>;
  reservations: (enfantId: string, du: string, au: string) => Promise<Reservation[]>;
  factures: (familleId: string) => Promise<Facture[]>;
};
