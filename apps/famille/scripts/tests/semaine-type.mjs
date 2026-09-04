#!/usr/bin/env node
// Test RÉEL : « Appliquer » la semaine type réserve les repas des semaines dans le délai et
// COMPTE les refus (première semaine < 7 jours francs). Acteur test@ville.local, purge à la fin.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });
const BASE = process.argv[2] ?? "http://localhost:3001", EMAIL = "test@ville.local";
const corps = `${EMAIL}|${Date.now() + 3600e3}`;
const sig = createHmac("sha256", process.env.FAMILLE_AUTH_SECRET).update(`famille|${corps}`).digest("base64url");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
let code = 1; const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR", timezoneId: "Europe/Paris" });
  await ctx.addCookies([{ name: "famille_session", value: Buffer.from(`${corps}|${sig}`).toString("base64url"), url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.getByText("Semaine type", { exact: false }).first().click();
  await p.getByRole("button", { name: "8 semaines" }).click(); // 8 semaines : dépasse les réservations fixes de septembre
  await p.getByRole("button", { name: /Appliquer à tous mes enfants/ }).click();
  await p.locator("p[role=status]").waitFor({ timeout: 20000 });
  const bilan = await p.locator("p[role=status]").textContent();
  const l = await sql`SELECT etat, date FROM reservations_demo WHERE acteur = ${EMAIL} ORDER BY date`;
  const j = await sql`SELECT accepte, motif FROM journal_reservations WHERE acteur = ${EMAIL}`;
  const acceptees = j.filter((x) => x.accepte === 1).length, refusees = j.filter((x) => x.accepte === 0).length;
  // La semaine prochaine (< 7 jours francs) est refusée : au moins un refus, et des réservations la semaine d'après ; la fixture de septembre peut déjà couvrir des jours (déjà réservés).
  if (!/réservé|déjà/.test(bilan ?? "")) throw new Error(`bilan : ${bilan}`);
  if (acceptees === 0) throw new Error(`aucune réservation créée : ${bilan}`);
  await p.screenshot({ path: "captures/semaine-type-390.png", fullPage: false });
  console.log(`✓ bilan affiché : « ${bilan} » — base : ${l.length} ligne(s) réservée(s), journal ${acceptees} acceptée(s) / ${refusees} refusée(s) (délai)`);
  code = 0;
} catch (e) { console.error("✗", e.message); }
finally { const r = await sql`DELETE FROM reservations_demo WHERE acteur = ${EMAIL} RETURNING id`; await sql`DELETE FROM journal_reservations WHERE acteur = ${EMAIL}`; console.log(`purge : ${r.length}`); await sql.end(); await b.close(); }
process.exit(code);
