#!/usr/bin/env node
// Test RÉEL : « Attestation de paiement » génère un PDF stocké (données + rendu) et servi
// à la famille propriétaire seulement. Acteur test@ville.local (fam-demo-2), purge à la fin.
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
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
  await ctx.addCookies([{ name: "famille_session", value: Buffer.from(`${corps}|${sig}`).toString("base64url"), url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/factures`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Attestation de paiement/ }).first().click();
  const lien = p.getByRole("link", { name: /Ouvrir l'attestation/ });
  await lien.waitFor({ timeout: 20000 });
  const href = await lien.getAttribute("href");
  const r = await ctx.request.get(`${BASE}${href}`);
  const ct = r.headers()["content-type"] ?? "";
  const corpsPdf = await r.body();
  if (r.status() !== 200 || !ct.includes("application/pdf") || corpsPdf.length < 1000 || corpsPdf.subarray(0, 4).toString() !== "%PDF") throw new Error(`PDF non servi : ${r.status()} ${ct} ${corpsPdf.length} o`);
  const docs = await sql`SELECT type, periode, famille_id, donnees->>'total' AS total FROM documents WHERE famille_id = 'fam-demo-2'`;
  if (docs.length !== 1 || docs[0].type !== "attestation_paiement") throw new Error(`base : ${JSON.stringify(docs)}`);
  // Une autre famille ne peut pas le lire : session famille A (mehdi) sur ce même id → 404
  const corps2 = `mehdi.stark@gmail.com|${Date.now() + 3600e3}`; const sig2 = createHmac("sha256", process.env.FAMILLE_AUTH_SECRET).update(`famille|${corps2}`).digest("base64url");
  const ctx2 = await b.newContext(); await ctx2.addCookies([{ name: "famille_session", value: Buffer.from(`${corps2}|${sig2}`).toString("base64url"), url: BASE }]);
  const r2 = await ctx2.request.get(`${BASE}${href}`);
  if (r2.status() !== 404) throw new Error(`une autre famille lit le document : ${r2.status()}`);
  console.log(`✓ attestation ${docs[0].periode} générée (${corpsPdf.length} o, total ${docs[0].total} c), servie en PDF à la famille, 404 pour une autre famille`);
  code = 0;
} catch (e) { console.error("✗", e.message); }
finally { const r = await sql`DELETE FROM documents WHERE famille_id = 'fam-demo-2' RETURNING id`; console.log(`purge : ${r.length}`); await sql.end(); await b.close(); }
process.exit(code);
