import type { Activite, Enfant, Facture, Famille, Reservation, SourceDonnees } from "./types";
import { tarif, trancheDe } from "./regles";
import { fusionner, reservationsPersistees } from "./reservations";

// La couche persistée (base) se remplace en test unitaire : la fixture reste pure, la base reste vraie ailleurs.
let persistance: (enfantId: string, du: string, au: string) => Promise<Reservation[]> = reservationsPersistees;
export function definirPersistance(fn: typeof persistance) { persistance = fn; }

// SOURCE FICTIVE — le démonstrateur tourne dessus tant qu'aucune interop Agora+ n'existe.
// RÉEL (sources datées) : écoles et accueils (villiers94.fr, accueils périscolaires, 04/09/2026),
// grille tarifaire 2025-2026 (PDF du 01/07/2025), délais (Guide du périscolaire 2025-2026).
// FICTIF (jamais présenté comme réel) : familles, enfants, réservations, factures.

export const ECOLES = [
  { nom: "Charles Péguy", adresse: "17, rue Frédéric Passy", niveau: "elementaire" },
  { nom: "Charles Gautier", adresse: "3, rue Albert Schweitzer", niveau: "elementaire" },
  { nom: "Charles Perrault", adresse: "25, rue du Maréchal Foch", niveau: "maternelle" },
  { nom: "Édouard Herriot Maternelle", adresse: "10, avenue des Luats", niveau: "maternelle" },
  { nom: "Jean Jaurès Maternelle", adresse: "7, avenue de l'Europe", niveau: "maternelle" },
  { nom: "M. & J. Renon Maternelle", adresse: "2, route de Combault", niveau: "maternelle" },
  { nom: "J. et M. Dudragne Maternelle", adresse: "9-11, rue Montrichard", niveau: "maternelle" },
  { nom: "J. et M. Dudragne Élémentaire", adresse: "rue Maurice Dudragne", niveau: "elementaire" },
  { nom: "Albert Camus", adresse: "2, avenue Nelson Mandela", niveau: "elementaire" },
  { nom: "Simone Veil", adresse: "1, avenue Nelson Mandela", niveau: "maternelle" },
  { nom: "Léon Dauer", adresse: "8, rue Maurice Berteaux", niveau: "elementaire" },
  { nom: "Jules Ferry", adresse: "3, rue Jules Ferry", niveau: "elementaire" },
  { nom: "Françoise Dolto / É. Herriot Élémentaire", adresse: "8, avenue des Luats", niveau: "elementaire" },
  { nom: "Jean Jaurès Élémentaire", adresse: "7, avenue de l'Europe", niveau: "elementaire" },
  { nom: "M. et J. Renon Élémentaire", adresse: "2, route de Combault", niveau: "elementaire" },
] as const;

const SRC_TARIFS = "Tarifs périscolaires 2025-2026 (PDF villiers94.fr, 01/07/2025)";
const SRC_GUIDE = "Guide du périscolaire 2025-2026 (PDF villiers94.fr)";
const c = (...euros: number[]) => euros.map((e) => Math.round(e * 100));

export const ACTIVITES: Activite[] = [
  { id: "cantine", type: "cantine", libelle: "Pause méridienne (repas)", horaires: "11h45 – 13h45", tarifsParTranche: c(0.99, 1.67, 2.66, 3.42, 3.87, 4.28, 4.79, 5.16, 5.51, 6.73), prevenance: { joursAvant: 7, type: "francs", heureLimite: "23:59", source: `${SRC_GUIDE} : « réservés au plus tard sept jours francs avant la date de repas »` }, joursServis: [1, 2, 4, 5], public: "tous" },
  { id: "matin", type: "accueil_matin", libelle: "Accueil du matin", horaires: "7h30 – 8h20", tarifsParTranche: c(2.88, 3.29, 3.54, 3.76, 4.16, 4.52, 4.74, 4.97, 5.2, 6.72), forfaitMensuel: { montants: c(17.97, 20.05, 21.62, 23.29, 25.11, 27.01, 29.09, 30.48, 31.85, 40.09), declencheA: 7 }, prevenance: { joursAvant: 0, type: "francs", heureLimite: "07:30", source: `${SRC_TARIFS} : sans réservation, inscription annuelle ; forfait dès 7 fréquentations` }, joursServis: [1, 2, 4, 5], public: "tous" },
  { id: "soir-mat", type: "accueil_soir", libelle: "Accueil du soir (maternelle)", horaires: "16h30 – 18h30", tarifsParTranche: c(5.24, 5.8, 6.37, 6.93, 7.5, 8.02, 8.53, 9.1, 9.67, 11.93), forfaitMensuel: { montants: c(25.81, 28.49, 30.81, 33.25, 35.81, 38.53, 41.14, 43.6, 46.07, 57.03), declencheA: 5 }, prevenance: { joursAvant: 0, type: "francs", heureLimite: "16:30", source: `${SRC_TARIFS} : sans réservation ; forfait dès 5 fréquentations` }, joursServis: [1, 2, 4, 5], public: "maternelle" },
  { id: "etude", type: "etude", libelle: "Étude surveillée (élémentaire)", horaires: "16h30 – 18h00", tarifsParTranche: c(0.47, 0.51, 0.58, 0.63, 0.69, 0.75, 0.81, 0.87, 0.93, 1.72), forfaitMensuel: { montants: c(17.97, 19.41, 20.96, 22.41, 23.81, 25.45, 27.07, 28.45, 29.82, 34.97), declencheA: 1 }, prevenance: { joursAvant: 0, type: "francs", heureLimite: "16:30", source: SRC_TARIFS }, joursServis: [1, 2, 4, 5], public: "elementaire" },
  { id: "alsh-mercredi", type: "alsh_mercredi_journee", libelle: "Accueil de loisirs — mercredi journée (repas compris)", horaires: "7h30 – 18h30", tarifsParTranche: c(3.64, 4.97, 6.59, 8.28, 10.07, 12.03, 13.42, 14.65, 15.86, 20.16), prevenance: { joursAvant: 2, type: "francs", heureLimite: "23:59", source: `${SRC_GUIDE} : réservation ≤ 24 h avant, annulation/modification 48 h avant (la page web dit « 7 jours francs » — écart à trancher avec la ville)` }, joursServis: [3], public: "tous" },
  { id: "alsh-mercredi-matin", type: "alsh_mercredi_matin", libelle: "Accueil de loisirs — mercredi matin (repas compris)", horaires: "7h30 – 13h45", tarifsParTranche: c(2.31, 3.32, 4.62, 5.84, 6.96, 8.15, 9.11, 9.91, 10.68, 13.45), prevenance: { joursAvant: 2, type: "francs", heureLimite: "23:59", source: SRC_GUIDE }, joursServis: [3], public: "tous" },
  { id: "alsh-mercredi-am", type: "alsh_mercredi_apres_midi", libelle: "Accueil de loisirs — mercredi après-midi (sans repas)", horaires: "13h30 – 18h30", tarifsParTranche: c(1.33, 1.65, 1.96, 2.43, 3.09, 3.88, 4.31, 4.74, 5.18, 6.72), prevenance: { joursAvant: 2, type: "francs", heureLimite: "23:59", source: SRC_GUIDE }, joursServis: [3], public: "tous" },
];

// ---- FICTIF : deux familles-témoins pour la démo (aucune donnée réelle) ----
const FAMILLES: Famille[] = [
  { id: "fam-demo-1", nom: "Famille Témoin A", email: "temoin-a@exemple.invalid", quotientFamilial: 812, exterieur: false, communeId: "villiers-sur-marne" },
  { id: "fam-demo-2", nom: "Famille Témoin B", email: "temoin-b@exemple.invalid", quotientFamilial: null, exterieur: false, communeId: "villiers-sur-marne" },
];
const ENFANTS: Enfant[] = [
  { id: "enf-1", familleId: "fam-demo-1", prenom: "Enfant 1", naissance: "2019-03-12", ecole: "Simone Veil", classe: "GS" },
  { id: "enf-2", familleId: "fam-demo-1", prenom: "Enfant 2", naissance: "2016-09-30", ecole: "Albert Camus", classe: "CM1" },
  { id: "enf-3", familleId: "fam-demo-2", prenom: "Enfant 3", naissance: "2018-01-05", ecole: "Jules Ferry", classe: "CP" },
];

/** Réservations fictives : cantine les lundi/mardi/jeudi/vendredi de septembre 2026, ALSH un mercredi sur deux. */
function reservationsFictives(enfantId: string): Reservation[] {
  const out: Reservation[] = [];
  for (let j = 1; j <= 30; j++) {
    const d = new Date(Date.UTC(2026, 8, j));
    const jour = d.getUTCDay();
    const iso = d.toISOString().slice(0, 10);
    if ([1, 2, 4, 5].includes(jour)) out.push({ enfantId, activiteId: "cantine", date: iso, etat: j < 4 ? "presence" : "reservee" });
    if (jour === 3 && Math.floor(j / 7) % 2 === 0) out.push({ enfantId, activiteId: "alsh-mercredi", date: iso, etat: "reservee" });
  }
  return out;
}

function facturesFictives(familleId: string): Facture[] {
  const fam = FAMILLES.find((f) => f.id === familleId)!;
  const tranche = trancheDe(fam.quotientFamilial, fam.exterieur);
  const enfants = ENFANTS.filter((e) => e.familleId === familleId);
  const lignes = enfants.flatMap((e) => reservationsFictives(e.id).filter((r) => r.etat === "presence").map((r) => ({ enfantId: e.id, activiteId: r.activiteId, date: r.date, montant: tarif(ACTIVITES.find((a) => a.id === r.activiteId)!, tranche) })));
  const montant = lignes.reduce((s, l) => s + l.montant, 0);
  return montant ? [{ id: `fac-${familleId}-2026-09`, familleId, periode: "2026-09", montant, etat: "a_payer", echeance: "2026-10-31", lignes }] : [];
}

export const sourceFictive: SourceDonnees = {
  nom: "fictif",
  disponible: async () => ({ ok: true }),
  famille: async (id) => FAMILLES.find((f) => f.id === id) ?? null,
  enfants: async (familleId) => ENFANTS.filter((e) => e.familleId === familleId),
  activites: async () => ACTIVITES,
  // Fixture + écritures persistées (réservations du parent, pointages de l'agent).
  reservations: async (enfantId, du, au) => fusionner(reservationsFictives(enfantId).filter((r) => r.date >= du && r.date <= au), await persistance(enfantId, du, au)),
  factures: async (familleId) => facturesFictives(familleId),
};

export const FICTIF_STATS = { familles: FAMILLES.length, enfants: ENFANTS.length, activites: ACTIVITES.length, ecoles: ECOLES.length };
