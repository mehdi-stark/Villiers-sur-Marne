import assert from "node:assert/strict";
import { test } from "node:test";
import { analyse, GRILLE, noteEffective, pnlCommuneAn, PLAFOND_SANS_PREUVE, score, SEUILS, verdictDuScore, verdictFinal, type Critere } from "../../lib/marche";

const c = (note: number, preuve: string | null, poids = 100): Critere => ({ cle: "x", dimension: "x", poids, note, preuve, source: "", faille: "" });

test("une note sans preuve est plafonnée par code", () => {
  assert.equal(noteEffective(c(9, null)), PLAFOND_SANS_PREUVE);
  assert.equal(noteEffective(c(9, "mesuré")), 9);
  assert.equal(noteEffective(c(2, null)), 2);
});

test("le score est la moyenne pondérée sur 100 et refuse une grille qui ne pèse pas 100", () => {
  assert.equal(score([c(10, "p", 50), c(0, "p", 50)]), 50);
  assert.throws(() => score([c(10, "p", 60)]));
});

test("les seuils rendent GO / GO conditionnel / NO-GO", () => {
  assert.equal(verdictDuScore(SEUILS.go), "GO");
  assert.equal(verdictDuScore(SEUILS.go - 1), "GO conditionnel");
  assert.equal(verdictDuScore(SEUILS.conditionnel - 1), "NO-GO");
});

test("une faille haute dégrade le verdict d'un cran", () => {
  const go = [c(8, "p", 100)];
  assert.equal(verdictFinal(go, []).final, "GO");
  assert.equal(verdictFinal(go, [{ titre: "", gravite: "haute", detail: "", parade: "" }]).final, "GO conditionnel");
  assert.equal(verdictFinal([c(6, "p", 100)], [{ titre: "", gravite: "haute", detail: "", parade: "" }]).final, "NO-GO");
});

test("le P&L B2G : marge = prix HT − coûts, sans TVA", () => {
  const p = pnlCommuneAn({ prixAnnuelHT: 10000, hebergementAnnuel: 1000, supportHeuresParMois: 1, tauxHoraire: 100, devInitialHeures: 100, amortissementAnnees: 4, retardPaiementJours: 0, tauxTresorerie: 0 });
  assert.equal(p.couts.support, 1200);
  assert.equal(p.couts.amortissementDev, 2500);
  assert.equal(p.margeNette, 10000 - 1000 - 1200 - 2500);
  assert.equal(p.margePct, 53);
  assert.equal(p.viable, true);
});

test("la grille du projet pèse 100 et l'analyse rend un verdict cohérent avec les seuils", () => {
  assert.equal(GRILLE.reduce((s, x) => s + x.poids, 0), 100);
  const a = analyse();
  assert.equal(a.brut, verdictDuScore(a.score));
  // deux critères sans preuve → plafonnés, quelle que soit la note proposée
  for (const x of a.grille.filter((g) => !g.preuve)) assert.ok(noteEffective(x) <= PLAFOND_SANS_PREUVE);
});
