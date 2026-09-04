#!/usr/bin/env node
// Capture multi-écrans GÉNÉRIQUE (playwright) — la brique « la capture prouve ».
//   node capturer.mjs --base https://mon-app.tld --pages /,/admin,/a-traiter [--viewport 390x844] [--cookie nom=valeur] [--out ./captures]
// Signale les débordements horizontaux (scrollWidth > viewport). À adapter au
// projet (session forgée, écrans) — puis référencé par le skill audit-app.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg("base"); if (!BASE) { console.error("--base requis"); process.exit(1); }
const PAGES = arg("pages", "/").split(","); const [vw, vh] = arg("viewport", "1440x1200").split("x").map(Number);
const OUT = arg("out", "./captures"); mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
const cookie = arg("cookie"); if (cookie) { const [name, ...v] = cookie.split("="); await ctx.addCookies([{ name, value: v.join("="), domain: new URL(BASE).hostname, path: "/" }]); }
const page = await ctx.newPage();
for (const p of PAGES) {
  await page.goto(`${BASE}${p}`, { waitUntil: "load", timeout: 60_000 }); await page.waitForTimeout(2000);
  const h = await page.evaluate("document.body.scrollHeight");
  // `clientWidth` et JAMAIS `innerWidth` : en simulation mobile le navigateur
  // DÉZOOME pour faire tenir le contenu, donc `innerWidth` devient la largeur
  // du CONTENU (1200) au lieu de celle de l'écran (390) — la comparaison était
  // toujours fausse à 390 px. Mesuré le 04/09/2026 : une table de 1200 px dans
  // un écran de 390 px n'était PAS signalée. Un détecteur aveugle est pire que
  // pas de détecteur : il délivre des « aucun débordement » rassurants.
  const deborde = await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 2");
  const nom = p.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "accueil";
  for (let i = 0; i < Math.min(6, Math.ceil(h / vh)); i++) { await page.screenshot({ path: `${OUT}/${nom}-${vw}-${i}.png` }); await page.mouse.wheel(0, vh); await page.waitForTimeout(300); }
  console.log(`${p} : ${h}px${deborde ? "  ⚠️ DÉBORDEMENT HORIZONTAL" : ""}`);
}
await browser.close();
