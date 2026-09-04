#!/usr/bin/env node
// Test RÉEL : l'agent pointe « Présent » sur la file du jour → ligne presence en base,
// visible ensuite côté famille (même source). Une date future est refusée. Purge à la fin.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });
const BASE = process.argv[2] ?? "http://localhost:3002";
const EMAIL = "test@ville.local";
const corps = `${EMAIL}|${Date.now() + 3600e3}`;
const sig = createHmac("sha256", process.env.AGENTS_AUTH_SECRET).update(`agents|${corps}`).digest("base64url");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const JOUR = "2026-09-04"; // vendredi de fixture : repas réservés
let code = 1; const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR", timezoneId: "Europe/Paris" });
  await ctx.addCookies([{ name: "agents_session", value: Buffer.from(`${corps}|${sig}`).toString("base64url"), url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/?d=${JOUR}`, { waitUntil: "networkidle" });
  if (new URL(p.url()).pathname === "/connexion") throw new Error("renvoyé vers /connexion : AGENT_EMAILS sans test@ville.local ?");
  const bouton = p.getByRole("button", { name: /présent/i }).first();
  await bouton.waitFor({ timeout: 15000 });
  await bouton.click();
  await p.locator('button[data-choisi]').filter({ hasText: "Présent" }).first().waitFor({ timeout: 15000 });
  const l = await sql`SELECT etat, app FROM reservations_demo WHERE acteur = ${EMAIL}`;
  if (l.length !== 1 || l[0].etat !== "presence" || l[0].app !== "agents") throw new Error(`base : ${JSON.stringify(l)}`);
  const futur = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
  await p.goto(`${BASE}/?d=${futur}`, { waitUntil: "networkidle" });
  const nb = await p.getByRole("button", { name: /présent/i }).count();
  let refuse = "aucun créneau futur listé";
  if (nb) { await p.getByRole("button", { name: /présent/i }).first().click(); await p.waitForTimeout(1500); const f = await sql`SELECT accepte, motif FROM journal_reservations WHERE acteur = ${EMAIL} AND date = ${futur}`; refuse = f[0] && f[0].accepte === 0 ? `date future refusée (${f[0].motif})` : `ERREUR : date future acceptée ${JSON.stringify(f)}`; if (!refuse.startsWith("date future refusée")) throw new Error(refuse); }
  console.log(`✓ pointage « Présent » constaté en base (app=agents) ; ${refuse}`);
  code = 0;
} catch (e) { console.error("✗", e.message); }
finally { const r = await sql`DELETE FROM reservations_demo WHERE acteur = ${EMAIL} RETURNING id`; await sql`DELETE FROM journal_reservations WHERE acteur = ${EMAIL}`; console.log(`purge : ${r.length}`); await sql.end(); await b.close(); }
process.exit(code);
