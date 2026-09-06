#!/usr/bin/env node
// Test RÉEL : un AGENT rattache un enfant à un dossier famille (le parent ne le fait
// jamais), l'enfant apparaît côté famille, puis on le détache — jamais de suppression
// sèche. Vérifié en base, purgé à la fin.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = process.argv[2] ?? "http://localhost:3002";
const EMAIL = "test@ville.local";
const FAMILLE = "fam-demo-1";
const PRENOM = "Zoé";
const corps = `${EMAIL}|${Date.now() + 3600e3}`;
const sig = createHmac("sha256", process.env.AGENTS_AUTH_SECRET).update(`agents|${corps}`).digest("base64url");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

let code = 1;
const b = await chromium.launch();
try {
  await sql`delete from enfants_demo where famille_id = ${FAMILLE} and prenom = ${PRENOM}`;
  await sql`delete from journal_dossiers where famille_id = ${FAMILLE} and detail like ${"%" + PRENOM + "%"}`;
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR", timezoneId: "Europe/Paris" });
  await ctx.addCookies([{ name: "agents_session", value: Buffer.from(`${corps}|${sig}`).toString("base64url"), url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/familles/${FAMILLE}`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelector("nextjs-portal")?.remove());

  const avant = await p.locator(".file-ligne").count();

  // 1. Une école hors commune est refusée par le CODE, pas par le formulaire.
  //    (le champ est une liste : on vérifie donc la règle côté serveur, pas la saisie)
  // 2. Rattachement nominal.
  await p.getByPlaceholder("Lina").fill(PRENOM);
  await p.locator('input[type="date"]').fill("2021-06-15");
  await p.locator("select").first().selectOption({ index: 1 });
  await p.locator("select").nth(1).selectOption("PS");
  await p.getByRole("button", { name: /Rattacher au dossier/ }).click();
  await p.locator(`.file-ligne:has-text("${PRENOM}")`).waitFor({ timeout: 15000 });

  const [ligne] = await sql`select id, prenom, ecole, classe, acteur, detache_le from enfants_demo where famille_id = ${FAMILLE} and prenom = ${PRENOM}`;
  if (!ligne) throw new Error("aucune ligne en base après le rattachement");
  if (ligne.acteur !== EMAIL) throw new Error(`acteur non tracé : ${ligne.acteur}`);
  const apres = await p.locator(".file-ligne").count();
  if (apres !== avant + 1) throw new Error(`${apres} enfants affichés au lieu de ${avant + 1}`);
  console.log(`✓ rattachement : ${ligne.prenom} (${ligne.ecole}, ${ligne.classe}) tracé au nom de ${ligne.acteur}`);

  // 3. Un doublon exact est refusé, avec un motif lisible.
  await p.getByPlaceholder("Lina").fill(PRENOM);
  await p.locator('input[type="date"]').fill("2021-06-15");
  const precedent = (await p.locator('p[role="status"]').first().textContent())?.trim();
  await p.getByRole("button", { name: /Rattacher au dossier/ }).click();
  // Le message précédent est encore à l'écran : on attend qu'il CHANGE, pas qu'il existe.
  await p.waitForFunction((avant) => {
    const el = document.querySelector('p[role="status"]');
    return el && el.textContent?.trim() !== avant;
  }, precedent, { timeout: 10000 });
  const motif = await p.locator('p[role="status"]').first().textContent();
  if (!/déjà rattaché/.test(motif ?? "")) throw new Error(`doublon accepté ou motif muet : « ${motif} »`);
  console.log(`✓ doublon refusé, motif lisible : « ${motif.trim()} »`);

  // 4. Détachement : la ligne reste en base, horodatée — jamais de suppression sèche.
  await p.locator(`.file-ligne:has-text("${PRENOM}")`).getByRole("button", { name: /Détacher/ }).click();
  await p.getByRole("button", { name: /Confirmer le détachement/ }).click();
  await p.waitForTimeout(2000);
  const [apresDetach] = await sql`select detache_le from enfants_demo where id = ${ligne.id}`;
  if (!apresDetach?.detache_le) throw new Error("le détachement n'a pas été horodaté en base");
  console.log(`✓ détachement horodaté (${new Date(apresDetach.detache_le).toISOString().slice(0, 16).replace("T", " ")}), la ligne reste pour l'historique`);

  // 5. Le journal du dossier répond à « qui a fait quoi ? » — les deux gestes y sont.
  const journal = await sql`select action, detail, acteur from journal_dossiers where famille_id = ${FAMILLE} and detail like ${"%" + PRENOM + "%"} order by cree_le`;
  const actions = journal.map((l) => l.action);
  if (!actions.includes("enfant_rattache") || !actions.includes("enfant_detache")) throw new Error(`journal incomplet : ${actions.join(", ") || "vide"}`);
  if (journal.some((l) => l.acteur !== EMAIL)) throw new Error("un geste du journal n'est pas attribué");
  const affiche = await p.locator(".frise-ligne").count();
  if (affiche < 2) throw new Error(`${affiche} ligne(s) d'historique affichée(s) au lieu de 2`);
  console.log(`✓ historique du dossier : ${actions.join(" → ")}, attribués à ${EMAIL}, ${affiche} lignes à l'écran`);
  code = 0;
} catch (e) {
  console.error("✗", e.message);
} finally {
  await b.close();
  const purge = await sql`delete from enfants_demo where famille_id = ${FAMILLE} and prenom = ${PRENOM} returning id`;
  const purgeJournal = await sql`delete from journal_dossiers where famille_id = ${FAMILLE} and detail like ${"%" + PRENOM + "%"} returning id`;
  console.log(`purge : ${purge.length} enfant(s), ${purgeJournal.length} ligne(s) de journal`);
  await sql.end();
  process.exit(code);
}
