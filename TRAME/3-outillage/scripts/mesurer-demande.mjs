#!/usr/bin/env node
// Mesure GRATUITE de la largeur d'intention d'une requête via l'autocomplétion
// Google (ce que les gens TAPENT réellement) — par pays/langue.
//   node mesurer-demande.mjs "kit tricot débutant" --hl fr --gl fr
// Sortie : nombre de suggestions distinctes + exemples. Une largeur FORTE
// (≥ 8) = demande établie ; FAIBLE (≤ 2) = intention très étroite. C'est un
// signal, pas un volume : le volume vient d'une source payante (DataForSEO…).
const q = process.argv[2]; if (!q) { console.error("requête manquante"); process.exit(1); }
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const hl = arg("hl", "fr"), gl = arg("gl", "fr");
const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${hl}&gl=${gl}&q=${encodeURIComponent(q)}`;
const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
const [, suggestions] = await res.json();
const distinctes = [...new Set(suggestions.map((s) => s.toLowerCase().trim()))].filter((s) => s !== q.toLowerCase());
const largeur = distinctes.length >= 8 ? "FORTE" : distinctes.length >= 3 ? "MOYENNE" : distinctes.length ? "FAIBLE" : "NULLE";
console.log(JSON.stringify({ requete: q, hl, gl, largeur, suggestions: distinctes.length, exemples: distinctes.slice(0, 6) }, null, 2));
