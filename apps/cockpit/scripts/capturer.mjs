#!/usr/bin/env node
// Capture multi-écrans (playwright) — la brique « la capture prouve ».
//   node scripts/capturer.mjs --base http://localhost:3000 [--pages /,/pilotage/cadrage] [--viewport 390x844] [--forger admin@x.y] [--out ./captures] [--dark]
// --dark : émule prefers-color-scheme: dark — les jetons sombres se PROUVENT en capture (leçon 50 : un bouton hérité d'une maquette devient invisible).
// Signale les débordements horizontaux (scrollWidth > viewport) et SORT EN ERREUR
// s'il y en a : une capture qui déborde n'est pas une preuve, c'est un défaut.
// --forger : signe une session avec AUTH_SECRET (.env.local) — l'e-mail doit être
// dans ADMIN_EMAILS, sinon le middleware renvoie à /connexion (et la capture le montre).
// --app famille|agents : autre application (cookie, secret et préfixe de signature propres).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { createHmac } from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" }); config();

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg("base", "http://localhost:3000");
const PAGES = arg("pages", "/,/pilotage/cadrage,/pilotage/backlog,/connexion").split(",");
const [vw, vh] = arg("viewport", "1440x1000").split("x").map(Number);
const OUT = arg("out", "./captures"); mkdirSync(OUT, { recursive: true });
const DARK = process.argv.includes("--dark");
const APPS = { cockpit: { prefixe: "ville", cookie: "ville_session", secretEnv: "AUTH_SECRET" }, famille: { prefixe: "famille", cookie: "famille_session", secretEnv: "FAMILLE_AUTH_SECRET" }, agents: { prefixe: "agents", cookie: "agents_session", secretEnv: "AGENTS_AUTH_SECRET" } };
const APP = APPS[arg("app", "cockpit")]; if (!APP) { console.error("--app inconnu"); process.exit(1); }

function forgerSession(email) {
  const corps = `${email}|${Date.now() + 30 * 24 * 3600 * 1000}`;
  const secret = process.env[APP.secretEnv]; if (!secret) { console.error(`${APP.secretEnv} absent de .env.local`); process.exit(1); }
  const sig = createHmac("sha256", secret).update(`${APP.prefixe}|${corps}`).digest("base64url");
  return Buffer.from(`${corps}|${sig}`).toString("base64url");
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, locale: "fr-FR", timezoneId: "Europe/Paris", colorScheme: DARK ? "dark" : "light" });
const forger = arg("forger");
if (forger) await ctx.addCookies([{ name: APP.cookie, value: forgerSession(forger), url: BASE }]);
const page = await ctx.newPage();
let defauts = 0;
for (const p of PAGES) {
  await page.goto(`${BASE}${p}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(400);
  const url = new URL(page.url()).pathname;
  const h = await page.evaluate("document.documentElement.scrollHeight");
  const deborde = await page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 2");
  const nom = p.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "accueil";
  await page.screenshot({ path: `${OUT}/${nom}-${vw}${DARK ? "-sombre" : ""}.png`, fullPage: true });
  // Contraste minimal : aucun texte de la couleur exacte du fond (bouton « invisible »).
  const invisibles = await page.evaluate(() => {
    const fond = getComputedStyle(document.body).backgroundColor;
    return [...document.querySelectorAll("button, a, input")].filter((e) => { const s = getComputedStyle(e); return s.color === fond && s.backgroundColor === fond; }).length;
  });
  if (invisibles) { defauts++; console.log(`  ⚠️ ${invisibles} contrôle(s) de la couleur du fond`); }
  const redirige = url !== p ? `  → redirigé vers ${url}` : "";
  if (deborde) defauts++;
  console.log(`${p} : ${h}px, ${Math.ceil(h / vh)} écran(s)${deborde ? "  ⚠️ DÉBORDEMENT HORIZONTAL" : ""}${redirige}`);
}
await browser.close();
if (defauts) { console.error(`${defauts} page(s) débordent — corriger avant de livrer.`); process.exit(1); }
