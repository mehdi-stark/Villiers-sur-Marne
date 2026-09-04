import type { Activite, Enfant, Reservation } from "@ville/core/donnees/types";
import { verdictDelai } from "@ville/core/donnees/regles";

// La semaine d'un enfant : 5 jours × les activités réservables, avec pour chaque
// créneau l'état (réservé, présence, absence, libre, fermé) et le verdict de délai.
export type Creneau = { activite: Activite; etat: "reservee" | "presence" | "absence" | "libre" | "ferme"; verdict: ReturnType<typeof verdictDelai> };
export type JourSemaine = { date: string; creneaux: Creneau[] };

export function lundiDe(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const j = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - (j - 1));
  return x;
}

export function semaineDe(enfant: Enfant, activites: Activite[], reservations: Reservation[], lundi: Date, maintenant: Date): JourSemaine[] {
  const niveau = /maternelle|Perrault|Veil/i.test(enfant.ecole) ? "maternelle" : "elementaire"; // heuristique de démo : la source réelle dira le niveau
  const jours: JourSemaine[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(lundi.getTime() + i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const jour = i + 1;
    const creneaux: Creneau[] = activites
      .filter((a) => a.public === "tous" || a.public === niveau)
      .filter((a) => a.joursServis.includes(jour))
      .map((a) => {
        const r = reservations.find((x) => x.activiteId === a.id && x.date === iso);
        const etat: Creneau["etat"] = r ? (r.etat === "annulee" ? "libre" : r.etat) : "libre";
        return { activite: a, etat, verdict: verdictDelai(a, iso, maintenant) };
      });
    jours.push({ date: iso, creneaux });
  }
  return jours;
}
