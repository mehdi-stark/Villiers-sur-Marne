#!/usr/bin/env node
// L'agent prévient l'opérateur sur son téléphone : une décision attend, un verdict est rendu.
//   node scripts/notifier.mjs "Titre" "Corps" [/url]   (COCKPIT_URL + AGENT_SECRET dans .env.local)
// Le résultat dit combien d'appareils ont reçu — « 0 envoyé » n'est pas un succès.
import { config } from "dotenv";
config({ path: ".env.local" }); config();
const [titre, corps = "", url = "/"] = process.argv.slice(2);
if (!titre) { console.error("usage : notifier.mjs \"Titre\" \"Corps\" [/url]"); process.exit(1); }
const base = process.env.COCKPIT_URL ?? "http://localhost:3000";
if (!process.env.AGENT_SECRET) { console.error("AGENT_SECRET absent de .env.local"); process.exit(1); }
const r = await fetch(`${base}/api/agent`, { method: "POST", headers: { "Content-Type": "application/json", "x-agent-secret": process.env.AGENT_SECRET }, body: JSON.stringify({ titre, corps, url }) });
const d = await r.json().catch(() => ({}));
if (!r.ok) { console.error(`✗ ${r.status}`, d); process.exit(1); }
console.log(`${d.envoyes ? "✓" : "⚠️"} ${d.envoyes}/${d.abonnes} appareil(s) notifié(s)${d.purges ? `, ${d.purges} purgé(s)` : ""}${d.abonnes === 0 ? " — personne n'est abonné : active les notifications depuis le cockpit installé" : ""}`);
