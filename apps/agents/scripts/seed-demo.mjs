#!/usr/bin/env node
// Jeu de DÉMONSTRATION en base : quelques démarches et pointages, pour que les écrans
// montrent ce qu'ils valent (un écran vide ne se juge pas). Idempotent, purgeable.
//   node scripts/seed-demo.mjs           → pose le jeu
//   node scripts/seed-demo.mjs --purger  → l'enlève
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const MARQUE = "demo@exemple.invalid";
const purger = process.argv.includes("--purger");
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
try {
  const ids = await sql`SELECT id FROM demarches WHERE email LIKE ${"%" + "@exemple.invalid"}`;
  for (const x of ids) await sql`DELETE FROM journal_demarches WHERE demarche_id = ${x.id}`;
  const sup = await sql`DELETE FROM demarches WHERE email LIKE ${"%" + "@exemple.invalid"} RETURNING id`;
  const supRes = await sql`DELETE FROM reservations_demo WHERE acteur = ${MARQUE} RETURNING id`;
  await sql`DELETE FROM journal_reservations WHERE acteur = ${MARQUE}`;
  if (purger) { console.log(`purgé : ${sup.length} démarche(s), ${supRes.length} pointage(s)`); process.exit(0); }

  const jeu = [
    { famille: "fam-demo-3", email: "temoin-c@exemple.invalid", nom: "Famille Moreau", type: "inscription_periscolaire", etat: "deposee", pieces: ["identite", "domicile", "caf", "vaccins"], message: "Nouvelle arrivée sur la commune, rentrée en CE2 et MS." },
    { famille: "fam-demo-2", email: "temoin-b@exemple.invalid", nom: "Famille Diallo", type: "quotient_familial", etat: "deposee", pieces: ["imposition", "caf"], message: "Premier calcul de quotient, deux enfants." },
    { famille: "fam-demo-5", email: "temoin-e@exemple.invalid", nom: "Famille Rossi", type: "coordonnees", etat: "en_cours", pieces: ["domicile"], message: "Déménagement à l'intérieur de la commune." },
  ];
  for (const d of jeu) {
    const [row] = await sql`INSERT INTO demarches (famille_id, email, type, etat, donnees) VALUES (${d.famille}, ${d.email}, ${d.type}, ${d.etat}, ${sql.json({ message: d.message, famille: d.nom })}) RETURNING id`;
    for (const code of d.pieces) await sql`INSERT INTO pieces (demarche_id, code, nom, mime, taille, contenu_base64) VALUES (${row.id}, ${code}, ${code + ".png"}, ${"image/png"}, ${72}, ${png})`;
    await sql`INSERT INTO journal_demarches (demarche_id, avant, apres, acteur, app) VALUES (${row.id}, ${null}, ${"deposee"}, ${d.email}, ${"famille"})`;
  }
  // Pointages du JOUR : quelques présents, un absent — pour que la file du jour vive.
  const jour = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
  const pointages = [["enf-1", "presence"], ["enf-3", "presence"], ["enf-5", "presence"], ["enf-7", "absence"], ["enf-10", "presence"]];
  for (const [enfant, etat] of pointages) {
    await sql`INSERT INTO reservations_demo (enfant_id, activite_id, date, etat, acteur, app) VALUES (${enfant}, ${"cantine"}, ${jour}, ${etat}, ${MARQUE}, ${"agents"})
      ON CONFLICT (enfant_id, activite_id, date) DO UPDATE SET etat = ${etat}, acteur = ${MARQUE}`;
    await sql`INSERT INTO journal_reservations (enfant_id, activite_id, date, avant, apres, acteur, app) VALUES (${enfant}, ${"cantine"}, ${jour}, ${"reservee"}, ${etat}, ${MARQUE}, ${"agents"})`;
  }
  console.log(`✓ jeu de démonstration posé : ${jeu.length} démarches (2 nouvelles, 1 en cours), ${pointages.length} pointages du ${jour}`);
} finally { await sql.end(); }
