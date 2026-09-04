import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";

import { PIECES, TAILLE_MAX, MIMES, TYPES, type CodePiece, type Etat, type TypeDemarche } from "./demarches-definitions";

export * from "./demarches-definitions";

export type PieceEntrante = { code: CodePiece; nom: string; mime: string; contenuBase64: string };

export async function deposerDemarche(p: { familleId: string; email: string; type: TypeDemarche; donnees: Record<string, unknown>; pieces: PieceEntrante[] }): Promise<{ ok: true; id: string } | { ok: false; cause: string }> {
  const def = TYPES[p.type];
  if (!def) return { ok: false, cause: "Type de démarche inconnu." };
  const manquantes = def.pieces.filter((c) => !p.pieces.some((x) => x.code === c));
  if (manquantes.length) return { ok: false, cause: `Pièce(s) manquante(s) : ${manquantes.map((c) => PIECES[c].nom).join(", ")}.` };
  for (const piece of p.pieces) {
    if (!MIMES.includes(piece.mime)) return { ok: false, cause: `Format refusé pour « ${PIECES[piece.code].nom} » : photo (JPEG, PNG, HEIC) ou PDF.` };
    const taille = Math.floor((piece.contenuBase64.length * 3) / 4);
    if (taille > TAILLE_MAX) return { ok: false, cause: `« ${PIECES[piece.code].nom} » dépasse 2 Mo (${Math.round(taille / 1024)} Ko).` };
  }
  const [d] = await db.insert(schema.demarches).values({ familleId: p.familleId, email: p.email, type: p.type, etat: "deposee", donnees: p.donnees }).returning({ id: schema.demarches.id });
  await db.insert(schema.pieces).values(p.pieces.map((x) => ({ demarcheId: d!.id, code: x.code, nom: x.nom.slice(0, 120), mime: x.mime, taille: Math.floor((x.contenuBase64.length * 3) / 4), contenuBase64: x.contenuBase64 })));
  await db.insert(schema.journalDemarches).values({ demarcheId: d!.id, avant: null, apres: "deposee", acteur: p.email, app: "famille" });
  return { ok: true, id: d!.id };
}

export async function demarchesDe(familleId: string) {
  return db.select().from(schema.demarches).where(eq(schema.demarches.familleId, familleId)).orderBy(desc(schema.demarches.creeLe));
}

export async function fileDesDemarches(etats: Etat[] = ["deposee", "en_cours"]) {
  return db.select().from(schema.demarches).where(inArray(schema.demarches.etat, etats)).orderBy(schema.demarches.creeLe);
}

export async function piecesDe(demarcheId: string) {
  return db.select({ id: schema.pieces.id, code: schema.pieces.code, nom: schema.pieces.nom, mime: schema.pieces.mime, taille: schema.pieces.taille }).from(schema.pieces).where(eq(schema.pieces.demarcheId, demarcheId));
}

export async function piece(id: string) {
  const [p] = await db.select().from(schema.pieces).where(eq(schema.pieces.id, id)).limit(1);
  return p ?? null;
}

const TRANSITIONS: Record<Etat, Etat[]> = { deposee: ["en_cours", "validee", "refusee"], en_cours: ["validee", "refusee"], validee: [], refusee: [] };

export async function changerEtat(p: { id: string; vers: Etat; acteur: string; app: string; motif?: string }): Promise<{ ok: true } | { ok: false; cause: string }> {
  const [d] = await db.select().from(schema.demarches).where(eq(schema.demarches.id, p.id)).limit(1);
  if (!d) return { ok: false, cause: "Démarche introuvable." };
  if (!TRANSITIONS[d.etat as Etat].includes(p.vers)) return { ok: false, cause: `Une démarche « ${d.etat} » ne peut pas passer à « ${p.vers} ».` };
  if (p.vers === "refusee" && !p.motif?.trim()) return { ok: false, cause: "Un refus doit porter son motif : la famille doit savoir quoi corriger." };
  await db.update(schema.demarches).set({ etat: p.vers, motif: p.motif?.trim() || null, agent: p.acteur, majLe: new Date() }).where(eq(schema.demarches.id, p.id));
  await db.insert(schema.journalDemarches).values({ demarcheId: p.id, avant: d.etat, apres: p.vers, acteur: p.acteur, app: p.app, motif: p.motif?.trim() || null });
  return { ok: true };
}

export async function compterAValider(): Promise<number> {
  return (await db.select({ id: schema.demarches.id }).from(schema.demarches).where(and(inArray(schema.demarches.etat, ["deposee", "en_cours"])))).length;
}
