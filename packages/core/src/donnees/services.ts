import type { Activite, TypeActivite } from "./types";

// PRÉSENTATION DES SERVICES — décision de direction artistique, pas de métier :
// chaque service périscolaire a un NOM COMPLET (celui de la commune, jamais une
// abréviation), un horaire, un ton de couleur et une icône. Défaut payé le
// 04/09/2026 : la semaine affichait « repas / matin / soir » sans dire de quel
// service il s'agissait, et « Libre » sur des services SANS réservation.
export type Ton = "repas" | "loisir" | "matin" | "soir" | "etude";

/** MOMENT DE LA JOURNÉE — retour de l'opérateur (06/09/2026) : « on ne comprend pas ce qui
 *  est le matin, le soir ». Une liste de services ne dit pas QUAND ils ont lieu ; la journée
 *  d'un enfant, si. Les écrans regroupent donc les services par moment, dans l'ordre des
 *  aiguilles, et affichent la plage horaire RÉELLE calculée depuis les activités. */
export type Moment = "matin" | "midi" | "soir" | "hors_classe";
export const MOMENTS: { cle: Moment; titre: string; quand: string; ton: Ton; icone: Service["icone"] }[] = [
  { cle: "matin", titre: "Le matin", quand: "avant la classe", ton: "matin", icone: "sunrise" },
  { cle: "midi", titre: "Le midi", quand: "pause méridienne", ton: "repas", icone: "utensils" },
  { cle: "soir", titre: "Le soir", quand: "après la classe", ton: "soir", icone: "sunset" },
  { cle: "hors_classe", titre: "Mercredis et vacances", quand: "journée sans école", ton: "loisir", icone: "palette" },
];

export type Service = {
  type: TypeActivite;
  nom: string; // nom complet, celui de la ville
  nomCourt: string; // pour les cellules étroites
  moment: Moment;
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
  accueil_matin: { type: "accueil_matin", moment: "matin", nom: "Accueil du matin", nomCourt: "Matin", ton: "matin", icone: "sunrise", ordre: 1, groupe: "matin", nomGroupe: "Accueil du matin", formule: null },
  cantine: { type: "cantine", moment: "midi", nom: "Pause méridienne", nomCourt: "Repas", ton: "repas", icone: "utensils", ordre: 2, groupe: "cantine", nomGroupe: "Pause méridienne (repas)", formule: null },
  etude: { type: "etude", moment: "soir", nom: "Étude surveillée", nomCourt: "Étude", ton: "etude", icone: "book", ordre: 3, groupe: "etude", nomGroupe: "Étude surveillée", formule: null },
  accueil_soir: { type: "accueil_soir", moment: "soir", nom: "Accueil du soir", nomCourt: "Soir", ton: "soir", icone: "sunset", ordre: 4, groupe: "soir", nomGroupe: "Accueil du soir", formule: null },
  alsh_mercredi_journee: { type: "alsh_mercredi_journee", moment: "hors_classe", nom: "Accueil de loisirs — journée", nomCourt: "Journée", ton: "loisir", icone: "palette", ordre: 5, groupe: "alsh_mercredi", nomGroupe: "Accueil de loisirs du mercredi", formule: "Journée" },
  alsh_mercredi_matin: { type: "alsh_mercredi_matin", moment: "hors_classe", nom: "Accueil de loisirs — matinée", nomCourt: "Matinée", ton: "loisir", icone: "palette", ordre: 6, groupe: "alsh_mercredi", nomGroupe: "Accueil de loisirs du mercredi", formule: "Matinée (repas compris)" },
  alsh_mercredi_apres_midi: { type: "alsh_mercredi_apres_midi", moment: "hors_classe", nom: "Accueil de loisirs — après-midi", nomCourt: "Après-midi", ton: "loisir", icone: "palette", ordre: 7, groupe: "alsh_mercredi", nomGroupe: "Accueil de loisirs du mercredi", formule: "Après-midi (sans repas)" },
  alsh_vacances: { type: "alsh_vacances", moment: "hors_classe", nom: "Accueil de loisirs — vacances scolaires", nomCourt: "Vacances", ton: "loisir", icone: "palette", ordre: 8, groupe: "alsh_vacances", nomGroupe: "Accueil de loisirs — vacances", formule: null },
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

/** La plage horaire d'un ensemble d'activités, calculée depuis leurs horaires RÉELS
 *  (« 7h30 – 8h20 ») — jamais une plage écrite en dur dans un écran. */
export function plageHoraire(horaires: string[]): string | null {
  const minutes = (s: string) => { const m = /^(\d{1,2})\s*h\s*(\d{0,2})$/.exec(s.trim()); return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null; };
  const bornes = horaires.flatMap((h) => h.split(/[–—-]/).map((x) => minutes(x)).filter((x): x is number => x !== null));
  if (bornes.length < 2) return null;
  const fmt = (n: number) => `${Math.floor(n / 60)}h${String(n % 60).padStart(2, "0")}`;
  return `${fmt(Math.min(...bornes))} – ${fmt(Math.max(...bornes))}`;
}

/** Vrai si l'instant donné (minutes depuis minuit, heure de Paris) tombe dans la plage
 *  « 7h30 – 8h20 ». Sert à marquer le moment EN COURS dans la journée de l'enfant. */
export function dansLaPlage(plage: string | null, minutes: number): boolean {
  if (!plage) return false;
  const bornes = plage.split(/[–—-]/).map((s) => { const m = /(\d{1,2})\s*h\s*(\d{0,2})/.exec(s); return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null; });
  const [debut, fin] = bornes;
  return debut !== null && fin !== null && debut !== undefined && fin !== undefined && minutes >= debut && minutes <= fin;
}

/** Regroupe des lignes déjà constituées par MOMENT de la journée, dans l'ordre des aiguilles.
 *  Les moments sans aucun service sont omis (un enfant d'élémentaire n'a pas d'accueil du soir). */
export function grouperParMoment<T>(lignes: T[], momentDe: (l: T) => Moment): { moment: (typeof MOMENTS)[number]; lignes: T[] }[] {
  return MOMENTS.map((m) => ({ moment: m, lignes: lignes.filter((l) => momentDe(l) === m.cle) })).filter((g) => g.lignes.length > 0);
}
