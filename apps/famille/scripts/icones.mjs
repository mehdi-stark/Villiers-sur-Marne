#!/usr/bin/env node
// Icônes PWA : l'EMBLÈME OFFICIEL de la ville (feuilles de vigne, source villiers94.fr),
// utilisé dans le cadre d'une proposition faite à la commune — la mention de propriété
// est portée par l'application (communes.ts : mentionLogo).
import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import { COMMUNES } from "../../../packages/core/src/communes.ts";
import { svgEmbleme } from "../../../packages/core/src/embleme.ts";
const c = COMMUNES[process.env.COMMUNE_ID ?? "villiers-sur-marne"];
const officiel = "../../packages/core/embleme-villiers.png";
const source = c.logoUrl && existsSync(officiel) ? readFileSync(officiel) : Buffer.from(svgEmbleme(c.accent));
const fond = { r: 1, g: 95, b: 137, alpha: 1 }; // bleu institutionnel de la ville
const carre = (taille, marge) => sharp(source).resize(taille - 2 * marge, taille - 2 * marge, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: marge, bottom: marge, left: marge, right: marge, background: fond }).flatten({ background: fond }).png();
await carre(512, 24).toFile("public/icon-512.png");
await carre(192, 10).toFile("public/icon-192.png");
await carre(512, 80).toFile("public/icon-512-maskable.png"); // marge de sécurité 20 %
await carre(180, 8).toFile("public/apple-touch-icon.png");
console.log(`icônes ${c.nom} générées (${c.logoUrl ? "emblème officiel" : "emblème provisoire"})`);
