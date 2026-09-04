import assert from "node:assert/strict";
import { test } from "node:test";
import { ACTIVITES, definirPersistance, ECOLES, sourceFictive } from "../src/donnees/fictif";

// Test UNITAIRE : pas de base — la couche persistée est vide ici (elle est testée en réel par tap-reservation.mjs).
definirPersistance(async () => []);
import { SOURCES } from "../src/donnees/index";

test("chaque activité porte 10 tarifs (tranches 1-9 + extérieurs) et une source", () => {
  for (const a of ACTIVITES) {
    assert.equal(a.tarifsParTranche.length, 10, a.id);
    assert.ok(a.prevenance.source.length > 10, a.id);
    if (a.forfaitMensuel) assert.equal(a.forfaitMensuel.montants.length, 10, a.id);
  }
  assert.equal(ECOLES.length, 15);
});

test("la source fictive sert une famille, ses enfants, ses réservations et une facture cohérente", async () => {
  const f = await sourceFictive.famille("fam-demo-1");
  assert.ok(f);
  const enfants = await sourceFictive.enfants(f.id);
  assert.equal(enfants.length, 2);
  const res = await sourceFictive.reservations(enfants[0]!.id, "2026-09-01", "2026-09-30");
  assert.ok(res.length > 10);
  const [fac] = await sourceFictive.factures(f.id);
  assert.ok(fac);
  assert.equal(fac.montant, fac.lignes.reduce((s, l) => s + l.montant, 0));
});

test("les sources export/api existent mais disent qu'elles ne sont pas branchées", async () => {
  for (const nom of ["export-agora", "api-agora"]) {
    const d = await SOURCES[nom]!.disponible();
    assert.equal(d.ok, false);
    await assert.rejects(SOURCES[nom]!.activites());
  }
});
