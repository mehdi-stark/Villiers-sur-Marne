// TEST RÉEL — le créneau change d'état AU TAP, sans attendre le serveur (useOptimistic).
// On ralentit délibérément l'action serveur : si l'affichage attendait la réponse, le
// créneau serait encore « libre » 400 ms après le clic.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";

const secret = process.env.FAMILLE_AUTH_SECRET;
const corps = `mehdi.stark@gmail.com|${Date.now() + 864e5}`;
const sig = createHmac("sha256", secret).update(`famille|${corps}`).digest("base64url");
const jeton = Buffer.from(`${corps}|${sig}`).toString("base64url");

const nav = await chromium.launch();
// La grille de créneaux est le gabarit des grands écrans (07/09/2026).
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "famille_session", value: jeton, domain: "localhost", path: "/" }]);
const p = await ctx.newPage();
await p.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await p.evaluate(() => document.querySelector("nextjs-portal")?.remove());

// L'action serveur est un POST sur la page elle-même : on lui ajoute 1,2 s.
let ralenti = true;
let serveurRepondu = false; // passe à vrai seulement quand l'action serveur est relâchée
await p.route("http://localhost:3001/**", async (route) => {
  if (ralenti && route.request().method() === "POST") { await new Promise((r) => setTimeout(r, 1200)); serveurRepondu = true; }
  await route.continue();
});

// N'importe quel créneau TAPABLE fait l'affaire : on vérifie qu'il bascule vers son
// état opposé (réserver OU annuler), sans dépendre de ce que la démo contient.
const libre = p.locator('button.creneau[data-etat="libre"]:not(:disabled), button.creneau[data-etat="reservee"]:not(:disabled)').first();
await libre.waitFor({ timeout: 15000 });
const etiquette = await libre.getAttribute("aria-label");
const depart = await libre.getAttribute("data-etat");
const vise = depart === "libre" ? "reservee" : "libre";
const jour = etiquette.match(/, (Lun\.|Mar\.|Mer\.|Jeu\.|Ven\.) :/)[1], service = etiquette.split(",")[0];
const meme = p.locator(`button.creneau[aria-label^="${service}"][aria-label*=", ${jour} :"]`).first();

// Playwright inclut sa propre attente d'« actionnabilité » dans click() : on mesure
// APRÈS le clic, et on exige que l'état affiché soit déjà basculé ALORS QUE
// l'enregistrement est encore en vol (le bouton porte encore data-charge).
await libre.click();
const t0 = Date.now();
const vu = await p.waitForFunction(
  ([s, j, v]) => {
    const b = [...document.querySelectorAll("button.creneau")].find((x) => x.getAttribute("aria-label")?.startsWith(s) && x.getAttribute("aria-label")?.includes(`, ${j} :`));
    return b?.dataset.etat === v ? { charge: b.dataset.charge !== undefined } : null;
  },
  [service, jour, vise],
  { timeout: 600, polling: 30 },
).then((h) => h.jsonValue(), () => null);
const delai = Date.now() - t0;
if (!vu) { console.error("✗ le créneau n'a pas basculé avant la réponse du serveur (1 200 ms)"); process.exit(1); }
if (serveurRepondu) { console.error("✗ le créneau n'a basculé qu'après la réponse du serveur : ce n'est pas de l'optimiste"); process.exit(1); }
// L'attente (data-charge) arrive juste après : elle est posée en priorité basse, l'état
// optimiste en priorité haute — c'est l'ordre voulu, l'affichage passe avant l'indicateur.
await p.locator("button.creneau[data-charge]").first().waitFor({ timeout: 1500 }).catch(() => { console.error("✗ aucun créneau ne montre l'enregistrement en cours"); process.exit(1); });
console.log(`✓ le créneau passe de « ${depart} » à « ${vise} » ${delai} ms après le tap, l'enregistrement étant encore en cours (action serveur ralentie à 1 200 ms) — ${service}, ${jour}`);

// On rend la base à son état d'avant.
ralenti = false;
await p.waitForTimeout(2500);
await meme.click();
await p.waitForTimeout(1500);
await nav.close();
