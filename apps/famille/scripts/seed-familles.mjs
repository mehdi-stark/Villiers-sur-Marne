#!/usr/bin/env node
// Comptes de démo du portail famille : e-mail → famille de la source. Idempotent.
//   node scripts/seed-familles.mjs admin@delivup.io=fam-demo-1 test@ville.local=fam-demo-2
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" }); config();
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const paires = process.argv.slice(2).map((s) => s.split("=")).filter((p) => p.length === 2);
if (!paires.length) { console.error("usage : seed-familles.mjs email=familleId …"); process.exit(1); }
for (const [email, familleId] of paires) {
  await sql`INSERT INTO comptes_familles (email, famille_id, commune_id) VALUES (${email.toLowerCase()}, ${familleId}, ${process.env.COMMUNE_ID ?? "villiers-sur-marne"}) ON CONFLICT (email) DO UPDATE SET famille_id = ${familleId}`;
  console.log(`✓ ${email} → ${familleId}`);
}
await sql.end();
