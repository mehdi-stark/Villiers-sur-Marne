import type { Activite, Tranche } from "./types";

// Règles PURES (testées) : le verdict de délai et le tarif viennent du code,
// jamais d'un texte. « Contactez les services » n'est jamais une réponse.
// Grille RÉELLE : « Tarifs des prestations périscolaires et extrascolaires
// 2025-2026 », Ville de Villiers-sur-Marne, à compter du 01/07/2025
// (villiers94.fr/wp-content/uploads/2025/06/tarifs-periscolaires-2025-2026.pdf).

const JOUR_MS = 86_400_000;

function estOuvre(d: Date): boolean {
  const j = d.getUTCDay();
  return j >= 1 && j <= 5;
}

/** Décalage Paris/UTC en heures (règle UE : dernier dimanche de mars → dernier dimanche d'octobre). */
export function decalageParis(d: Date): number {
  const an = d.getUTCFullYear();
  const dernierDimanche = (mois: number) => { const fin = new Date(Date.UTC(an, mois + 1, 0)); return new Date(Date.UTC(an, mois, fin.getUTCDate() - fin.getUTCDay(), 1)); };
  return d >= dernierDimanche(2) && d < dernierDimanche(9) ? 2 : 1;
}

/** Date limite de modification : N jours (ouvrés ou francs) avant `date`, à `heureLimite` (Paris). */
export function dateLimite(activite: Activite, dateISO: string): Date {
  let d = new Date(`${dateISO}T00:00:00Z`);
  let restants = activite.prevenance.joursAvant;
  while (restants > 0) {
    d = new Date(d.getTime() - JOUR_MS);
    if (activite.prevenance.type === "francs" || estOuvre(d)) restants--;
  }
  const [h, m] = activite.prevenance.heureLimite.split(":").map(Number);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), (h ?? 0) - decalageParis(d), m ?? 0));
}

export type VerdictDelai = { possible: boolean; jusquA: Date; libelle: string };
const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

/** Peut-on encore réserver/annuler cette activité à cette date, maintenant ? Le libellé dit JUSQU'À QUAND. */
export function verdictDelai(activite: Activite, dateISO: string, maintenant: Date): VerdictDelai {
  const limite = dateLimite(activite, dateISO);
  const possible = maintenant < limite;
  return { possible, jusquA: limite, libelle: possible ? `Modifiable jusqu'au ${fmt.format(limite)} (heure de Paris)` : `Délai dépassé depuis le ${fmt.format(limite)} — l'Espace Accueil et Facturation peut encore aider au 01 49 41 28 00` };
}

/** Tranches de quotient familial 2025-2026 (10 = extérieurs à la commune). Sans QF calculé : tranche 9. */
export const BORNES_QF: { tranche: Tranche; max: number }[] = [
  { tranche: 1, max: 230 }, { tranche: 2, max: 287 }, { tranche: 3, max: 381 }, { tranche: 4, max: 575 }, { tranche: 5, max: 748 },
  { tranche: 6, max: 883 }, { tranche: 7, max: 977 }, { tranche: 8, max: 1250 }, { tranche: 9, max: Infinity },
];
export const TRANCHE_SANS_QF: Tranche = 9;

export function trancheDe(qf: number | null, exterieur = false): Tranche {
  if (exterieur) return 10;
  if (qf === null) return TRANCHE_SANS_QF;
  return BORNES_QF.find((b) => qf <= b.max)!.tranche;
}

export function tarif(activite: Activite, tranche: Tranche): number {
  return activite.tarifsParTranche[tranche - 1]!;
}

/** Prestation non réservée : 2 × le tarif du quotient (grille 2025-2026) ; repas non réservé ET QF non calculé : 11,02 €. */
export function tarifNonReserve(activite: Activite, tranche: Tranche, qfCalcule: boolean): number {
  if (activite.type === "cantine" && !qfCalcule) return 1102;
  return 2 * tarif(activite, tranche);
}

export const euros = (centimes: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(centimes / 100);
