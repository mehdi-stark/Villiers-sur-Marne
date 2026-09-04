import type { Activite, Enfant, Reservation } from "@ville/core/donnees/types";
import { verdictDelai } from "@ville/core/donnees/regles";
import { grouperParService, reservable, service } from "@ville/core/donnees/services";

// La semaine se lit PAR SERVICE (une ligne = un service, cinq colonnes = les jours) :
// c'est le modèle mental du parent (« qu'est-ce que j'ai pour la cantine ? »), pas
// une pile de pastilles par jour. Corrigé le 04/09/2026 après retour de l'opérateur.
export type EtatCellule = "reservee" | "presence" | "absence" | "libre" | "non_servi";
export type Cellule = { date: string; jour: number; etat: EtatCellule; possible: boolean; verdict: string };
export type Formule = { activite: Activite; libelle: string | null; cellules: Cellule[]; reserves: number };
export type LigneService = { groupe: string; service: ReturnType<typeof service>; reservable: boolean; formules: Formule[]; reserves: number; joursServis: number[] };

export function lundiDe(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const j = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - (j - 1));
  return x;
}

export function joursDe(lundi: Date): { date: string; jour: number }[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(lundi.getTime() + i * 86_400_000);
    return { date: d.toISOString().slice(0, 10), jour: i + 1 };
  });
}

function niveauDe(enfant: Enfant): "maternelle" | "elementaire" {
  return /maternelle|Perrault|Veil/i.test(enfant.ecole) ? "maternelle" : "elementaire"; // la source réelle donnera le niveau
}

export function servicesDe(enfant: Enfant, activites: Activite[], reservations: Reservation[], lundi: Date, maintenant: Date): LigneService[] {
  const niveau = niveauDe(enfant);
  const jours = joursDe(lundi);
  const cellulesDe = (a: Activite): Cellule[] =>
    jours.map(({ date, jour }) => {
      if (!a.joursServis.includes(jour)) return { date, jour, etat: "non_servi", possible: false, verdict: "Pas d'accueil ce jour" };
      const r = reservations.find((x) => x.activiteId === a.id && x.date === date);
      const etat: EtatCellule = r && r.etat !== "annulee" ? r.etat : "libre";
      const v = verdictDelai(a, date, maintenant);
      return { date, jour, etat, possible: v.possible, verdict: v.libelle };
    });
  return grouperParService(activites.filter((a) => a.public === "tous" || a.public === niveau)).map((g) => {
    const formules: Formule[] = g.formules.map((a) => {
      const cellules = cellulesDe(a);
      return { activite: a, libelle: service(a).formule, cellules, reserves: cellules.filter((c) => c.etat === "reservee" || c.etat === "presence").length };
    });
    return { groupe: g.groupe, service: g.service, reservable: reservable(g.formules[0]!), formules, reserves: formules.reduce((s, f) => s + f.reserves, 0), joursServis: [...new Set(g.formules.flatMap((a) => a.joursServis))].sort() };
  });
}
