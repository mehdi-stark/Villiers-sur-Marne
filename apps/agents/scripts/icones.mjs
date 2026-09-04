#!/usr/bin/env node
// Icônes PWA générées PAR CODE, à la couleur de la commune, avec l'emblème provisoire
// (dessiné pour ce projet — le logo officiel de la ville attend son accord écrit).
import sharp from "sharp";
import { COMMUNES } from "../../../packages/core/src/communes.ts";
import { svgEmbleme } from "../../../packages/core/src/embleme.ts";
const c = COMMUNES[process.env.COMMUNE_ID ?? "villiers-sur-marne"];
const png = (svg) => sharp(Buffer.from(svg)).png();
await png(svgEmbleme(c.accent)).toFile("public/icon-512.png");
await png(svgEmbleme(c.accent)).resize(192, 192).toFile("public/icon-192.png");
await png(svgEmbleme(c.accent, { rayon: 0 })).toFile("public/icon-512-maskable.png");
await png(svgEmbleme(c.accent)).resize(180, 180).toFile("public/apple-touch-icon.png");
console.log(`icônes ${c.nom} générées (emblème provisoire, ${c.accent})`);
