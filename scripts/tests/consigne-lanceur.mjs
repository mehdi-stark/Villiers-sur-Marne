#!/usr/bin/env node
// Test RÉEL : « Prévenir l'agent maintenant » dépose une consigne au Lanceur, et
// l'écouteur du Mac la dépose dans .claude-consignes.md de CE dossier. On constate
// l'EFFET (le fichier contient le texte), jamais l'action.
import { config } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
config({ path: ".env.local" }); config();
const url = process.env.LANCEUR_URL, secret = process.env.LANCEUR_SECRET;
if (!url || !secret) { console.error("LANCEUR_URL / LANCEUR_SECRET absents"); process.exit(1); }
const marque = `[TEST ${Date.now()}]`;
const r = await fetch(`${url}/api/ecouteur?action=consigne`, { method: "POST", headers: { "Content-Type": "application/json", "x-lanceur-secret": secret }, body: JSON.stringify({ dossier: process.env.LANCEUR_DOSSIER ?? "ville", texte: `${marque} consigne de vérification — à noter traitée sans action` }) });
const d = await r.json().catch(() => ({}));
console.log(`dépôt au Lanceur : ${r.status}`, d);
if (!r.ok) process.exit(1);
const attente = Number(process.argv[2] ?? 150);
for (let t = 0; t < attente; t += 10) {
  await new Promise((res) => setTimeout(res, 10_000));
  if (existsSync(".claude-consignes.md") && readFileSync(".claude-consignes.md", "utf8").includes(marque)) { console.log(`✓ effet constaté après ${t + 10} s : la consigne est dans .claude-consignes.md`); process.exit(0); }
}
console.error(`✗ pas déposée sur le Mac après ${attente} s (l'écouteur tourne-t-il ?)`);
process.exit(1);
