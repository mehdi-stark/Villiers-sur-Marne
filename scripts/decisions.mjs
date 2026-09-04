#!/usr/bin/env node
// L'AGENT relit ce que l'opérateur a tranché depuis le cockpit — au début de
// chaque session, avant d'agir. Puis, une fois le choix reporté dans le document
// canonique, il marque la ligne : `node scripts/decisions.mjs --reporter <id,id…>`.
//   node scripts/decisions.mjs            → décisions non reportées (à traiter)
//   node scripts/decisions.mjs --toutes   → tout l'historique
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" }); config();

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? (process.argv[i + 1] ?? true) : null; };
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

try {
  const ids = arg("reporter");
  if (typeof ids === "string") {
    const liste = ids.split(",").map((s) => s.trim()).filter(Boolean);
    const r = await sql`UPDATE decisions SET reporte_le = now() WHERE id IN ${sql(liste)} AND reporte_le IS NULL RETURNING id`;
    console.log(`${r.length} décision(s) marquée(s) reportée(s).`);
  } else {
    const toutes = arg("toutes");
    const lignes = toutes
      ? await sql`SELECT * FROM decisions ORDER BY tranche_le DESC`
      : await sql`SELECT * FROM decisions WHERE reporte_le IS NULL ORDER BY tranche_le ASC`;
    if (!lignes.length) { console.log(toutes ? "Aucune décision en base." : "Rien à reporter : aucune décision prise depuis le cockpit en attente."); }
    for (const l of lignes) {
      console.log(`[${l.id}] ${fmt.format(l.tranche_le)} · ${l.sujet} · ${l.cle} · « ${l.libelle} » → ${l.choix}${l.note ? `\n    note : ${l.note.replace(/\n/g, "\n    ")}` : ""}${l.reporte_le ? "  (reportée)" : ""}`);
    }
  }
} finally {
  await sql.end();
}
