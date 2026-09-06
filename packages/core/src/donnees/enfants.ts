import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "../db";
import { ECOLES } from "./fictif";
import type { Enfant } from "./types";

/* QUI ENREGISTRE UN ENFANT ? PAS LE PARENT.
 * À Villiers comme dans toute commune, le dossier famille se constitue à la MAIRIE
 * (inscription scolaire), et le périscolaire en découle : le portail famille LIT ce
 * dossier, il ne le crée pas. La source de vérité sera l'export/API de la ville
 * (Agora+) ; tant qu'elle n'est pas branchée, c'est l'AGENT qui rattache un enfant
 * depuis le back-office, et chaque geste est tracé (qui, quand).
 * Un enfant ne se supprime jamais : il se DÉTACHE (déménagement, fin de scolarité),
 * pour que les factures et les pointages passés restent lisibles. */

export type Rattachement = { familleId: string; prenom: string; naissance: string; ecole: string; classe: string; acteur: string };

export function verifierRattachement(r: Omit<Rattachement, "acteur">): { ok: true } | { ok: false; message: string } {
  if (r.prenom.trim().length < 2) return { ok: false, message: "Le prénom doit faire au moins deux lettres." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.naissance)) return { ok: false, message: "La date de naissance doit être au format AAAA-MM-JJ." };
  const age = (Date.now() - new Date(`${r.naissance}T12:00:00Z`).getTime()) / (365.25 * 86_400_000);
  if (!(age > 0 && age < 25)) return { ok: false, message: "La date de naissance n'est pas plausible pour un enfant scolarisé." };
  if (!ECOLES.some((e) => e.nom === r.ecole)) return { ok: false, message: "Cette école ne fait pas partie des groupes scolaires de la ville." };
  if (r.classe.trim().length < 2) return { ok: false, message: "La classe est obligatoire (PS, MS, GS, CP, CE1…)." };
  return { ok: true };
}

/** Les enfants rattachés par un agent, pour une famille (les détachés sont exclus). */
export async function enfantsRattaches(familleId: string): Promise<Enfant[]> {
  const lignes = await db.select().from(schema.enfantsDemo)
    .where(and(eq(schema.enfantsDemo.familleId, familleId), isNull(schema.enfantsDemo.detacheLe)))
    .orderBy(asc(schema.enfantsDemo.creeLe));
  return lignes.map((l) => ({ id: l.id, familleId: l.familleId, prenom: l.prenom, naissance: l.naissance, ecole: l.ecole, classe: l.classe }));
}

export async function rattacherEnfant(r: Rattachement): Promise<{ ok: boolean; message: string; id?: string }> {
  const v = verifierRattachement(r);
  if (!v.ok) return { ok: false, message: v.message };
  const deja = await enfantsRattaches(r.familleId);
  if (deja.some((e) => e.prenom.toLowerCase() === r.prenom.trim().toLowerCase() && e.naissance === r.naissance)) {
    return { ok: false, message: `${r.prenom.trim()} est déjà rattaché à ce dossier.` };
  }
  const id = `enf-${r.familleId}-${Date.now().toString(36)}`;
  await db.insert(schema.enfantsDemo).values({ id, familleId: r.familleId, prenom: r.prenom.trim(), naissance: r.naissance, ecole: r.ecole, classe: r.classe.trim(), acteur: r.acteur });
  await journaliser(r.familleId, "enfant_rattache", id, `${r.prenom.trim()} rattaché au dossier — ${r.ecole}, ${r.classe.trim()}`, r.acteur);
  return { ok: true, message: `${r.prenom.trim()} est rattaché au dossier (${r.ecole}, ${r.classe.trim()}).`, id };
}

/** Détacher, jamais supprimer : les factures et pointages passés doivent rester lisibles. */
export async function detacherEnfant(id: string, acteur: string): Promise<{ ok: boolean; message: string }> {
  const [ligne] = await db.select().from(schema.enfantsDemo).where(eq(schema.enfantsDemo.id, id)).limit(1);
  if (!ligne) return { ok: false, message: "Cet enfant ne vient pas d'un rattachement d'agent : il est fourni par la source de données." };
  if (ligne.detacheLe) return { ok: false, message: `${ligne.prenom} est déjà détaché.` };
  // On n'écrase PAS `acteur` : c'est celui qui a rattaché. Qui détache est dans le journal.
  await db.update(schema.enfantsDemo).set({ detacheLe: new Date() }).where(eq(schema.enfantsDemo.id, id));
  await journaliser(ligne.familleId, "enfant_detache", id, `${ligne.prenom} détaché du dossier — ${ligne.ecole}, ${ligne.classe}`, acteur);
  return { ok: true, message: `${ligne.prenom} est détaché du dossier. Son historique reste consultable.` };
}

/** Le journal du dossier : une phrase LISIBLE par geste, avec qui et quand. C'est ce
 *  qu'un agent lit au téléphone quand un parent demande « qui a changé ça ? ». */
async function journaliser(familleId: string, action: string, cible: string | null, detail: string, acteur: string): Promise<void> {
  await db.insert(schema.journalDossiers).values({ familleId, action, cible, detail, acteur });
}

export type LigneJournal = { action: string; detail: string; acteur: string; creeLe: Date };

export async function journalDossier(familleId: string, limite = 20): Promise<LigneJournal[]> {
  const l = await db.select().from(schema.journalDossiers)
    .where(eq(schema.journalDossiers.familleId, familleId))
    .orderBy(desc(schema.journalDossiers.creeLe)).limit(limite);
  return l.map((x) => ({ action: x.action, detail: x.detail, acteur: x.acteur, creeLe: x.creeLe }));
}
