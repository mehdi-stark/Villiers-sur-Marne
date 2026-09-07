#!/usr/bin/env node
// Test RÉEL de l'écran de connexion : il DIT ce qu'il fait sans confirmer qu'un compte
// existe, et le renvoi de code ATTEND au lieu de laisser un parent se bloquer tout seul.
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3001";
const nav = await chromium.launch();
let code = 1;
try {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelector("nextjs-portal")?.remove());

  // Une adresse INCONNUE : l'écran doit conduire au même endroit, et l'expliquer.
  await p.locator('input[type="email"]').fill("inconnue-totale@exemple.invalid");
  await p.getByRole("button", { name: "Recevoir un code" }).click();
  await p.locator(".code-input").waitFor({ timeout: 15000 });
  const phrase = (await p.locator('p.petit').filter({ hasText: /code/i }).first().textContent()) ?? "";
  if (!/^Si /.test(phrase.trim())) throw new Error(`l'écran affirme un envoi au lieu de le conditionner : « ${phrase.trim()} »`);
  if (/envoyé à/.test(phrase) && !/Si /.test(phrase)) throw new Error("l'écran confirme l'existence du compte");
  console.log(`✓ après envoi, l'écran dit ce qu'il fait sans rien confirmer : « ${phrase.trim().slice(0, 90)}… »`);

  // Le renvoi est verrouillé le temps du compte à rebours.
  const renvoyer = p.getByRole("button", { name: /Renvoyer|Limite atteinte/ });
  const libelle = (await renvoyer.textContent())?.trim() ?? "";
  if (!/Renvoyer dans \d+ s|Limite atteinte/.test(libelle)) throw new Error(`le renvoi est immédiatement disponible : « ${libelle} »`);
  if (!(await renvoyer.isDisabled())) throw new Error("le bouton de renvoi n'est pas désactivé pendant l'attente");
  console.log(`✓ renvoi verrouillé : « ${libelle} », bouton désactivé`);

  // Le nombre de demandes restantes est annoncé (il ne trahit rien : il est compté avant
  // même de savoir si l'adresse existe).
  const reste = await p.locator('p[role="status"]').first().textContent();
  if (!/demande|limite/i.test(reste ?? "")) throw new Error(`aucune indication de quota : « ${reste} »`);
  console.log(`✓ quota annoncé : « ${reste.trim()} »`);
  code = 0;
} catch (e) {
  console.error("✗", e.message);
} finally {
  await nav.close();
  process.exit(code);
}
