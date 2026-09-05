import assert from "node:assert/strict";
import { test } from "node:test";
import { COMMUNES, contraste, jetonsCommune } from "../src/communes";

test("la couleur d'ACTION de chaque commune est lisible sur blanc (WCAG AA, 4,5)", () => {
  for (const c of Object.values(COMMUNES)) {
    const r = contraste(c.accent, "#ffffff");
    assert.ok(r >= 4.5, `${c.nom} : accent ${c.accent} → ${r.toFixed(2)}:1 sur blanc`);
  }
});

test("la couleur d'action en thème sombre est lisible sur le fond sombre", () => {
  for (const c of Object.values(COMMUNES)) {
    const r = contraste(c.accentSombre, "#0d0e14");
    assert.ok(r >= 4.5, `${c.nom} : accent sombre ${c.accentSombre} → ${r.toFixed(2)}:1`);
  }
});

test("le vert VIF de Villiers reste réservé aux aplats (il ne passe pas en texte sur blanc)", () => {
  const v = COMMUNES["villiers-sur-marne"]!;
  assert.ok(contraste(v.accentVif, "#ffffff") < 4.5); // d'où l'existence d'accentVif ≠ accent
  assert.ok(contraste("#ffffff", v.accentVif) < 4.5);
  assert.ok(contraste(v.institutionnel, "#ffffff") >= 4.5); // le bleu institutionnel, lui, porte du texte
});

test("les jetons couvrent les trois cas de thème et le fond crème", () => {
  const j = jetonsCommune(COMMUNES["villiers-sur-marne"]!);
  assert.match(j, /^:root\{/);
  assert.ok(j.includes('[data-theme="dark"]'));
  assert.ok(j.includes("prefers-color-scheme: dark"));
  assert.ok(j.includes("--fond:#f4f0eb"));
  assert.ok(j.includes('--police-titre:"Exo"'));
});
