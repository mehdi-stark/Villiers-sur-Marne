#!/usr/bin/env node
// Jeu de démonstration en base (mêmes règles que le bouton du back-office).
//   node scripts/seed-demo.mjs            → pose le jeu
//   node scripts/seed-demo.mjs --purger   → l'enlève
import { config } from "dotenv";
config({ path: ".env.local" }); config();
const { poserDemo, purgerDemo } = await import("@ville/core/demo-seed");
if (process.argv.includes("--purger")) { const r = await purgerDemo(); console.log(`purgé : ${r.demarches} démarche(s), ${r.pointages} pointage(s)`); }
else { const r = await poserDemo(); console.log(`✓ jeu posé : ${r.demarches} démarches, ${r.pointages} pointages du ${r.jour}`); }
process.exit(0);
