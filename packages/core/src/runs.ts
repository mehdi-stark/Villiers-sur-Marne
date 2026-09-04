import { and, desc, eq, gt } from "drizzle-orm";
import { db, schema } from "./db";
import { poserAlerte, resoudreAlerte } from "./alertes";

// Tâche planifiée résiliente : VERROU (un run en cours récent = on n'empile pas),
// JOURNAL (chaque exécution, sa durée, son résultat), HEARTBEAT (le silence est une panne).
export type Resultat = Record<string, unknown>;

export async function executerRun(code: string, fn: () => Promise<Resultat>, opts: { verrouMs?: number } = {}): Promise<{ statut: "ok" | "erreur" | "ignore"; resultat?: Resultat; erreur?: string }> {
  const verrouMs = opts.verrouMs ?? 10 * 60_000;
  const [encours] = await db.select().from(schema.runs).where(and(eq(schema.runs.code, code), eq(schema.runs.statut, "running"), gt(schema.runs.debutLe, new Date(Date.now() - verrouMs)))).limit(1);
  if (encours) return { statut: "ignore", erreur: "un run est déjà en cours" };
  const [run] = await db.insert(schema.runs).values({ code, statut: "running" }).returning({ id: schema.runs.id, debutLe: schema.runs.debutLe });
  const t0 = Date.now();
  try {
    const resultat = await fn();
    await db.update(schema.runs).set({ statut: "ok", finLe: new Date(), dureeMs: Date.now() - t0, resultat }).where(eq(schema.runs.id, run!.id));
    await resoudreAlerte(`cron_${code}_echec`);
    return { statut: "ok", resultat };
  } catch (e) {
    const erreur = e instanceof Error ? e.message.slice(0, 300) : "erreur inconnue";
    await db.update(schema.runs).set({ statut: "erreur", finLe: new Date(), dureeMs: Date.now() - t0, erreur }).where(eq(schema.runs.id, run!.id));
    await poserAlerte("critique", `cron_${code}_echec`, `La tâche « ${code} » a échoué`, { erreur });
    return { statut: "erreur", erreur };
  }
}

export async function dernierRun(code: string) {
  const [r] = await db.select().from(schema.runs).where(eq(schema.runs.code, code)).orderBy(desc(schema.runs.debutLe)).limit(1);
  return r ?? null;
}

/** Le surveillant : une tâche muette au-delà de 2× sa cadence est une PANNE, pas un silence. */
export async function verifierSilence(code: string, cadenceMs: number): Promise<{ ok: boolean; message: string }> {
  const r = await dernierRun(code);
  const limite = 2 * cadenceMs;
  if (!r) { await poserAlerte("warn", `cron_${code}_jamais`, `La tâche « ${code} » n'a jamais tourné`, {}); return { ok: false, message: "jamais exécutée" }; }
  const age = Date.now() - r.debutLe.getTime();
  if (age > limite) { await poserAlerte("critique", `cron_${code}_muet`, `La tâche « ${code} » est muette depuis ${Math.round(age / 3600_000)} h (cadence attendue : ${Math.round(cadenceMs / 3600_000)} h)`, {}); return { ok: false, message: "muette" }; }
  await resoudreAlerte(`cron_${code}_muet`);
  await resoudreAlerte(`cron_${code}_jamais`);
  return { ok: true, message: `dernier run il y a ${Math.round(age / 60_000)} min (${r.statut})` };
}

export async function derniersRuns(code: string, n = 14) {
  return db.select().from(schema.runs).where(eq(schema.runs.code, code)).orderBy(desc(schema.runs.debutLe)).limit(n);
}
