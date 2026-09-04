import assert from "node:assert/strict";
import { test } from "node:test";
import { calculerFacture } from "../src/donnees/facturation";
import { refdetPour, urlPayfip } from "../src/paiement/payfip";
import type { Activite, Enfant, Famille } from "../src/donnees/types";

const fam: Famille = { id: "f", nom: "F", email: "f@x.y", quotientFamilial: 812, exterieur: false, communeId: "c" }; // tranche 6
const enfants: Enfant[] = [{ id: "e", familleId: "f", prenom: "E", naissance: "2019-01-01", ecole: "X", classe: "GS" }];
const cantine: Activite = { id: "cantine", type: "cantine", libelle: "Repas", horaires: "", tarifsParTranche: [99, 167, 266, 342, 387, 428, 479, 516, 551, 673], prevenance: { joursAvant: 7, type: "francs", heureLimite: "23:59", source: "t" }, joursServis: [1, 2, 4, 5], public: "tous" };
const matin: Activite = { id: "matin", type: "accueil_matin", libelle: "Matin", horaires: "", tarifsParTranche: [288, 329, 354, 376, 416, 452, 474, 497, 520, 672], forfaitMensuel: { montants: [1797, 2005, 2162, 2329, 2511, 2701, 2909, 3048, 3185, 4009], declencheA: 7 }, prevenance: { joursAvant: 0, type: "francs", heureLimite: "07:30", source: "t" }, joursServis: [1, 2, 4, 5], public: "tous" };

test("présences et absences réservées se facturent au tarif ; annulées = 0 ; exonérée = 0", () => {
  const f = calculerFacture({ famille: fam, enfants, activites: [cantine], periode: "2026-09", exonerees: new Set(["e|cantine|2026-09-08"]), reservations: [
    { enfantId: "e", activiteId: "cantine", date: "2026-09-07", etat: "presence" },
    { enfantId: "e", activiteId: "cantine", date: "2026-09-08", etat: "absence" },
    { enfantId: "e", activiteId: "cantine", date: "2026-09-10", etat: "absence" },
    { enfantId: "e", activiteId: "cantine", date: "2026-09-11", etat: "annulee" },
    { enfantId: "e", activiteId: "cantine", date: "2026-10-01", etat: "presence" },
  ] });
  assert.equal(f.tranche, 6);
  assert.deepEqual(f.lignes.map((l) => l.motif), ["presence", "absence_facturee"]);
  assert.equal(f.total, 428 * 2);
});

test("le forfait mensuel remplace les unités dès N fréquentations", () => {
  const res = Array.from({ length: 8 }, (_, i) => ({ enfantId: "e", activiteId: "matin", date: `2026-09-${String(i + 1).padStart(2, "0")}`, etat: "presence" as const }));
  const f = calculerFacture({ famille: fam, enfants, activites: [matin], periode: "2026-09", reservations: res });
  assert.equal(f.forfaits.length, 1);
  assert.equal(f.forfaits[0]!.frequentations, 8);
  assert.equal(f.total, 2701); // forfait tranche 6, au lieu de 8 × 4,52
  const f6 = calculerFacture({ famille: fam, enfants, activites: [matin], periode: "2026-09", reservations: res.slice(0, 6) });
  assert.equal(f6.forfaits.length, 0);
  assert.equal(f6.total, 6 * 452);
});

test("PayFIP : pas d'URL sans numéro client ; URL conforme avec", () => {
  delete process.env.PAYFIP_NUMCLI;
  assert.equal(urlPayfip({ refdet: "FAC202609", montantCentimes: 1712, email: "a@b.c", objet: "Périscolaire 2026-09", urlRetour: "https://x/retour" }).ok, false);
  process.env.PAYFIP_NUMCLI = "012345";
  const r = urlPayfip({ refdet: refdetPour("fac-fam-demo-1-2026-09"), montantCentimes: 1712, email: "a@b.c", objet: "Périscolaire 2026-09", urlRetour: "https://x/retour", exercice: 2026 });
  assert.equal(r.ok, true);
  if (r.ok) { assert.match(r.url, /^https:\/\/www\.payfip\.gouv\.fr\/tpa\/paiement\.web\?numcli=012345&exer=2026&refdet=FACFAMDEMO1202609&montant=1712/); assert.equal(r.saisie, "T"); }
});
