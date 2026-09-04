import { and, isNull, eq } from "drizzle-orm";
import { db, schema } from "./db";

/** Pose une alerte dédupliquée : une seule ligne OUVERTE par code (select puis
 *  insert — une colonne NULL échappe à un index unique). Le message porte la
 *  CAUSE, jamais la citation d'un fournisseur (elle peut contenir un bout de clé). */
export async function poserAlerte(niveau: "info" | "warn" | "critique", code: string, message: string, contexte?: Record<string, unknown>) {
  const ouverte = await db
    .select({ id: schema.alertes.id })
    .from(schema.alertes)
    .where(and(eq(schema.alertes.code, code), isNull(schema.alertes.resolueLe)))
    .limit(1);
  if (ouverte.length) return;
  await db.insert(schema.alertes).values({ niveau, code, message, contexte });
}

export async function resoudreAlerte(code: string) {
  await db.update(schema.alertes).set({ resolueLe: new Date() }).where(and(eq(schema.alertes.code, code), isNull(schema.alertes.resolueLe)));
}

export async function alertesOuvertes() {
  return db.select().from(schema.alertes).where(isNull(schema.alertes.resolueLe));
}
