import type { Activite, Enfant, Reservation } from "@ville/core/donnees/types";
import { verdictDelai } from "@ville/core/donnees/regles";
import { grouperParService, service } from "@ville/core/donnees/services";

// Vue MOIS : le calendrier que l'on attend d'un portail famille — un mois d'un coup d'œil,
// chaque jour portant ses services (pastilles), et le détail au tap.
export type EtatJour = "reservee" | "presence" | "absence" | "libre" | "non_servi";
export type ServiceDuJour = { activiteId: string; groupe: string; nom: string; nomCourt: string; ton: string; etat: EtatJour; possible: boolean; verdict: string; tarif: number };
export type JourMois = { date: string; jour: number; dansLeMois: boolean; aujourdhui: boolean; weekend: boolean; services: ServiceDuJour[] };

export function moisDe(ancre: Date): { debut: Date; fin: Date; libelle: string } {
  const debut = new Date(Date.UTC(ancre.getUTCFullYear(), ancre.getUTCMonth(), 1));
  const fin = new Date(Date.UTC(ancre.getUTCFullYear(), ancre.getUTCMonth() + 1, 0));
  return { debut, fin, libelle: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(debut) };
}

/** La grille affichée commence le lundi de la première semaine et finit le dimanche de la dernière. */
export function grilleDuMois(ancre: Date): { date: string; jour: number; dansLeMois: boolean }[] {
  const { debut, fin } = moisDe(ancre);
  const premier = new Date(debut); premier.setUTCDate(premier.getUTCDate() - ((premier.getUTCDay() || 7) - 1));
  const dernier = new Date(fin); dernier.setUTCDate(dernier.getUTCDate() + (7 - (dernier.getUTCDay() || 7)));
  const out: { date: string; jour: number; dansLeMois: boolean }[] = [];
  for (let d = new Date(premier); d <= dernier; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push({ date: d.toISOString().slice(0, 10), jour: d.getUTCDate(), dansLeMois: d.getUTCMonth() === debut.getUTCMonth() });
  }
  return out;
}

function niveauDe(enfant: Enfant): "maternelle" | "elementaire" {
  return /maternelle|Perrault|Veil/i.test(enfant.ecole) ? "maternelle" : "elementaire";
}

export function moisEnfant(enfant: Enfant, activites: Activite[], reservations: Reservation[], ancre: Date, maintenant: Date, aujourdhui: string): JourMois[] {
  const niveau = niveauDe(enfant);
  const utiles = activites.filter((a) => (a.public === "tous" || a.public === niveau) && a.prevenance.joursAvant > 0);
  return grilleDuMois(ancre).map(({ date, jour, dansLeMois }) => {
    const j = new Date(`${date}T00:00:00Z`).getUTCDay();
    const services: ServiceDuJour[] = [];
    for (const g of grouperParService(utiles)) {
      for (const a of g.formules) {
        if (!a.joursServis.includes(j)) continue;
        const r = reservations.find((x) => x.activiteId === a.id && x.date === date);
        const etat: EtatJour = r && r.etat !== "annulee" ? r.etat : "libre";
        // Une formule non réservée n'apparaît qu'une fois par service (la première).
        if (etat === "libre" && services.some((s) => s.groupe === g.groupe)) continue;
        const v = verdictDelai(a, date, maintenant);
        const s = service(a);
        services.push({ activiteId: a.id, groupe: g.groupe, nom: s.nomGroupe, nomCourt: s.formule ?? s.nomCourt, ton: s.ton, etat, possible: v.possible, verdict: v.libelle, tarif: 0 });
        if (etat !== "libre") break; // un service réservé masque ses autres formules
      }
    }
    return { date, jour, dansLeMois, aujourdhui: date === aujourdhui, weekend: j === 0 || j === 6, services };
  });
}
