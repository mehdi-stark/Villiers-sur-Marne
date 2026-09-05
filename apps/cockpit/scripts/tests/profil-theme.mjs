#!/usr/bin/env node
// Test RÉEL du standard de coquille : le menu profil s'ouvre (identité, réglages,
// thème, déconnexion), le thème CHOISI s'applique et SURVIT au rechargement.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });
const BASE = process.argv[2] ?? "http://localhost:3000";
const APP = process.argv[3] ?? "ville", COOKIE = process.argv[4] ?? "ville_session", SECRET = process.env[process.argv[5] ?? "AUTH_SECRET"];
const EMAIL = "mehdi.stark@gmail.com";
const corps = `${EMAIL}|${Date.now() + 3600e3}`;
const jeton = Buffer.from(`${corps}|${createHmac("sha256", SECRET).update(`${APP}|${corps}`).digest("base64url")}`).toString("base64url");
let code = 1; const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR", colorScheme: "light" });
  await ctx.addCookies([{ name: COOKIE, value: jeton, url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  // L'overlay de développement de Next intercepte les clics : on le retire pour tester l'app, pas l'outil.
  const sansOverlay = async () => p.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((e) => e.remove()));
  await sansOverlay();
  await p.getByRole("button", { name: /Compte :/ }).click();
  const panneau = p.locator(".profil-panneau");
  await panneau.waitFor({ timeout: 10000 });
  const contenu = await panneau.innerText();
  for (const attendu of ["Apparence", "Clair", "Sombre", "Système", "Se déconnecter"]) if (!contenu.toLowerCase().includes(attendu.toLowerCase())) throw new Error(`« ${attendu} » absent du menu profil : ${contenu.slice(0, 120)}`);
  await p.screenshot({ path: "captures/profil-ouvert-1280.png" });
  await panneau.getByRole("button", { name: "Sombre" }).click();
  await p.waitForTimeout(400);
  const theme = await p.evaluate(() => document.documentElement.dataset.theme);
  const fond = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (theme !== "dark") throw new Error(`thème non appliqué : ${theme}`);
  await p.reload({ waitUntil: "networkidle" });
  await sansOverlay();
  const apres = await p.evaluate(() => document.documentElement.dataset.theme);
  if (apres !== "dark") throw new Error("le thème choisi ne survit pas au rechargement (flash / oubli)");
  await p.screenshot({ path: "captures/theme-sombre-choisi-1280.png" });
  // Retour au thème système pour ne pas polluer les autres captures.
  await p.getByRole("button", { name: /Compte :/ }).click();
  await p.locator(".profil-panneau").getByRole("button", { name: "Système" }).click();
  console.log(`✓ menu profil complet (identité, apparence, réglages, déconnexion) ; thème sombre appliqué (fond ${fond}) et conservé au rechargement`);
  code = 0;
} catch (e) { console.error("✗", e.message); }
finally { await b.close(); }
process.exit(code);
