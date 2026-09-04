#!/usr/bin/env node
// Test RÉEL bout en bout : une famille dépose une démarche avec ses pièces (photos),
// l'agent la voit dans sa file, demande une correction (motif OBLIGATOIRE), la famille
// voit « À corriger » et le motif. Purge à la fin.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });
const FAM = process.argv[2] ?? "http://localhost:3001", AG = process.argv[3] ?? "http://localhost:3002";
const EMAIL = "test@ville.local";
const jeton = (app, secret) => { const c = `${EMAIL}|${Date.now() + 3600e3}`; return Buffer.from(`${c}|${createHmac("sha256", secret).update(`${app}|${c}`).digest("base64url")}`).toString("base64url"); };
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const AGENTS_SECRET = (await import("node:fs")).readFileSync("../agents/.env.local", "utf8").match(/^AGENTS_AUTH_SECRET=(.*)$/m)[1].trim();
// Un PNG 1×1 valide comme « photo » de pièce.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
let code = 1; const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
  await ctx.addCookies([{ name: "famille_session", value: jeton("famille", process.env.FAMILLE_AUTH_SECRET), url: FAM }]);
  const p = await ctx.newPage();
  await p.goto(`${FAM}/demarches/nouvelle?type=coordonnees`, { waitUntil: "networkidle" });
  const envoyer = p.getByRole("button", { name: /Il manque|Envoyer ma démarche/ });
  if (!/Il manque/.test((await envoyer.textContent()) ?? "")) throw new Error("le bouton devrait annoncer la pièce manquante");
  await p.locator('input[type="file"]').first().setInputFiles({ name: "domicile.png", mimeType: "image/png", buffer: png });
  await p.getByLabel("Précision (facultatif)").fill("[TEST] déménagement au 12 rue de test");
  await p.getByRole("button", { name: "Envoyer ma démarche" }).click();
  await p.waitForURL((u) => new URL(u).pathname === "/demarches", { timeout: 20000 });
  const d = await sql`SELECT id, type, etat FROM demarches WHERE email = ${EMAIL}`;
  const pcs = await sql`SELECT code, mime, taille FROM pieces WHERE demarche_id = ${d[0].id}`;
  if (d.length !== 1 || d[0].etat !== "deposee" || pcs.length !== 1 || pcs[0].code !== "domicile") throw new Error(`base : ${JSON.stringify({ d, pcs })}`);
  // Côté agents : la démarche est dans la file ; refus SANS motif impossible, avec motif accepté.
  const ctxA = await b.newContext({ viewport: { width: 1200, height: 900 }, locale: "fr-FR" });
  await ctxA.addCookies([{ name: "agents_session", value: jeton("agents", AGENTS_SECRET), url: AG }]);
  const pa = await ctxA.newPage();
  await pa.goto(`${AG}/demarches`, { waitUntil: "networkidle" });
  await pa.getByText("Changement de coordonnées").first().waitFor({ timeout: 15000 });
  const piece = pa.getByRole("link", { name: /ouvrir|Justificatif/ }).first();
  const hrefPiece = await piece.getAttribute("href");
  const rp = await ctxA.request.get(`${AG}${hrefPiece}`);
  if (rp.status() !== 200 || !(rp.headers()["content-type"] ?? "").includes("image/png")) throw new Error(`pièce non servie à l'agent : ${rp.status()}`);
  await pa.getByRole("button", { name: /Demander une correction/ }).first().click();
  const envoiRefus = pa.getByRole("button", { name: /Renvoyer à la famille/ });
  if (await envoiRefus.isEnabled()) throw new Error("un refus sans motif devrait être impossible");
  await pa.getByLabel("Motif").fill("[TEST] justificatif de plus de 3 mois");
  await envoiRefus.click();
  await pa.waitForTimeout(2500);
  const apres = await sql`SELECT etat, motif FROM demarches WHERE email = ${EMAIL}`;
  if (apres[0].etat !== "refusee" || !apres[0].motif?.includes("3 mois")) throw new Error(`état après refus : ${JSON.stringify(apres)}`);
  // Côté famille : « À corriger » et le motif visibles.
  await p.reload({ waitUntil: "networkidle" });
  await p.getByText("À corriger").first().waitFor({ timeout: 15000 });
  const texte = await p.locator("body").innerText();
  if (!texte.includes("3 mois")) throw new Error("le motif n'apparaît pas côté famille");
  const j = await sql`SELECT avant, apres, app FROM journal_demarches WHERE demarche_id = ${d[0].id} ORDER BY cree_le`;
  console.log(`✓ démarche déposée (1 pièce ${pcs[0].taille} o), vue par l'agent, refus motivé (impossible sans motif), « À corriger » + motif côté famille ; journal : ${j.map((x) => `${x.avant ?? "∅"}→${x.apres}(${x.app})`).join(" ")}`);
  code = 0;
} catch (e) { console.error("✗", e.message); }
finally { const ids = await sql`SELECT id FROM demarches WHERE email = ${EMAIL}`; for (const x of ids) await sql`DELETE FROM journal_demarches WHERE demarche_id = ${x.id}`; const r = await sql`DELETE FROM demarches WHERE email = ${EMAIL} RETURNING id`; console.log(`purge : ${r.length}`); await sql.end(); await b.close(); }
process.exit(code);
