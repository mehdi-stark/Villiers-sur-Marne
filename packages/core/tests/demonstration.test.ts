import assert from "node:assert/strict";
import { test } from "node:test";
import { demonstrationActive, jetonDemo, verifierDemo } from "../src/demonstration";

test("le mode présentation est FERMÉ sans secret", async () => {
  delete process.env.DEMO_SECRET;
  assert.equal(demonstrationActive().ok, false);
  assert.equal((await verifierDemo("peu-importe")).ok, false);
});

test("il ne s'ouvre jamais sur une source non fictive", async () => {
  process.env.DEMO_SECRET = "secret-de-test";
  process.env.SOURCE_DONNEES = "api-agora";
  const r = demonstrationActive();
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.cause, /JAMAIS sur des données réelles/);
  process.env.SOURCE_DONNEES = "fictif";
  assert.equal(demonstrationActive().ok, true);
});

test("un jeton valide ouvre, un jeton expiré ou altéré non", async () => {
  process.env.DEMO_SECRET = "secret-de-test";
  process.env.SOURCE_DONNEES = "fictif";
  const bon = await jetonDemo("demo@exemple.invalid");
  const v = await verifierDemo(bon);
  assert.equal(v.ok, true);
  if (v.ok) assert.equal(v.email, "demo@exemple.invalid");
  assert.equal((await verifierDemo(await jetonDemo("demo@exemple.invalid", -1000))).ok, false);
  assert.equal((await verifierDemo(bon.slice(0, -2) + "xy")).ok, false);
});
