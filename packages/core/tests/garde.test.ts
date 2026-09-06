import { strict as assert } from "node:assert";
import { test, beforeEach } from "node:test";
import { autoriseCache, garderDemandeOtp, quota, reinitialiserGarde, repondreEnAuMoins } from "../src/garde";

beforeEach(() => reinitialiserGarde());

test("le quota laisse passer jusqu'au maximum, puis refuse", () => {
  for (let i = 0; i < 3; i++) assert.equal(quota("k", 3, 1000).ok, true, `tentative ${i + 1}`);
  assert.equal(quota("k", 3, 1000).ok, false);
});

test("la fenêtre se rouvre une fois écoulée", () => {
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i++) quota("k", 3, 1000, t0);
  assert.equal(quota("k", 3, 1000, t0).ok, false);
  assert.equal(quota("k", 3, 1000, t0 + 1001).ok, true, "la fenêtre suivante repart à zéro");
});

test("les clés sont indépendantes : une IP bruyante n'enferme pas les autres", () => {
  for (let i = 0; i < 5; i++) quota("ip|a", 3, 1000);
  assert.equal(quota("ip|b", 3, 1000).ok, true);
});

test("une adresse mal formée est rejetée SANS toucher à l'autorisation", async () => {
  let appels = 0;
  const v = await garderDemandeOtp({ app: "t", email: "pas-une-adresse", ip: "1.2.3.4", autorise: () => { appels++; return true; } });
  assert.equal(v.passe, false);
  assert.equal((v as { motif: string }).motif, "format");
  assert.equal(appels, 0, "la base ne doit pas être interrogée pour une adresse invalide");
});

test("le martèlement d'une IP s'arrête AVANT la vérification en base", async () => {
  let appels = 0;
  const autorise = () => { appels++; return false; };
  const regles = { parIp: { max: 4, fenetreMs: 60_000 }, parEmail: { max: 50, fenetreMs: 60_000 } };
  for (let i = 0; i < 20; i++) {
    await garderDemandeOtp({ app: "t", email: `inconnu${i}@exemple.invalid`, ip: "9.9.9.9", autorise, regles });
  }
  assert.equal(appels, 4, "seules les tentatives sous le quota atteignent la base");
});

test("le quota par adresse tient même si l'IP change (rotation de proxy)", async () => {
  const regles = { parIp: { max: 100, fenetreMs: 60_000 }, parEmail: { max: 3, fenetreMs: 60_000 } };
  const essais = [];
  for (let i = 0; i < 5; i++) {
    essais.push(await garderDemandeOtp({ app: "t", email: "cible@exemple.invalid", ip: `10.0.0.${i}`, autorise: () => true, regles }));
  }
  assert.deepEqual(essais.map((e) => e.passe), [true, true, true, false, false]);
});

test("l'autorisation est mise en cache, positive ET négative", async () => {
  let appels = 0;
  const verifier = () => { appels++; return false; };
  for (let i = 0; i < 5; i++) await autoriseCache("t", "x@exemple.invalid", verifier);
  assert.equal(appels, 1, "une rafale sur la même adresse ne coûte qu'une lecture");
});

test("le cache expire, pour qu'un compte créé soit reconnu vite", async () => {
  let valeur = false;
  const verifier = () => valeur;
  assert.equal(await autoriseCache("t", "y@exemple.invalid", verifier, 1), false);
  valeur = true;
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(await autoriseCache("t", "y@exemple.invalid", verifier, 1), true);
});

test("le délai plancher empêche la latence de devenir un oracle", async () => {
  const t0 = Date.now();
  await repondreEnAuMoins(t0, 60, null);
  assert.ok(Date.now() - t0 >= 55, "la réponse doit attendre le plancher");
});

test("les applications ne partagent pas leurs quotas", async () => {
  const regles = { parIp: { max: 2, fenetreMs: 60_000 }, parEmail: { max: 9, fenetreMs: 60_000 } };
  const a = [];
  for (let i = 0; i < 3; i++) a.push(await garderDemandeOtp({ app: "famille", email: "z@exemple.invalid", ip: "7.7.7.7", autorise: () => true, regles }));
  const b = await garderDemandeOtp({ app: "agents", email: "z@exemple.invalid", ip: "7.7.7.7", autorise: () => true, regles });
  assert.equal(a[2]!.passe, false);
  assert.equal(b.passe, true, "le back-office n'hérite pas du quota du portail");
});
