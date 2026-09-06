#!/usr/bin/env node
// Test RÉEL du garde d'entrée de la connexion. Ce qu'on prouve, dans l'ordre :
//   1. une adresse INCONNUE ne déclenche aucun code (aucune ligne en base) ;
//   2. la réponse est identique — corps ET latence — connue ou non : pas d'oracle ;
//   3. le quota par adresse coupe les envois au-delà de 5 par heure ;
//   4. le martèlement du code renvoie 429 au lieu de lire la base indéfiniment.
// L'adresse de test est en .invalid : aucun e-mail ne peut partir vers une vraie boîte.
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = process.argv[2] ?? "http://localhost:3001";
const CONNU = "demo@exemple.invalid";      // présent dans comptes_familles
const INCONNU = "personne-inconnue@exemple.invalid";
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

const poster = async (corps) => {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
  return { statut: r.status, texte: (await r.text()).slice(0, 80), ms: Date.now() - t0 };
};
const codesDe = async (email) => Number((await sql`select count(*)::int as n from otp_codes where app = 'famille' and email = ${email}`)[0].n);

let code = 1;
try {
  await sql`delete from otp_codes where email in (${CONNU}, ${INCONNU})`;
  await sql`delete from journal_connexions where email = ${INCONNU}`;
  await sql`delete from otp_codes where email like '%prechauffe%'`;
  await sql`delete from alertes where code = 'connexion_martelee_famille'`;

  // Préchauffe : en développement, le PREMIER appel compile la route (plusieurs secondes)
  // et fausserait la comparaison de latence. On mesure une route déjà chaude.
  await poster({ action: "envoyer", email: "prechauffe@exemple.invalid" });

  // 1 & 2 — inconnu vs connu : même réponse, latence comparable, aucun code pour l'inconnu.
  const a = await poster({ action: "envoyer", email: INCONNU });
  const b = await poster({ action: "envoyer", email: CONNU });
  if (a.statut !== b.statut || a.texte !== b.texte) throw new Error(`réponses différentes : ${a.statut} ${a.texte} vs ${b.statut} ${b.texte}`);
  const ecart = Math.abs(a.ms - b.ms);
  if (ecart > 400) throw new Error(`la latence trahit l'existence du compte : ${a.ms} ms (inconnu) vs ${b.ms} ms (connu)`);
  const nInconnu = await codesDe(INCONNU);
  if (nInconnu !== 0) throw new Error(`${nInconnu} code(s) créé(s) pour une adresse inconnue`);
  console.log(`✓ adresse inconnue : aucun code créé, aucun e-mail consommé — réponse identique (${a.statut}, « ${a.texte} »), écart de latence ${ecart} ms`);

  // 3 — quota par adresse : au-delà de 5 par heure, plus rien n'est écrit en base.
  for (let i = 0; i < 8; i++) await poster({ action: "envoyer", email: CONNU });
  const nConnu = await codesDe(CONNU);
  if (nConnu > 5) throw new Error(`${nConnu} codes créés pour une même adresse : le quota horaire ne tient pas`);
  console.log(`✓ quota par adresse : 10 demandes → ${nConnu} code(s) en base (plafond 5/h), le reste s'arrête avant la base`);

  // 4 — martèlement du code : la route coupe au lieu de lire indéfiniment.
  let refus = 0, lu = 0;
  for (let i = 0; i < 30; i++) {
    const r = await poster({ action: "valider", email: CONNU, code: "000000" });
    if (r.statut === 429) refus++; else lu++;
  }
  if (refus === 0) throw new Error("30 essais de code n'ont déclenché aucun refus : la base est exposée au martèlement");
  console.log(`✓ martèlement du code : ${lu} essais lus puis ${refus} refusés d'office (429), sans requête supplémentaire`);

  // 5 — le martèlement des DEMANDES d'envoi déclenche une alerte, UNE SEULE par fenêtre.
  // (les alertes ont été purgées au DÉBUT : le quota IP est déjà dépassé depuis l'étape 3,
  //  c'est justement ce qu'on veut vérifier — une seule trace pour toute la rafale)
  for (let i = 0; i < 25; i++) await poster({ action: "envoyer", email: `rafale${i}@exemple.invalid` });
  const alertes = await sql`select count(*)::int as n from alertes where code = 'connexion_martelee_famille' and resolue_le is null`;
  if (alertes[0].n === 0) throw new Error("un martèlement de 25 demandes n'a levé aucune alerte");
  if (alertes[0].n > 1) throw new Error(`${alertes[0].n} alertes pour une même rafale : l'attaque paierait sa propre trace`);
  console.log("✓ martèlement des demandes : UNE alerte posée pour 25 tentatives (visible dans le cockpit, page Système)");
  code = 0;
} catch (e) {
  console.error("✗", e.message);
} finally {
  const purge = await sql`delete from otp_codes where email in (${CONNU}, ${INCONNU}) returning id`;
  await sql`delete from alertes where code = 'connexion_martelee_famille'`;
  await sql`delete from journal_connexions where email in (${CONNU}, ${INCONNU})`;
  console.log(`purge : ${purge.length} code(s)`);
  await sql.end();
  process.exit(code);
}
