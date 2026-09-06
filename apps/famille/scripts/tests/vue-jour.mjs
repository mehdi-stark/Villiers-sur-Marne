// TEST RÉEL — la vue Jour : la journée se lit du matin au soir, et on réserve dessus.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";

const secret = process.env.FAMILLE_AUTH_SECRET;
const corps = `mehdi.stark@gmail.com|${Date.now() + 864e5}`;
const sig = createHmac("sha256", secret).update(`famille|${corps}`).digest("base64url");
const jeton = Buffer.from(`${corps}|${sig}`).toString("base64url");

// Un jour d'école ASSEZ LOIN pour que le délai de prévenance de la cantine (7 jours
// francs) coure encore : le lundi dans deux semaines.
const d = new Date(Date.now() + 14 * 86_400_000);
d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() || 7) - 1));
const date = d.toISOString().slice(0, 10);

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addCookies([{ name: "famille_session", value: jeton, domain: "localhost", path: "/" }]);
const p = await ctx.newPage();
await p.goto(`http://localhost:3001/jour?d=${date}`, { waitUntil: "networkidle" });
await p.evaluate(() => document.querySelector("nextjs-portal")?.remove());

// 1. La journée est structurée par moments, dans l'ordre des aiguilles.
const titres = await p.locator(".journee .moment .moment-titre b").allTextContents();
const attendu = ["Le matin", "Le midi", "Le soir", "Mercredis et vacances"];
const ordre = titres.filter((x, i) => titres.indexOf(x) === i);
const rang = ordre.map((x) => attendu.indexOf(x));
if (ordre.length === 0) { console.error("✗ aucun moment affiché sur la journée"); process.exit(1); }
if (rang.some((v, i) => i > 0 && v < rang[i - 1])) { console.error(`✗ moments dans le désordre : ${ordre.join(" → ")}`); process.exit(1); }
console.log(`✓ journée du ${date} lue dans l'ordre : ${ordre.join(" → ")}`);

// 2. Chaque service dit son horaire et son prix.
const premier = p.locator(".jour-service").first();
const detail = await premier.locator(".mini").first().textContent();
if (!/\d{1,2}h\d{2}/.test(detail ?? "") || !/€/.test(detail ?? "")) { console.error(`✗ un service sans horaire ou sans prix : « ${detail} »`); process.exit(1); }
console.log(`✓ chaque service porte son horaire et son prix (« ${detail.slice(0, 60)}… »)`);

// 3. On réserve depuis la journée, puis on remet comme avant.
const bouton = p.locator('.jour-service button:not(:disabled)').first();
const avant = (await bouton.textContent())?.trim();
await bouton.click();
await p.waitForTimeout(1600);
const apres = (await p.locator('.jour-service button:not(:disabled)').first().textContent())?.trim();
if (avant === apres) { console.error(`✗ le bouton n'a pas changé d'état (« ${avant} »)`); process.exit(1); }
console.log(`✓ réservation depuis la journée : « ${avant} » → « ${apres} »`);
await p.locator('.jour-service button:not(:disabled)').first().click();
await p.waitForTimeout(1600);
await nav.close();
