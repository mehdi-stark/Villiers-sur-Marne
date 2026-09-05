// TEST RÉEL — l'ordonnanceur Vercel appelle la route en GET avec un Bearer. Trois cas :
// sans secret (401), avec secret hors fenêtre (rien n'est envoyé), avec secret en POST
// (l'exécution reste possible à la main). Le garde d'heure est en Europe/Paris : sans lui,
// le rappel partirait à 17 h l'été et 19 h l'hiver, l'ordonnanceur ne connaissant qu'UTC.
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3001";
const secret = /^CRON_SECRET=(.*)$/m.exec(readFileSync(".env.local", "utf8"))?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!secret) { console.error("CRON_SECRET absent de .env.local"); process.exit(1); }

const sans = await fetch(`${BASE}/api/cron/rappels`);
if (sans.status !== 401) { console.error(`✗ appel sans secret : ${sans.status} au lieu de 401`); process.exit(1); }

const avec = await fetch(`${BASE}/api/cron/rappels`, { headers: { authorization: `Bearer ${secret}` } });
const corps = await avec.json();
const heure = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).formatToParts(new Date()).find((x) => x.type === "hour").value);
const dansFenetre = heure >= 17 && heure <= 19;
if (dansFenetre && corps.statut === "hors_fenetre") { console.error(`✗ ${heure} h à Paris : la fenêtre 17h–19h devait s'ouvrir`); process.exit(1); }
if (!dansFenetre && corps.statut !== "hors_fenetre") { console.error(`✗ ${heure} h à Paris : le rappel est parti HORS de sa fenêtre`); process.exit(1); }
console.log(`✓ ordonnanceur : sans secret → 401 ; à ${heure} h Paris → ${corps.statut}${corps.statut === "hors_fenetre" ? " (aucun envoi)" : ` (${corps.resultat?.notifiees ?? 0} familles)`}`);
