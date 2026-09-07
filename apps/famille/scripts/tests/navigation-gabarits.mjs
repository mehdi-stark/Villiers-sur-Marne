#!/usr/bin/env node
// TEST RÉEL — deux gabarits de navigation, un par contexte (décision du 07/09/2026) :
//   • téléphone : onglets en bas, à portée de pouce, aucune barre latérale ni tiroir ;
//   • ordinateur : barre latérale à sections, tout visible, aucun onglet ni menu caché.
// Ce test échoue si l'un des deux disparaît, ou si le desktop cache une destination.
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

  // --- Téléphone ---
  const m = await ouvrir(390);
  const etatM = await m.evaluate(() => ({
    onglets: getComputedStyle(document.querySelector(".onglets")).display,
    nbOnglets: document.querySelectorAll(".onglet").length,
    laterale: document.querySelector(".laterale-client") ? getComputedStyle(document.querySelector(".laterale-client")).display : "absent",
    // Un tiroir de NAVIGATION, pas le menu profil (qui est un menu de compte, légitime).
    hamburger: [...document.querySelectorAll("button")].filter((b) => !b.classList.contains("profil-bouton") && /menu|navigation/i.test(`${b.getAttribute("aria-label") ?? ""} ${b.className}`)).length,
  }));
  if (etatM.onglets === "none" || etatM.nbOnglets < 3) throw new Error(`téléphone : pas d'onglets (${JSON.stringify(etatM)})`);
  if (etatM.laterale !== "none" && etatM.laterale !== "absent") throw new Error("téléphone : une barre latérale s'affiche");
  if (etatM.hamburger > 0) throw new Error("téléphone : un menu à tiroir est apparu (anti-pattern en grand public)");
  console.log(`✓ téléphone : ${etatM.nbOnglets} onglets en bas, aucune barre latérale, aucun tiroir`);

  // --- Ordinateur ---
  const d = await ouvrir(1440);
  const etatD = await d.evaluate(() => ({
    laterale: getComputedStyle(document.querySelector(".laterale-client")).display,
    sections: [...document.querySelectorAll(".laterale-client .nav-titre")].map((n) => n.textContent),
    liens: [...document.querySelectorAll(".laterale-client .nav-lien")].map((n) => n.getAttribute("href")),
    onglets: getComputedStyle(document.querySelector(".onglets")).display,
    entete: getComputedStyle(document.querySelector(".entete")).display,
    profil: !!document.querySelector(".laterale-pied .profil-bouton"),
  }));
  if (etatD.laterale === "none") throw new Error("ordinateur : pas de barre latérale");
  if (etatD.onglets !== "none") throw new Error("ordinateur : les onglets du téléphone restent affichés");
  if (etatD.sections.length < 3) throw new Error(`ordinateur : ${etatD.sections.length} section(s) seulement`);
  if (!etatD.profil) throw new Error("ordinateur : le menu profil n'est pas dans la barre");
  // Rien de caché : les entrées jadis enfouies dans le menu profil sont des liens visibles.
  for (const attendu of ["/jour", "/", "/calendrier", "/activites", "/factures", "/demarches", "/enfants", "/appareils", "/reglages"]) {
    if (!etatD.liens.includes(attendu)) throw new Error(`ordinateur : « ${attendu} » n'est pas visible dans la barre`);
  }
  console.log(`✓ ordinateur : barre latérale, ${etatD.sections.length} sections (${etatD.sections.join(" · ")}), ${etatD.liens.length} entrées visibles, profil en bas`);
  console.log("✓ aucune destination n'est cachée sur ordinateur (les 9 attendues sont dans la barre)");
  code = 0;
} catch (e) {
  console.error("✗", e.message);
} finally {
  await nav.close();
  process.exit(code);
}
