#!/usr/bin/env node
// Test RÉEL bout en bout : un tap sur une option depuis l'écran écrit une ligne
// dans `decisions` — on constate l'EFFET (badge « À reporter » + bouton choisi),
// jamais l'action. Acteur de test `test@ville.local` : il doit être dans
// ADMIN_EMAILS du serveur visé (dev seulement) ; ses lignes sont purgées à la fin.
//   ADMIN_EMAILS=…,test@ville.local pnpm dev   puis   node scripts/tests/tap-decision.mjs [--base http://localhost:3000]
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" }); config();

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg("base", "http://localhost:3000");
const ACTEUR = "test@ville.local";
const corps = `${ACTEUR}|${Date.now() + 3600e3}`;
const sig = createHmac("sha256", process.env.AUTH_SECRET).update(`ville|${corps}`).digest("base64url");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
let code = 1;
const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "fr-FR", timezoneId: "Europe/Paris" });
  await ctx.addCookies([{ name: "ville_session", value: Buffer.from(`${corps}|${sig}`).toString("base64url"), url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/pilotage/cadrage`, { waitUntil: "networkidle" });
  if (new URL(p.url()).pathname === "/connexion") throw new Error(`${ACTEUR} n'est pas dans ADMIN_EMAILS du serveur : renvoyé vers /connexion`);
  const carte = p.locator("article.decision").nth(1);
  await carte.getByRole("button", { name: "+ Ajouter une note" }).click();
  await carte.getByLabel("Note").fill("[TEST] note de vérification\nligne 2");
  await carte.getByRole("button", { name: "Oui", exact: true }).click();
  await carte.locator(".badge", { hasText: "À reporter par l'agent" }).waitFor({ timeout: 15_000 });
  const choisi = await carte.locator("button[data-choisi]").textContent();
  const lignes = await sql`SELECT cle, choix, note FROM decisions WHERE acteur = ${ACTEUR}`;
  if (choisi?.trim() !== "Oui" || lignes.length !== 1 || lignes[0].choix !== "Oui" || !lignes[0].note?.includes("ligne 2")) throw new Error(`effet non constaté : bouton=${choisi}, lignes=${JSON.stringify(lignes)}`);
  await carte.screenshot({ path: "captures/decision-tranchee-390.png" });
  console.log(`✓ tap constaté : ${lignes[0].cle} → ${lignes[0].choix} (ligne en base, badge affiché, capture écrite)`);
  code = 0;
} catch (e) {
  console.error("✗", e.message);
} finally {
  const r = await sql`DELETE FROM decisions WHERE acteur = ${ACTEUR} RETURNING id`;
  await sql`DELETE FROM journal_connexions WHERE email = ${ACTEUR}`;
  console.log(`purge : ${r.length} ligne(s) de test supprimée(s)`);
  await sql.end(); await b.close();
}
process.exit(code);
