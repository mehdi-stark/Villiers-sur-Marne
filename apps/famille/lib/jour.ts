import type { Activite, Enfant, Reservation } from "@ville/core/donnees/types";
import { verdictDelai } from "@ville/core/donnees/regles";
import { MOMENTS, grouperParService, plageHoraire, reservable, service, type Moment } from "@ville/core/donnees/services";

/* VUE JOUR — la question quotidienne du parent : « demain, qu'est-ce qui est prévu pour
 * mon enfant ? ». La journée se lit du matin au soir, un bloc par moment, chaque service
 * avec son horaire, son prix et son état. C'est la vue la plus lisible des trois ; la
 * semaine sert à comparer les jours, le mois à voir loin. */

export type EtatJour = "reservee" | "presence" | "absence" | "libre" | "non_servi";
export type ServiceJour = {
  activiteId: string; groupe: string; nom: string; formule: string | null; horaires: string;
  etat: EtatJour; possible: boolean; verdict: string; reservable: boolean; ton: string;
};
export type MomentJour = { cle: Moment; titre: string; quand: string; ton: string; icone: string; plage: string | null; services: ServiceJour[] };

function niveauDe(enfant: Enfant): "maternelle" | "elementaire" {
  return /maternelle|Perrault|Veil/i.test(enfant.ecole) ? "maternelle" : "elementaire";
}

export function jourEnfant(enfant: Enfant, activites: Activite[], reservations: Reservation[], date: string, maintenant: Date): MomentJour[] {
  const niveau = niveauDe(enfant);
  const jourSemaine = new Date(`${date}T00:00:00Z`).getUTCDay();
  const utiles = activites.filter((a) => (a.public === "tous" || a.public === niveau) && a.joursServis.includes(jourSemaine));
  const services: ServiceJour[] = [];
  for (const g of grouperParService(utiles)) {
    for (const a of g.formules) {
      const r = reservations.find((x) => x.activiteId === a.id && x.date === date);
      const etat: EtatJour = r && r.etat !== "annulee" ? r.etat : "libre";
      const v = verdictDelai(a, date, maintenant);
      const s = service(a);
      services.push({ activiteId: a.id, groupe: g.groupe, nom: s.nomGroupe, formule: s.formule, horaires: a.horaires, etat, possible: v.possible, verdict: v.libelle, reservable: reservable(a), ton: s.ton });
    }
  }
  return MOMENTS.map((m) => {
    const dedans = services.filter((s) => {
      const a = utiles.find((x) => x.id === s.activiteId)!;
      return service(a).moment === m.cle;
    });
    return { cle: m.cle, titre: m.titre, quand: m.quand, ton: m.ton, icone: m.icone, plage: plageHoraire(dedans.map((s) => s.horaires)), services: dedans };
  }).filter((m) => m.services.length > 0);
}

/** Les libellés de date qu'on affiche : « aujourd'hui », « demain », sinon le jour écrit. */
export function libelleJour(date: string, aujourdhui: string): { titre: string; relatif: string | null } {
  const d = new Date(`${date}T12:00:00Z`);
  const a = new Date(`${aujourdhui}T12:00:00Z`);
  const ecart = Math.round((d.getTime() - a.getTime()) / 86_400_000);
  const titre = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(d);
  const relatif = ecart === 0 ? "aujourd'hui" : ecart === 1 ? "demain" : ecart === -1 ? "hier" : null;
  return { titre, relatif };
}

export function decalerJour(date: string, n: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
}
