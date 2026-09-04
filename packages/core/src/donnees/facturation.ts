import type { Activite, Enfant, Famille, Reservation, Tranche } from "./types";
import { tarif, tarifNonReserve, trancheDe } from "./regles";

// FACTURATION calculée depuis les pointages — règles de la grille 2025-2026 et du guide :
// - présence réservée → tarif de la tranche ;
// - repas réservé non consommé (absence) → facturé au tarif, sauf cas exonérés (maladie
//   justifiée, sortie, classe de découverte) — l'exonération est une donnée d'entrée ;
// - présence NON réservée → 2 × le tarif (11,02 € pour un repas sans QF calculé) ;
// - forfait mensuel : dès N fréquentations dans le mois, le forfait remplace les unités ;
// - une réservation annulée ne coûte rien.
export type LigneCalculee = { enfantId: string; activiteId: string; date: string; motif: "presence" | "absence_facturee" | "non_reserve"; montant: number };
export type FactureCalculee = { periode: string; tranche: Tranche; lignes: LigneCalculee[]; forfaits: { enfantId: string; activiteId: string; frequentations: number; montant: number; remplace: number }[]; total: number };

export function calculerFacture(p: { famille: Famille; enfants: Enfant[]; activites: Activite[]; reservations: Reservation[]; periode: string; exonerees?: Set<string> }): FactureCalculee {
  const tranche = trancheDe(p.famille.quotientFamilial, p.famille.exterieur);
  const qfCalcule = p.famille.quotientFamilial !== null;
  const cle = (r: { enfantId: string; activiteId: string; date: string }) => `${r.enfantId}|${r.activiteId}|${r.date}`;
  const lignes: LigneCalculee[] = [];
  const parEnfantActivite = new Map<string, LigneCalculee[]>();
  for (const r of p.reservations.filter((r) => r.date.startsWith(p.periode) && p.enfants.some((e) => e.id === r.enfantId))) {
    const a = p.activites.find((x) => x.id === r.activiteId);
    if (!a) continue;
    let l: LigneCalculee | null = null;
    if (r.etat === "presence") l = { enfantId: r.enfantId, activiteId: a.id, date: r.date, motif: "presence", montant: tarif(a, tranche) };
    else if (r.etat === "absence" && a.prevenance.joursAvant > 0 && !p.exonerees?.has(cle(r))) l = { enfantId: r.enfantId, activiteId: a.id, date: r.date, motif: "absence_facturee", montant: tarif(a, tranche) };
    if (!l) continue;
    lignes.push(l);
    const k = `${l.enfantId}|${l.activiteId}`;
    parEnfantActivite.set(k, [...(parEnfantActivite.get(k) ?? []), l]);
  }
  // Présences hors réservation : marquées par l'agent comme presence sans réservation préalable → la source les distingue par `etat: presence` sur une date sans réservation ; ici, on considère qu'une présence sur une activité à réservation SANS ligne réservée dans les fixtures est « non réservée » si p.reservations la signale via motif — simplification : géré en amont (journal_reservations.avant === null).
  const forfaits: FactureCalculee["forfaits"] = [];
  for (const [k, ls] of parEnfantActivite) {
    const a = p.activites.find((x) => x.id === ls[0]!.activiteId)!;
    if (!a.forfaitMensuel) continue;
    const n = ls.filter((l) => l.motif === "presence").length;
    if (n >= a.forfaitMensuel.declencheA) {
      const remplace = ls.filter((l) => l.motif === "presence").reduce((s, l) => s + l.montant, 0);
      forfaits.push({ enfantId: k.split("|")[0]!, activiteId: a.id, frequentations: n, montant: a.forfaitMensuel.montants[tranche - 1]!, remplace });
    }
  }
  const unites = lignes.reduce((s, l) => s + l.montant, 0);
  const total = unites - forfaits.reduce((s, f) => s + f.remplace, 0) + forfaits.reduce((s, f) => s + f.montant, 0);
  return { periode: p.periode, tranche, lignes, forfaits, total };
}

/** Une présence sans réservation préalable (l'enfant a mangé sans réserver) : 2 × le tarif, ou 11,02 € sans QF. */
export function montantNonReserve(a: Activite, famille: Famille): number {
  return tarifNonReserve(a, trancheDe(famille.quotientFamilial, famille.exterieur), famille.quotientFamilial !== null);
}
