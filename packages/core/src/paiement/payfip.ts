// PayFIP (DGFiP) — le SEUL moyen de paiement légal pour une régie. Le formulaire TIPI
// se construit par URL : numcli (numéro client de la régie, délivré par la DGFiP),
// exer (exercice), refdet (référence de la dette), montant (centimes), mel, urlcl
// (retour), objet, saisie (T = test, M = manuel, A = automatique).
// Sans PAYFIP_NUMCLI, on ne fabrique PAS d'URL : c'est l'irréductible (compte de la régie).
export type DemandePayfip = { refdet: string; montantCentimes: number; email: string; objet: string; urlRetour: string; exercice?: number };

export function payfipDisponible(): { ok: true; numcli: string; saisie: "T" | "M" } | { ok: false; cause: string } {
  const numcli = process.env.PAYFIP_NUMCLI;
  if (!numcli) return { ok: false, cause: "Numéro client PayFIP de la régie absent (PAYFIP_NUMCLI) : à obtenir auprès du comptable public de la commune (DGFiP)" };
  return { ok: true, numcli, saisie: process.env.PAYFIP_MODE === "M" ? "M" : "T" };
}

export function urlPayfip(d: DemandePayfip): { ok: true; url: string; saisie: "T" | "M" } | { ok: false; cause: string } {
  const dispo = payfipDisponible();
  if (!dispo.ok) return dispo;
  if (!/^[A-Z0-9]{1,30}$/.test(d.refdet)) return { ok: false, cause: "refdet : 1 à 30 caractères alphanumériques majuscules" };
  if (!Number.isInteger(d.montantCentimes) || d.montantCentimes <= 0) return { ok: false, cause: "montant invalide" };
  const q = new URLSearchParams({ numcli: dispo.numcli, exer: String(d.exercice ?? new Date().getFullYear()), refdet: d.refdet, montant: String(d.montantCentimes), mel: d.email, urlcl: d.urlRetour, objet: d.objet.slice(0, 100), saisie: dispo.saisie });
  return { ok: true, url: `https://www.payfip.gouv.fr/tpa/paiement.web?${q}`, saisie: dispo.saisie };
}

/** Référence de dette : id de facture en majuscules alphanumériques (contrainte PayFIP). */
export function refdetPour(factureId: string): string {
  return factureId.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 30);
}
