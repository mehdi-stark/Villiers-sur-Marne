#!/usr/bin/env node
// Fabrique les liens de PRÉSENTATION (2 h) à envoyer avant un rendez-vous.
//   node scripts/lien-presentation.mjs [heures]
// Refuse de fabriquer quoi que ce soit si la source n'est pas fictive.
import { config } from "dotenv";
import { createHmac } from "node:crypto";
config({ path: ".env.local" }); config();
const heures = Number(process.argv[2] ?? 2);
if (!process.env.DEMO_SECRET) { console.error("DEMO_SECRET absent : le mode présentation est fermé."); process.exit(1); }
if ((process.env.SOURCE_DONNEES ?? "fictif") !== "fictif") { console.error("SOURCE_DONNEES n'est pas « fictif » : aucun lien ne sera fabriqué."); process.exit(1); }
const jeton = (email) => { const corps = `${email}|${Date.now() + heures * 3600e3}`; const sig = createHmac("sha256", process.env.DEMO_SECRET).update(`demo|${corps}`).digest("base64url"); return Buffer.from(`${corps}|${sig}`).toString("base64url"); };
const t = jeton("demo@exemple.invalid");
const famille = process.env.FAMILLE_URL ?? "https://villiers-famille.vercel.app";
const agents = process.env.AGENTS_URL ?? "https://villiers-agents.vercel.app";
console.log(`Liens de présentation, valables ${heures} h :\n  Côté parent : ${famille}/presentation?demo=${t}\n  Côté agents : ${agents}/presentation?demo=${t}\n  Vitrine     : ${famille}/decouvrir\n  Dossier PDF : ${famille}/decouvrir/dossier.pdf`);
