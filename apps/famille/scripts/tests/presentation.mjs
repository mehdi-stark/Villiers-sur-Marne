#!/usr/bin/env node
// Test RÉEL du mode présentation : un lien signé ouvre la démo sans code, le bandeau de
// démonstration est là et NON refermable, un jeton altéré ou expiré est refusé.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });
const BASE = process.argv[2] ?? "http://localhost:3001";
const jeton = (dureeMs) => { const c = `demo@exemple.invalid|${Date.now() + dureeMs}`; return Buffer.from(`${c}|${createHmac("sha256", process.env.DEMO_SECRET).update(`demo|${c}`).digest("base64url")}`).toString("base64url"); };
let code = 1; const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/presentation?demo=${jeton(7200e3)}`, { waitUntil: "networkidle" });
  if (new URL(p.url()).pathname !== "/") throw new Error(`pas de redirection vers l'accueil : ${p.url()}`);
  const bandeau = p.locator(".bandeau-demo");
  await bandeau.waitFor({ timeout: 15000 });
  if (await bandeau.getByRole("button", { name: /Masquer/ }).count()) throw new Error("le bandeau de démonstration est refermable en mode présentation");
  const texte = await p.locator("body").innerText();
  if (!/bonjour, famille/i.test(texte)) throw new Error("la session de démonstration n'ouvre pas un dossier famille");
  await p.screenshot({ path: "captures/presentation-390.png", fullPage: false });
  // Jeton altéré et jeton expiré : refusés
  for (const [nom, url] of [["altéré", `${BASE}/presentation?demo=${jeton(7200e3)}xx`], ["expiré", `${BASE}/presentation?demo=${jeton(-1000)}`], ["absent", `${BASE}/presentation`]]) {
    const r = await ctx.request.get(url, { maxRedirects: 0 });
    if (r.status() !== 403) throw new Error(`jeton ${nom} accepté (${r.status()})`);
  }
  // Sans jeton, l'app reste fermée
  const ctx2 = await b.newContext();
  const r2 = await ctx2.request.get(`${BASE}/`, { maxRedirects: 0 });
  if (![302, 307, 401].includes(r2.status())) throw new Error(`l'accueil n'est pas protégé : ${r2.status()}`);
  console.log("✓ lien de présentation : session ouverte sans code, bandeau non refermable ; jetons altéré/expiré/absent refusés (403) ; app fermée sans jeton");
  code = 0;
} catch (e) { console.error("✗", e.message); }
finally { await b.close(); }
process.exit(code);
