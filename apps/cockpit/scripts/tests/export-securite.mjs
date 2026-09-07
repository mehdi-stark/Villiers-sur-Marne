#!/usr/bin/env node
// Test RÉEL de l'export du journal de sécurité : rien ne sort sans session ; l'export
// masqué ne laisse fuir aucune adresse ; l'export nominatif LAISSE UNE TRACE — c'est la
// contrepartie du droit de le faire.
import { createHmac } from "node:crypto";
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = process.argv[2] ?? "http://localhost:3000";
const EMAIL = "mehdi.stark@gmail.com";
const corps = `${EMAIL}|${Date.now() + 36e5}`;
const sig = createHmac("sha256", process.env.AUTH_SECRET).update(`ville|${corps}`).digest("base64url");
const cookie = `ville_session=${Buffer.from(`${corps}|${sig}`).toString("base64url")}`;
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

let code = 1;
try {
  const sans = await fetch(`${BASE}/api/securite/export`);
  if (sans.status !== 401) throw new Error(`export accessible sans session : ${sans.status}`);
  console.log("✓ sans session : 401, aucune donnée ne sort");

  // On lit les OCTETS : `Response.text()` retire le BOM au décodage (spec WHATWG), donc
  // le vérifier sur la chaîne donne toujours « absent », même quand il est bien là.
  const brut = new Uint8Array(await (await fetch(`${BASE}/api/securite/export?jours=30`, { headers: { cookie } })).arrayBuffer());
  const masque = new TextDecoder("utf-8").decode(brut);
  const lignes = masque.trim().split("\n");
  if (!(brut[0] === 0xef && brut[1] === 0xbb && brut[2] === 0xbf)) throw new Error("pas de BOM : Excel afficherait mal les accents");
  const adresses = lignes.slice(1).map((l) => l.split(";")[2] ?? "");
  const enClair = adresses.filter((a) => a.includes("@") && !a.includes("•"));
  if (enClair.length > 0) throw new Error(`${enClair.length} adresse(s) en clair dans l'export masqué : ${enClair[0]}`);
  console.log(`✓ export masqué : ${lignes.length - 1} ligne(s), aucune adresse en clair, BOM présent pour Excel`);

  const avant = Number((await sql`select count(*)::int as n from journal_connexions where evenement = 'export_securite'`)[0].n);
  const nominatif = await fetch(`${BASE}/api/securite/export?jours=30&complet=1`, { headers: { cookie } });
  const corpsNom = await nominatif.text();
  const nom = nominatif.headers.get("content-disposition") ?? "";
  if (!/nominatif\.csv/.test(nom)) throw new Error(`le fichier ne s'annonce pas comme nominatif : ${nom}`);
  if (!corpsNom.includes(EMAIL)) throw new Error("l'export nominatif ne contient pas les adresses");
  const apres = Number((await sql`select count(*)::int as n from journal_connexions where evenement = 'export_securite'`)[0].n);
  if (apres !== avant + 1) throw new Error(`l'export nominatif n'a pas laissé de trace (${avant} → ${apres})`);
  const [trace] = await sql`select email, detail from journal_connexions where evenement = 'export_securite' order by cree_le desc limit 1`;
  if (trace.email !== EMAIL) throw new Error("la trace n'attribue pas l'export à son demandeur");
  console.log(`✓ export nominatif : adresses en clair, fichier annoncé « nominatif », trace laissée au nom de ${trace.email} (${trace.detail.lignes} lignes)`);
  code = 0;
} catch (e) {
  console.error("✗", e.message);
} finally {
  const purge = await sql`delete from journal_connexions where evenement = 'export_securite' returning id`;
  console.log(`purge : ${purge.length} trace(s) d'export`);
  await sql.end();
  process.exit(code);
}
