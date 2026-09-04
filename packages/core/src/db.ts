import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

// Une base PAR projet (Neon « ville »). Un seul client par process : le pooler
// Neon sature vite et une page qui « charge à l'infini » est un pooler saturé.
declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}
const sql = globalThis.__sql ?? postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
globalThis.__sql = sql;

export const db = drizzle(sql, { schema });
export { schema };

/** Hébergeur et région de la base, déduits de l'URL — AUCUN secret exposé. */
export function origineBase(): { hebergeur: string; region: string | null } {
  try {
    const hote = new URL(process.env.DATABASE_URL!).hostname;
    const region = hote.match(/(eu|us|ap|sa|ca)-[a-z]+-\d/)?.[0] ?? null;
    const hebergeur = hote.includes("neon.tech") ? "Neon" : hote.includes("supabase") ? "Supabase" : hote.includes("localhost") ? "local" : hote.split(".").slice(-2).join(".");
    return { hebergeur, region };
  } catch {
    return { hebergeur: "base", region: null };
  }
}
