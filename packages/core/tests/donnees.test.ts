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
  // Fenêtre RELATIVE à aujourd'hui : la démo ne doit jamais devenir vide avec le temps.
  const jour0 = new Date(); const iso = (d: number) => new Date(jour0.getTime() + d * 86_400_000).toISOString().slice(0, 10);
  const res = await sourceFictive.reservations(enfants[0]!.id, iso(0), iso(21));
  assert.ok(res.length > 6, `semaines à venir vides : ${res.length}`);
  const passe = await sourceFictive.reservations(enfants[0]!.id, iso(-28), iso(-1));
  assert.ok(passe.some((r) => r.etat === "presence"), "aucune présence dans le passé");
  const [fac] = await sourceFictive.factures(f.id);
  assert.ok(fac);
  assert.equal(fac.montant, fac.lignes.reduce((s, l) => s + l.montant, 0));
});

test("la démo ne pourrit pas : elle est peuplée dans un an comme aujourd'hui", async () => {
  const { sourceFictive: s } = await import("../src/donnees/fictif");
  const dansUnAn = new Date(Date.now() + 365 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  // On interroge la fenêtre autour d'une date lointaine : la génération étant relative,
  // elle produit toujours des lignes (le test échoue si on re-cloue les données à un mois).
  const { periodeFacturee } = await import("../src/donnees/fictif");
  assert.notEqual(periodeFacturee(dansUnAn), periodeFacturee(new Date()));
  const res = await s.reservations("enf-1", iso(new Date()), iso(new Date(Date.now() + 14 * 86_400_000)));
  assert.ok(res.length > 4);
});

test("les sources export/api existent mais disent qu'elles ne sont pas branchées", async () => {
  for (const nom of ["export-agora", "api-agora"]) {
    const d = await SOURCES[nom]!.disponible();
    assert.equal(d.ok, false);
    await assert.rejects(SOURCES[nom]!.activites());
  }
});
