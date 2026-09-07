// TEST RÉEL — plusieurs enfants sur un dossier : on choisit qui on regarde, et le choix
// SUIT le changement d'échelle (jour → semaine → mois). Sans ça, une fratrie de quatre
// rend la page illisible et on reperd son filtre à chaque navigation.
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
const propre = () => p.evaluate(() => document.querySelector("nextjs-portal")?.remove());

await p.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await propre();

const total = await p.locator("section.enfant-carte").count();
if (total < 2) { console.error(`✗ le dossier de test n'a qu'${total} enfant : ce test en exige deux`); process.exit(1); }
const puces = p.locator(".puce-enfant");
if ((await puces.count()) !== total + 1) { console.error("✗ le sélecteur ne propose pas « Tous » + un par enfant"); process.exit(1); }
console.log(`✓ ${total} enfants affichés, sélecteur « Tous » + ${total} puces`);

// 1. Choisir un enfant réduit l'affichage à lui seul.
const prenom = (await puces.nth(1).textContent())?.trim().slice(1).replace(/[A-Z]{2,3}\d?$/, "").trim();
await puces.nth(1).click();
await p.waitForURL(/[?&]e=/, { timeout: 10000 });
await propre();
const apres = await p.locator("section.enfant-carte").count();
if (apres !== 1) { console.error(`✗ ${apres} cartes affichées après avoir choisi un enfant`); process.exit(1); }
const actif = await p.locator(".puce-enfant[data-actif]").textContent();
console.log(`✓ un seul enfant affiché après sélection (puce active : « ${actif?.trim()} »)`);

// 2. Le choix SUIT le changement d'échelle.
const url = new URL(p.url());
const choisi = url.searchParams.get("e");
await p.locator('a[href^="/calendrier"]:visible').first().click();
await p.waitForURL(/\/calendrier/, { timeout: 10000 });
await p.locator(".calendrier-grille").first().waitFor({ timeout: 15000 }); // la page arrive en squelette d'abord
await propre();
if (new URL(p.url()).searchParams.get("e") !== choisi) { console.error(`✗ l'enfant choisi est perdu en passant au mois : ${p.url()}`); process.exit(1); }
const cartesMois = await p.locator("section[aria-label^='Calendrier de']").count();
if (cartesMois !== 1) { console.error(`✗ ${cartesMois} calendriers affichés alors qu'un enfant est choisi`); process.exit(1); }
console.log(`✓ le choix suit l'échelle : semaine → mois, toujours ${prenom ?? "le même enfant"} seul`);

// 3. Et il se relâche.
await p.locator('.puce-enfant').first().click();
await p.waitForURL((u) => !u.searchParams.get("e"), { timeout: 10000 });
await p.locator(".calendrier-grille").first().waitFor({ timeout: 15000 });
await propre();
const tous = await p.locator("section[aria-label^='Calendrier de']").count();
if (tous !== total) { console.error(`✗ « Tous » ne rend pas les ${total} enfants (${tous})`); process.exit(1); }
console.log(`✓ « Tous » revient aux ${total} enfants`);
// L'ancre visuelle : en défilant une vue « Tous », on doit toujours savoir de quel enfant
// il s'agit — l'en-tête de sa carte reste collé en haut.
const colle = await p.evaluate(() => {
  const e = document.querySelector(".enfant-tete");
  return e ? getComputedStyle(e).position : "absent";
});
if (colle !== "sticky") { console.error(`✗ l'en-tête d'enfant ne suit pas le défilement (${colle})`); process.exit(1); }
console.log("✓ l'en-tête d'enfant reste visible en défilant (position: sticky)");

// Second tap sur un jour déjà ouvert : on ouvre la journée entière.
const jour = p.locator(".jour-mois:not([data-hors])").nth(10);
await jour.click();
await p.waitForTimeout(400);
await jour.click();
await p.waitForURL(/\/jour\?d=/, { timeout: 8000 });
console.log(`✓ second tap sur un jour ouvert → la journée entière (${new URL(p.url()).search})`);

await nav.close();
