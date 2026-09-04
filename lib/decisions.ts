import { desc, eq } from "drizzle-orm";
import { db, schema } from "./db";

export type DecisionPrise = {
  cle: string;
  choix: string;
  note: string | null;
  acteur: string;
  trancheLe: Date;
  reporteLe: Date | null;
};

/** Dernière décision par clé pour un sujet (l'historique complet reste en base). */
export async function decisionsPrises(sujet: string): Promise<Map<string, DecisionPrise>> {
  const lignes = await db
    .select()
    .from(schema.decisions)
    .where(eq(schema.decisions.sujet, sujet))
    .orderBy(desc(schema.decisions.trancheLe));
  const parCle = new Map<string, DecisionPrise>();
  for (const l of lignes) if (!parCle.has(l.cle)) parCle.set(l.cle, l);
  return parCle;
}

export async function enregistrerDecision(p: { sujet: string; cle: string; libelle: string; choix: string; note?: string; acteur: string }) {
  await db.insert(schema.decisions).values({
    sujet: p.sujet,
    cle: p.cle,
    libelle: p.libelle.slice(0, 200),
    choix: p.choix.slice(0, 120),
    note: p.note?.trim() ? p.note.trim().replace(/\r\n?/g, "\n").slice(0, 2000) : null,
    acteur: p.acteur,
  });
}

/** Résumé pour l'accueil : combien tranchées / en attente de report par l'agent. */
export async function compteurs(): Promise<{ tranchees: number; aReporter: number }> {
  const lignes = await db.select({ reporteLe: schema.decisions.reporteLe }).from(schema.decisions);
  return { tranchees: lignes.length, aReporter: lignes.filter((l) => !l.reporteLe).length };
}
