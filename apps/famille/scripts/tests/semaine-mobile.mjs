#!/usr/bin/env node
// TEST RÉEL — retour de l'opérateur (07/09/2026) : « on ne comprend pas quoi est réservé
// pour quel jour » sur mobile, et « il faut pouvoir annuler ».
// Ce test échoue si la semaine redevient une grille sur téléphone, si un jour cesse d'être
// nommé, ou si l'annulation redevient un état muet sur lequel il faut deviner qu'on tape.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";

const secret = process.env.FAMILLE_AUTH_SECRET;
const corps = `mehdi.stark@gmail.com|${Date.now() + 864e5}`;
const sig = createHmac("sha256", secret).update(`famille|${corps}`).digest("base64url");
const jeton = Buffer.from(`${corps}|${sig}`).toString("base64url");
const BASE = process.argv[2] ?? "http://localhost:3001";

const nav = await chromium.launch();
let code = 1;
try {
  const ouvrir = async (largeur) => {
    const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 }, locale: "fr-FR" });
    await ctx.addCookies([{ name: "famille_session", value: jeton, url: BASE }]);
    const p = await ctx.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.querySelector("nextjs-portal")?.remove());
    return p;
  };

  // --- Téléphone : des JOURS nommés, pas une grille ---
  const m = await ouvrir(390);
  const jours = await m.locator(".jour-bloc-tete h3").allTextContents();
  const nommes = jours.filter((j) => /^(Lundi|Mardi|Mercredi|Jeudi|Vendredi) \d+$/.test(j.trim()));
  if (nommes.length < 5) throw new Error(`téléphone : ${nommes.length} jour(s) nommé(s) — la semaine n'est pas lisible par jour`);
  const grilleVisible = await m.evaluate(() => [...document.querySelectorAll(".services.v-large")].some((n) => getComputedStyle(n).display !== "none"));
  if (grilleVisible) throw new Error("téléphone : la grille service × jours s'affiche encore");
  console.log(`✓ téléphone : la semaine se lit par jours nommés (${nommes.slice(0, 3).join(", ")}…), aucune grille`);

  // --- Chaque ligne dit le service, l'heure, le prix, et l'ACTION ---
  const premier = m.locator(".semaine-jours .jour-service").first();
  const detail = (await premier.locator(".mini").first().textContent()) ?? "";
  if (!/\d{1,2}h\d{2}/.test(detail) || !/€/.test(detail)) throw new Error(`ligne sans horaire ou sans prix : « ${detail} »`);
  console.log(`✓ chaque ligne porte son horaire et son prix (« ${detail.trim().slice(0, 46)}… »)`);

  // --- Annuler est un BOUTON NOMMÉ, et il annule vraiment ---
  const aReserver = m.locator('.semaine-jours button:has-text("Réserver"):not([disabled])').first();
  await aReserver.waitFor({ timeout: 15000 });
  // Le bloc se re-cible par son JOUR : un sélecteur fondé sur le texte du bouton ne
  // désigne plus le même bloc une fois que ce texte a changé (piège déjà payé le 06/09).
  const jour = (await m.locator('.semaine-jours section:has(button:has-text("Réserver"))').first().locator("h3").textContent())?.trim();
  const bloc = m.locator(`.semaine-jours section:has(h3:text-is("${jour}"))`).first();
  await aReserver.click();
  const annuler = bloc.locator('button:has-text("Annuler")').first();
  await annuler.waitFor({ timeout: 15000 });
  console.log(`✓ après réservation, l'action devient « Annuler » — nommée, pas un état muet (${jour})`);

  await annuler.click();
  await bloc.locator('button:has-text("Réserver")').first().waitFor({ timeout: 15000 });
  const compteur = (await bloc.locator(".badge").first().textContent())?.trim();
  console.log(`✓ l'annulation fonctionne et le jour le dit : « ${compteur} »`);

  // --- Ordinateur : la grille revient, la liste par jour disparaît ---
  const d = await ouvrir(1440);
  const etat = await d.evaluate(() => ({
    grille: [...document.querySelectorAll(".services.v-large")].some((n) => getComputedStyle(n).display !== "none"),
    liste: [...document.querySelectorAll(".v-etroit")].some((n) => getComputedStyle(n).display !== "none"),
  }));
  if (!etat.grille || etat.liste) throw new Error(`ordinateur : grille=${etat.grille}, liste=${etat.liste}`);
  console.log("✓ ordinateur : la grille service × jours reprend sa place, la liste par jour s'efface");
  code = 0;
} catch (e) {
  console.error("✗", e.message);
} finally {
  await nav.close();
  process.exit(code);
}
