#!/usr/bin/env node
// Parts de marché et HHI d'un produit vendu aux collectivités, MESURÉS sur les
// DECP (data.economie.gouv.fr) — titulaires par SIRET, nommés via l'API Sirene.
//   node scripts/mesurer-hhi.mjs "portail famille" [--min 5000] [--max 1000000]
// HHI : < 1 500 fragmenté · 1 500-2 500 modéré · > 2 500 concentré (seuils DOJ/FTC).
const q = process.argv[2] ?? "portail famille";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? Number(process.argv[i + 1]) : d; };
const MIN = arg("min", 5000), MAX = arg("max", 1_000_000);
const EXCLURE = /PC PORTABLE|CASERNE|IMPRESSION|ELAGAGE|MOBILIER|TRAVAUX|ASSISTANTES FAMILIALES|terrains fam/i;
const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records?where=${encodeURIComponent(`search(objet,"${q}")`)}&limit=100&order_by=datenotification%20desc`;
const { results, total_count } = await (await fetch(url)).json();
const ok = results.filter((r) => r.montant && !EXCLURE.test(r.objet ?? "") && r.montant >= MIN && r.montant <= MAX);
const parts = new Map();
for (const r of ok) { const s = String(r.titulaire_id_1 ?? "?"); const p = parts.get(s) ?? { n: 0, montant: 0 }; p.n++; p.montant += r.montant; parts.set(s, p); }
const N = ok.length, M = [...parts.values()].reduce((s, p) => s + p.montant, 0);
const hhiN = Math.round([...parts.values()].reduce((s, p) => s + ((p.n / N) * 100) ** 2, 0));
const hhiM = Math.round([...parts.values()].reduce((s, p) => s + ((p.montant / M) * 100) ** 2, 0));
const forme = (h) => (h < 1500 ? "fragmenté" : h <= 2500 ? "modérément concentré" : "concentré");
async function nom(siret) {
  try { const d = await (await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}`)).json(); return d.results?.[0]?.nom_complet ?? "?"; } catch { return "?"; }
}
const tete = [...parts.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 8);
const lignes = [];
for (const [s, p] of tete) lignes.push({ siret: s, nom: await nom(s), marches: p.n, partMarches: +((p.n / N) * 100).toFixed(1), montant: Math.round(p.montant), partMontant: +((p.montant / M) * 100).toFixed(1) });
console.log(JSON.stringify({ requete: q, releveLe: new Date().toISOString().slice(0, 10), total: total_count, exploitables: N, titulaires: parts.size, hhiMarches: hhiN, hhiMontants: hhiM, forme: forme(hhiN), partLeaderMarches: lignes[0]?.partMarches, tete: lignes }, null, 2));
