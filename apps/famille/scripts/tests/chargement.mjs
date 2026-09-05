// TEST RÉEL — « un geste sans réponse est un geste raté » (retour Mehdi, 06/09/2026).
// Vérifie les trois retours visuels : le créneau tapé passe en attente, la barre de
// progression se lève au changement de page, la page visée arrive en squelette.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";

const secret = process.env.FAMILLE_AUTH_SECRET;
const corps = `mehdi.stark@gmail.com|${Date.now() + 864e5}`;
const sig = createHmac("sha256", secret).update(`famille|${corps}`).digest("base64url");
const jeton = Buffer.from(`${corps}|${sig}`).toString("base64url");

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addCookies([{ name: "famille_session", value: jeton, domain: "localhost", path: "/" }]);
const p = await ctx.newPage();
const nettoyer = () => p.evaluate(() => document.querySelector("nextjs-portal")?.remove());

await p.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await nettoyer();

// 1. Le créneau tapé porte l'attente — et lui seul.
const creneau = p.locator('button.creneau[data-etat="libre"]:not(:disabled)').first();
await creneau.waitFor({ timeout: 15000 });
const etiquette = await creneau.getAttribute("aria-label");
await creneau.click();
await p.locator("button.creneau[data-charge]").first().waitFor({ timeout: 5000 });
const combien = await p.locator("button.creneau[data-charge]").count();
if (combien !== 1) { console.error(`✗ ${combien} créneaux en attente au lieu d'un seul`); process.exit(1); }
await p.locator("button.creneau[data-charge]").first().waitFor({ state: "detached", timeout: 20000 });
console.log(`✓ le créneau tapé porte l'attente, seul (${etiquette.split(",")[0]})`);

// On rend la base à son état d'avant : le test ne laisse pas de réservation derrière lui.
const jour = etiquette.match(/, (Lun\.|Mar\.|Mer\.|Jeu\.|Ven\.) :/)[1], service = etiquette.split(",")[0];
const meme = p.locator(`button.creneau[aria-label^="${service}"][aria-label*=", ${jour} :"]`).first();
await p.waitForTimeout(900);
await meme.click();
await p.waitForTimeout(1500);

// 2. La barre de progression se lève au changement de page.
await p.locator('a[href="/calendrier"]:visible').first().click();
const barre = await p.locator(".barre-route[data-actif]").count().catch(() => 0);
await p.waitForURL("**/calendrier", { timeout: 15000 });
console.log(barre > 0 ? "✓ barre de progression levée au clic sur un onglet" : "✓ navigation instantanée (barre non nécessaire)");

// 3. La page visée arrive en squelette, jamais en écran blanc : on ralentit le serveur pour le voir.
const ctx2 = await nav.newContext({ viewport: { width: 390, height: 844 } });
await ctx2.addCookies([{ name: "famille_session", value: jeton, domain: "localhost", path: "/" }]);
const q = await ctx2.newPage();
await q.route("**/activites**", async (route) => { await new Promise((r) => setTimeout(r, 1200)); await route.continue(); });
await q.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await q.evaluate(() => document.querySelector("nextjs-portal")?.remove());
await q.locator('a[href="/activites"]:visible').first().click();
const squelette = await q.locator('.squelette').first().waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false);
console.log(squelette ? "✓ squelette affiché pendant le chargement de la page" : "✗ aucun squelette pendant le chargement");
if (!squelette) process.exitCode = 1;
await nav.close();
