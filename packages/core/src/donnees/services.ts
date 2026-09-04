import type { Activite, TypeActivite } from "./types";

// PRÉSENTATION DES SERVICES — décision de direction artistique, pas de métier :
// chaque service périscolaire a un NOM COMPLET (celui de la commune, jamais une
// abréviation), un horaire, un ton de couleur et une icône. Défaut payé le
// 04/09/2026 : la semaine affichait « repas / matin / soir » sans dire de quel
// service il s'agissait, et « Libre » sur des services SANS réservation.
export type Ton = "repas" | "loisir" | "matin" | "soir" | "etude";

export type Service = {
  type: TypeActivite;
  nom: string; // nom complet, celui de la ville
  nomCourt: string; // pour les cellules étroites
  ton: Ton;
  icone: "utensils" | "sunrise" | "sunset" | "book" | "palette";
  ordre: number; // ordre de la journée : matin, midi, étude, soir, loisirs
  /** Les FORMULES d'un même service partagent un groupe : l'accueil de loisirs du mercredi
   *  se réserve en journée, matinée ou après-midi — c'est UN service, trois formules. */
  groupe: string;
  nomGroupe: string;
  formule: string | null; // null = le service n'a qu'une formule
};

const SERVICES: Record<TypeActivite, Service> = {
  accueil_matin: { type: "accueil_matin", nom: "Accueil du matin", nomCourt: "Matin", ton: "matin", icone: "sunrise", ordre: 1, groupe: "matin", nomGroupe: "Accueil du matin", formule: null },
  cantine: { type: "cantine", nom: "Pause méridienne", nomCourt: "Repas", ton: "repas", icone: "utensils", ordre: 2, groupe: "cantine", nomGroupe: "Pause méridienne (repas)", formule: null },
  etude: { type: "etude", nom: "Étude surveillée", nomCourt: "Étude", ton: "etude", icone: "book", ordre: 3, groupe: "etude", nomGroupe: "Étude surveillée", formule: null },
  accueil_soir: { type: "accueil_soir", nom: "Accueil du soir", nomCourt: "Soir", ton: "soir", icone: "sunset", ordre: 4, groupe: "soir", nomGroupe: "Accueil du soir", formule: null },
  alsh_mercredi_journee: { type: "alsh_mercredi_journee", nom: "Accueil de loisirs — journée", nomCourt: "Journée", ton: "loisir", icone: "palette", ordre: 5, groupe: "alsh_mercredi", nomGroupe: "Accueil de loisirs du mercredi", formule: "Journée" },
  alsh_mercredi_matin: { type: "alsh_mercredi_matin", nom: "Accueil de loisirs — matinée", nomCourt: "Matinée", ton: "loisir", icone: "palette", ordre: 6, groupe: "alsh_mercredi", nomGroupe: "Accueil de loisirs du mercredi", formule: "Matinée (repas compris)" },
  alsh_mercredi_apres_midi: { type: "alsh_mercredi_apres_midi", nom: "Accueil de loisirs — après-midi", nomCourt: "Après-midi", ton: "loisir", icone: "palette", ordre: 7, groupe: "alsh_mercredi", nomGroupe: "Accueil de loisirs du mercredi", formule: "Après-midi (sans repas)" },
  alsh_vacances: { type: "alsh_vacances", nom: "Accueil de loisirs — vacances scolaires", nomCourt: "Vacances", ton: "loisir", icone: "palette", ordre: 8, groupe: "alsh_vacances", nomGroupe: "Accueil de loisirs — vacances", formule: null },
};

export function service(a: Pick<Activite, "type">): Service {
  return SERVICES[a.type];
}

/** Les activités d'un enfant, triées dans l'ordre de la journée. */
export function trierParJournee<T extends Pick<Activite, "type">>(activites: T[]): T[] {
  return [...activites].sort((x, y) => service(x).ordre - service(y).ordre);
}

/** Un service se réserve, ou bien l'inscription annuelle suffit — la nuance que l'écran doit DIRE. */
export function reservable(a: Pick<Activite, "prevenance">): boolean {
  return a.prevenance.joursAvant > 0;
}

/** Regroupe les activités par SERVICE (les formules d'un même service ensemble). */
export function grouperParService<T extends Pick<Activite, "type">>(activites: T[]): { groupe: string; service: Service; formules: T[] }[] {
  const map = new Map<string, { groupe: string; service: Service; formules: T[] }>();
  for (const a of trierParJournee(activites)) {
    const s = service(a);
    const g = map.get(s.groupe) ?? { groupe: s.groupe, service: s, formules: [] };
    g.formules.push(a);
    map.set(s.groupe, g);
  }
  return [...map.values()];
}
