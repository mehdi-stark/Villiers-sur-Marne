import assert from "node:assert/strict";
import { test } from "node:test";
import { dateLimite, decalageParis, tarif, tarifNonReserve, trancheDe, verdictDelai } from "../../lib/donnees/regles";
import type { Activite } from "../../lib/donnees/types";

const cantine: Activite = { id: "cantine", type: "cantine", libelle: "Cantine", horaires: "", tarifsParTranche: [99, 167, 266, 342, 387, 428, 479, 516, 551, 673], prevenance: { joursAvant: 2, type: "ouvres", heureLimite: "12:00", source: "test" }, joursServis: [1, 2, 3, 4, 5], public: "tous" };
const mercredi: Activite = { ...cantine, id: "alsh", type: "alsh_mercredi_journee", prevenance: { joursAvant: 7, type: "francs", heureLimite: "23:59", source: "test" } };

test("la date limite saute le week-end : 2 jours ouvrés avant un lundi = le jeudi précédent", () => {
  const l = dateLimite(cantine, "2026-09-14"); // lundi
  assert.equal(l.toISOString().slice(0, 10), "2026-09-10"); // jeudi
});

test("l'heure limite est en heure de Paris (été = UTC+2)", () => {
  const l = dateLimite(cantine, "2026-09-14");
  assert.equal(l.toISOString(), "2026-09-10T10:00:00.000Z");
  assert.equal(decalageParis(new Date("2026-07-01T00:00:00Z")), 2);
  assert.equal(decalageParis(new Date("2026-12-01T00:00:00Z")), 1);
});

test("le verdict dit jusqu'à quand, et refuse après", () => {
  const avant = verdictDelai(cantine, "2026-09-14", new Date("2026-09-10T09:59:00Z"));
  const apres = verdictDelai(cantine, "2026-09-14", new Date("2026-09-10T10:01:00Z"));
  assert.equal(avant.possible, true);
  assert.match(avant.libelle, /Modifiable jusqu'au jeudi 10 septembre/);
  assert.equal(apres.possible, false);
  assert.match(apres.libelle, /Délai dépassé/);
});

test("7 jours francs avant un mercredi = le mercredi précédent (week-end compté)", () => {
  assert.equal(dateLimite(mercredi, "2026-09-16").toISOString().slice(0, 10), "2026-09-09");
});

test("tranches 2025-2026 : bornes réelles, tranche 9 sans QF, 10 pour les extérieurs", () => {
  assert.equal(trancheDe(230), 1);
  assert.equal(trancheDe(231), 2);
  assert.equal(trancheDe(575), 4);
  assert.equal(trancheDe(1251), 9);
  assert.equal(trancheDe(null), 9);
  assert.equal(trancheDe(300, true), 10);
  assert.equal(tarif(cantine, trancheDe(800)), 428); // tranche 6 : 4,28 €
});

test("non réservé = 2 × le tarif ; repas non réservé sans QF = 11,02 €", () => {
  assert.equal(tarifNonReserve(cantine, 6, true), 856);
  assert.equal(tarifNonReserve(cantine, 9, false), 1102);
});
