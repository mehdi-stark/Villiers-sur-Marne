#!/usr/bin/env node
// Test RÉEL : un agent au téléphone cherche par nom de famille, par PRÉNOM D'ENFANT ou
// par école — sans accents, sans respecter la casse. La recherche reste dans l'URL pour
// être envoyée à un collègue.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = process.argv[2] ?? "http://localhost:3002";
const EMAIL = "test@ville.local";
const corps = `${EMAIL}|${Date.now() + 3600e3}`;
const sig = createHmac("sha256", process.env.AGENTS_AUTH_SECRET).update(`agents|${corps}`).digest("base64url");

let code = 1;
const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR", timezoneId: "Europe/Paris" });
  await ctx.addCookies([{ name: "agents_session", value: Buffer.from(`${corps}|${sig}`).toString("base64url"), url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/familles`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelector("nextjs-portal")?.remove());

  const total = await p.locator(".file-ligne").count();
  if (total < 3) throw new Error(`${total} dossiers seulement : le jeu de démonstration est trop maigre pour tester la recherche`);

  // On prend un prénom d'enfant réellement affiché, et on le cherche SANS accent ni casse.
  const jeton = (await p.locator(".jeton-enfant").first().textContent())?.trim().split(" ")[0] ?? "";
  const sansAccent = jeton.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  await p.getByLabel("Rechercher un dossier").fill(sansAccent);
  await p.waitForURL(/[?&]q=/, { timeout: 10000 });
  await p.waitForTimeout(600);
  const trouves = await p.locator(".file-ligne").count();
  if (trouves === 0) throw new Error(`« ${sansAccent} » (pour « ${jeton} ») ne trouve aucun dossier`);
  if (trouves === total) throw new Error("la recherche ne filtre rien");
  if (!(await p.locator(`.file-ligne:has-text("${jeton}")`).count())) throw new Error("le dossier attendu n'est pas dans les résultats");
  console.log(`✓ recherche par prénom d'enfant sans accent : « ${sansAccent} » → ${trouves}/${total} dossiers, dont celui de ${jeton}`);

  // Une recherche sans résultat le DIT, elle ne laisse pas une page vide.
  await p.getByLabel("Rechercher un dossier").fill("zzzzz");
  await p.waitForTimeout(900);
  const vide = await p.locator(".file-ligne").count();
  const message = await p.locator("text=Aucun dossier ne correspond").count();
  if (vide !== 0 || message === 0) throw new Error("une recherche sans résultat ne s'explique pas");
  console.log("✓ recherche sans résultat : la page dit sur quoi porte la recherche, au lieu d'être vide");

  // Raccourcis clavier : « / » pour chercher, « Échap » pour effacer, « Entrée » pour
  // ouvrir le premier résultat — un agent enchaîne les dossiers sans toucher la souris.
  await p.getByLabel("Rechercher un dossier").fill("");
  await p.waitForTimeout(700);
  await p.locator("body").click({ position: { x: 5, y: 5 } });
  await p.keyboard.press("/");
  const focus = await p.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  if (focus !== "Rechercher un dossier") throw new Error(`« / » ne met pas le curseur dans la recherche (focus : ${focus})`);
  await p.keyboard.type(jeton.slice(0, 3));
  await p.waitForTimeout(700);
  await p.keyboard.press("Enter");
  await p.waitForURL(/\/familles\/[^/]+$/, { timeout: 10000 });
  console.log(`✓ clavier : « / » cherche, « Entrée » ouvre le premier dossier (${new URL(p.url()).pathname})`);
  await p.goBack();
  await p.waitForTimeout(500);

  // Le texte cherché voyage dans l'URL : la recherche est partageable.
  await p.getByLabel("Rechercher un dossier").fill("zzzzz");
  await p.waitForURL(/[?&]q=zzzzz/, { timeout: 10000 });
  console.log(`✓ la recherche reste dans l'URL (${new URL(p.url()).search}) — envoyable à un collègue`);
  code = 0;
} catch (e) {
  console.error("✗", e.message);
} finally {
  await b.close();
  process.exit(code);
}
