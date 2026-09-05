import { and, eq, like, sql as raw } from "drizzle-orm";
import { db, schema } from "./db";

// Jeu de DÉMONSTRATION en base, posable et purgeable — depuis un script ou depuis le
// back-office (entre deux rendez-vous, on repart d'une démo propre).
const MARQUE = "demo@exemple.invalid";
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const JEU = [
  { famille: "fam-demo-3", email: "temoin-c@exemple.invalid", nom: "Famille Moreau", type: "inscription_periscolaire", etat: "deposee", pieces: ["identite", "domicile", "caf", "vaccins"], message: "Nouvelle arrivée sur la commune, rentrée en CE2 et MS." },
  { famille: "fam-demo-2", email: "temoin-b@exemple.invalid", nom: "Famille Diallo", type: "quotient_familial", etat: "deposee", pieces: ["imposition", "caf"], message: "Premier calcul de quotient, deux enfants." },
  { famille: "fam-demo-5", email: "temoin-e@exemple.invalid", nom: "Famille Rossi", type: "coordonnees", etat: "en_cours", pieces: ["domicile"], message: "Déménagement à l'intérieur de la commune." },
] as const;

const POINTAGES = [["enf-1", "presence"], ["enf-3", "presence"], ["enf-5", "presence"], ["enf-7", "absence"], ["enf-10", "presence"]] as const;

export async function purgerDemo(): Promise<{ demarches: number; pointages: number }> {
  const ids = await db.select({ id: schema.demarches.id }).from(schema.demarches).where(like(schema.demarches.email, "%@exemple.invalid"));
  for (const x of ids) await db.delete(schema.journalDemarches).where(eq(schema.journalDemarches.demarcheId, x.id));
  const d = await db.delete(schema.demarches).where(like(schema.demarches.email, "%@exemple.invalid")).returning({ id: schema.demarches.id });
  const p = await db.delete(schema.reservationsDemo).where(eq(schema.reservationsDemo.acteur, MARQUE)).returning({ id: schema.reservationsDemo.id });
  await db.delete(schema.journalReservations).where(eq(schema.journalReservations.acteur, MARQUE));
  return { demarches: d.length, pointages: p.length };
}

/** Repose le jeu : démarches en attente et pointages du JOUR (relatifs, jamais une date figée). */
export async function poserDemo(): Promise<{ demarches: number; pointages: number; jour: string }> {
  await purgerDemo();
  for (const j of JEU) {
    const [row] = await db.insert(schema.demarches).values({ familleId: j.famille, email: j.email, type: j.type, etat: j.etat, donnees: { message: j.message, famille: j.nom } }).returning({ id: schema.demarches.id });
    await db.insert(schema.pieces).values(j.pieces.map((code) => ({ demarcheId: row!.id, code, nom: `${code}.png`, mime: "image/png", taille: 72, contenuBase64: PNG })));
    await db.insert(schema.journalDemarches).values({ demarcheId: row!.id, avant: null, apres: "deposee", acteur: j.email, app: "famille" });
  }
  const jour = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
  for (const [enfantId, etat] of POINTAGES) {
    await db.insert(schema.reservationsDemo).values({ enfantId, activiteId: "cantine", date: jour, etat, acteur: MARQUE, app: "agents" })
      .onConflictDoUpdate({ target: [schema.reservationsDemo.enfantId, schema.reservationsDemo.activiteId, schema.reservationsDemo.date], set: { etat, acteur: MARQUE, majLe: new Date() } });
    await db.insert(schema.journalReservations).values({ enfantId, activiteId: "cantine", date: jour, avant: "reservee", apres: etat, acteur: MARQUE, app: "agents" });
  }
  return { demarches: JEU.length, pointages: POINTAGES.length, jour };
}

/** Les ouvertures de liens de présentation (qui a regardé la démo, et quand). */
export async function presentations(limite = 30) {
  return db.select().from(schema.journalConnexions)
    .where(and(eq(schema.journalConnexions.evenement, "connexion"), raw`${schema.journalConnexions.detail}->>'via' = 'presentation'`))
    .orderBy(raw`${schema.journalConnexions.creeLe} desc`).limit(limite);
}
