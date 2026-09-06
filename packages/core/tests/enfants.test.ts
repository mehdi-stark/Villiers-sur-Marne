import { strict as assert } from "node:assert";
import { test } from "node:test";
import { verifierRattachement } from "../src/donnees/enfants";
import { ECOLES } from "../src/donnees/fictif";

const base = { familleId: "fam-1", prenom: "Lina", naissance: "2019-04-12", ecole: ECOLES[0]!.nom, classe: "GS" };

test("un rattachement complet et plausible est accepté", () => {
  assert.equal(verifierRattachement(base).ok, true);
});

test("une école hors de la commune est refusée — on ne rattache pas n'importe où", () => {
  const r = verifierRattachement({ ...base, ecole: "École de Paris 12e" });
  assert.equal(r.ok, false);
  assert.match((r as { message: string }).message, /groupes scolaires/);
});

test("une date de naissance non plausible est refusée", () => {
  for (const naissance of ["1970-01-01", "2099-01-01"]) {
    assert.equal(verifierRattachement({ ...base, naissance }).ok, false, naissance);
  }
});

test("le format de date est exigé (un agent tape vite)", () => {
  assert.equal(verifierRattachement({ ...base, naissance: "12/04/2019" }).ok, false);
});

test("prénom et classe sont obligatoires", () => {
  assert.equal(verifierRattachement({ ...base, prenom: "L" }).ok, false);
  assert.equal(verifierRattachement({ ...base, classe: "" }).ok, false);
});
