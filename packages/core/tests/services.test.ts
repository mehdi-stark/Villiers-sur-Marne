import assert from "node:assert/strict";
import { test } from "node:test";
import { ACTIVITES } from "../src/donnees/fictif";
import { grouperParService, reservable, service, trierParJournee } from "../src/donnees/services";

test("chaque activité a un service nommé en toutes lettres et un ordre de journée", () => {
  for (const a of ACTIVITES) {
    const s = service(a);
    assert.ok(s.nom.length > 6, a.id);
    assert.ok(s.nomCourt.length > 2, a.id);
    assert.ok(s.ordre >= 1);
  }
  const ordres = trierParJournee(ACTIVITES).map((a) => service(a).ordre);
  assert.deepEqual(ordres, [...ordres].sort((x, y) => x - y));
});

test("les services sans réservation sont distingués (inscription annuelle)", () => {
  const parId = Object.fromEntries(ACTIVITES.map((a) => [a.id, a]));
  assert.equal(reservable(parId["cantine"]!), true);
  assert.equal(reservable(parId["alsh-mercredi"]!), true);
  assert.equal(reservable(parId["matin"]!), false);
  assert.equal(reservable(parId["soir-mat"]!), false);
  assert.equal(reservable(parId["etude"]!), false);
});

test("les trois formules du mercredi forment UN service", () => {
  const groupes = grouperParService(ACTIVITES);
  const alsh = groupes.find((g) => g.groupe === "alsh_mercredi");
  assert.ok(alsh);
  assert.equal(alsh.formules.length, 3);
  assert.equal(alsh.service.nomGroupe, "Accueil de loisirs du mercredi");
  assert.deepEqual(alsh.formules.map((f) => service(f).formule), ["Journée", "Matinée (repas compris)", "Après-midi (sans repas)"]);
  // La cantine reste un service à une seule formule.
  assert.equal(groupes.find((g) => g.groupe === "cantine")!.formules.length, 1);
  assert.equal(groupes.length, 5); // matin, cantine, étude, soir, loisirs du mercredi
});
