import { and, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "../db";
import { verdictDelai } from "./regles";
import type { Activite, EtatReservation, Reservation } from "./types";

// Écritures de la source fictive : le CODE décide (délai, transitions), l'humain
// tape. Tout refus est journalisé avec son motif — un bouton muet est un bouton cassé.

export async function reservationsPersistees(enfantId: string, du: string, au: string): Promise<Reservation[]> {
  const l = await db.select().from(schema.reservationsDemo).where(and(eq(schema.reservationsDemo.enfantId, enfantId), gte(schema.reservationsDemo.date, du), lte(schema.reservationsDemo.date, au)));
  return l.map((r) => ({ enfantId: r.enfantId, activiteId: r.activiteId, date: r.date, etat: r.etat as EtatReservation }));
}

/** Fusion : une ligne persistée l'emporte sur la ligne fixe de la fixture. */
export function fusionner(fixes: Reservation[], persistees: Reservation[]): Reservation[] {
  const cle = (r: Reservation) => `${r.enfantId}|${r.activiteId}|${r.date}`;
  const m = new Map(fixes.map((r) => [cle(r), r]));
  for (const r of persistees) m.set(cle(r), r);
  return [...m.values()];
}

export type Resultat = { ok: true; etat: EtatReservation } | { ok: false; motif: string };

async function ecrire(p: { enfantId: string; activiteId: string; date: string; avant: EtatReservation | null; apres: EtatReservation; acteur: string; app: "famille" | "agents"; accepte: boolean; motif?: string }) {
  await db.insert(schema.journalReservations).values({ enfantId: p.enfantId, activiteId: p.activiteId, date: p.date, avant: p.avant, apres: p.apres, acteur: p.acteur, app: p.app, motif: p.motif, accepte: p.accepte ? 1 : 0 });
  if (!p.accepte) return;
  await db
    .insert(schema.reservationsDemo)
    .values({ enfantId: p.enfantId, activiteId: p.activiteId, date: p.date, etat: p.apres, acteur: p.acteur, app: p.app })
    .onConflictDoUpdate({ target: [schema.reservationsDemo.enfantId, schema.reservationsDemo.activiteId, schema.reservationsDemo.date], set: { etat: p.apres, acteur: p.acteur, app: p.app, majLe: new Date() } });
}

/** Le parent réserve ou annule : refusé par le code si le délai est dépassé, ou si une présence/absence est déjà pointée. */
export async function reserverOuAnnuler(p: { enfantId: string; activite: Activite; date: string; actuel: EtatReservation | null; voulu: "reservee" | "annulee"; acteur: string; maintenant?: Date }): Promise<Resultat> {
  const v = verdictDelai(p.activite, p.date, p.maintenant ?? new Date());
  const base = { enfantId: p.enfantId, activiteId: p.activite.id, date: p.date, avant: p.actuel, apres: p.voulu, acteur: p.acteur, app: "famille" as const };
  if (p.actuel === "presence" || p.actuel === "absence") { await ecrire({ ...base, accepte: false, motif: "fréquentation déjà pointée" }); return { ok: false, motif: "Une fréquentation a déjà été pointée ce jour : la modification est impossible." }; }
  if (!v.possible) { await ecrire({ ...base, accepte: false, motif: "délai dépassé" }); return { ok: false, motif: v.libelle }; }
  if (p.activite.prevenance.joursAvant === 0) { await ecrire({ ...base, accepte: false, motif: "sans réservation" }); return { ok: false, motif: "Cette activité est sans réservation : l'inscription annuelle suffit." }; }
  await ecrire({ ...base, accepte: true });
  return { ok: true, etat: p.voulu };
}

/** L'agent pointe : présence ou absence, à toute heure du jour même ; jamais sur une date future. */
export async function pointer(p: { enfantId: string; activiteId: string; date: string; actuel: EtatReservation | null; voulu: "presence" | "absence"; acteur: string; aujourdhui: string }): Promise<Resultat> {
  const base = { enfantId: p.enfantId, activiteId: p.activiteId, date: p.date, avant: p.actuel, apres: p.voulu, acteur: p.acteur, app: "agents" as const };
  if (p.date > p.aujourdhui) { await ecrire({ ...base, accepte: false, motif: "date future" }); return { ok: false, motif: "On ne pointe pas une date future." }; }
  await ecrire({ ...base, accepte: true });
  return { ok: true, etat: p.voulu };
}
