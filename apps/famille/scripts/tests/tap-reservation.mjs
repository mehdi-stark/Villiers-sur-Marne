#!/usr/bin/env node
// Test RÉEL : un tap sur un créneau « Libre » (dans le délai) écrit une réservation ;
// un second tap l'annule ; un créneau hors délai est désactivé. Acteur de test
// test@ville.local → fam-demo-2 (Enfant 3). Purge à la fin.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });
const BASE = process.argv[2] ?? "http://localhost:3001";
const EMAIL = "test@ville.local";
const corps = `${EMAIL}|${Date.now() + 3600e3}`;
const sig = createHmac("sha256", process.env.FAMILLE_AUTH_SECRET).update(`famille|${corps}`).digest("base64url");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
// Un lundi dans 3 semaines : le délai de 7 jours francs court encore.
// Un lundi dans ~5 semaines : dans le délai, et hors des réservations fixes de septembre.
const l = new Date(Date.now() + 35 * 86_400_000); l.setUTCDate(l.getUTCDate() - ((l.getUTCDay() + 6) % 7)); const lundi = l.toISOString().slice(0, 10);
let code = 1; const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR", timezoneId: "Europe/Paris" });
  await ctx.addCookies([{ name: "famille_session", value: Buffer.from(`${corps}|${sig}`).toString("base64url"), url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/?s=${lundi}`, { waitUntil: "networkidle" });
  if (new URL(p.url()).pathname === "/connexion") throw new Error("renvoyé vers /connexion : compte test absent (seed-familles) ?");
  const repas = p.locator('button.creneau[data-etat="libre"]').filter({ hasText: "repas" }).first();
  await repas.waitFor({ timeout: 15000 });
  const label = await repas.getAttribute("aria-label");
  await repas.click();
  await p.locator('button.creneau[data-etat="reservee"]').filter({ hasText: "repas" }).first().waitFor({ timeout: 15000 });
  const l1 = await sql`SELECT etat, acteur FROM reservations_demo WHERE acteur = ${EMAIL}`;
  if (l1.length !== 1 || l1[0].etat !== "reservee") throw new Error(`base après réservation : ${JSON.stringify(l1)}`);
  await p.locator('button.creneau[data-etat="reservee"]').filter({ hasText: "repas" }).first().click();
  await p.waitForTimeout(1500);
  const l2 = await sql`SELECT etat FROM reservations_demo WHERE acteur = ${EMAIL}`;
  if (l2[0]?.etat !== "annulee") throw new Error(`base après annulation : ${JSON.stringify(l2)}`);
  const j = await sql`SELECT accepte FROM journal_reservations WHERE acteur = ${EMAIL} ORDER BY cree_le`;
  // Hors délai : la semaine courante → tous les créneaux repas désactivés
  await p.goto(`${BASE}/?s=${new Date().toISOString().slice(0, 10)}`, { waitUntil: "networkidle" });
  const actifs = await p.locator('button.creneau:not(:disabled)').filter({ hasText: "repas" }).count();
  if (actifs !== 0) throw new Error(`${actifs} créneau(x) repas encore tapables hors délai`);
  console.log(`✓ réservation puis annulation constatées en base (${j.length} lignes de journal, ${j.filter((x) => x.accepte).length} acceptées) ; créneau testé : ${label?.slice(0, 60)} ; hors délai : 0 tapable`);
  code = 0;
} catch (e) { console.error("✗", e.message); }
finally { const r = await sql`DELETE FROM reservations_demo WHERE acteur = ${EMAIL} RETURNING id`; await sql`DELETE FROM journal_reservations WHERE acteur = ${EMAIL}`; console.log(`purge : ${r.length}`); await sql.end(); await b.close(); }
process.exit(code);
