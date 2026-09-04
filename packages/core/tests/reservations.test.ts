import assert from "node:assert/strict";
import { test } from "node:test";
import { fusionner } from "../src/donnees/reservations";

test("une ligne persistée l'emporte sur la fixture, les autres restent", () => {
  const fixes = [{ enfantId: "e", activiteId: "cantine", date: "2026-09-07", etat: "reservee" as const }, { enfantId: "e", activiteId: "cantine", date: "2026-09-08", etat: "reservee" as const }];
  const r = fusionner(fixes, [{ enfantId: "e", activiteId: "cantine", date: "2026-09-07", etat: "annulee" }]);
  assert.equal(r.find((x) => x.date === "2026-09-07")?.etat, "annulee");
  assert.equal(r.find((x) => x.date === "2026-09-08")?.etat, "reservee");
  assert.equal(r.length, 2);
});
