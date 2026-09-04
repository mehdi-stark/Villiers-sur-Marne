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
    const r = await sql`UPDATE decisions SET reporte_le = now() WHERE id IN ${sql(liste)} AND reporte_le IS NULL RETURNING libelle, choix`;
    console.log(`${r.length} décision(s) marquée(s) reportée(s).`);
    // Accusé vers le téléphone : la boucle se ferme sans rouvrir l'écran (push best-effort, dit s'il n'est pas parti).
    if (r.length && process.env.AGENT_SECRET) {
      const base = process.env.COCKPIT_URL ?? "http://localhost:3000";
      const corps = r.map((d) => `${d.libelle} → ${d.choix}`).join(" · ").slice(0, 200);
      const rep = await fetch(`${base}/api/agent`, { method: "POST", headers: { "Content-Type": "application/json", "x-agent-secret": process.env.AGENT_SECRET }, body: JSON.stringify({ titre: r.length === 1 ? "Décision reportée dans le document" : `${r.length} décisions reportées dans les documents`, corps, url: "/pilotage/decisions" }) }).catch(() => null);
      const d = rep ? await rep.json().catch(() => ({})) : {};
      console.log(rep?.ok ? `push : ${d.envoyes}/${d.abonnes} appareil(s)` : "push : non envoyé (cockpit injoignable ou secret refusé)");
    }
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
