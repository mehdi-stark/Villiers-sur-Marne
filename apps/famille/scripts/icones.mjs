#!/usr/bin/env node
// Icônes PWA du portail famille, générées par code à la couleur de la commune.
import sharp from "sharp";
import { COMMUNES } from "../../../packages/core/src/communes.ts";
const c = COMMUNES[process.env.COMMUNE_ID ?? "villiers-sur-marne"];
const svg = (maskable) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="${c.accent}"/><text x="256" y="${maskable ? 330 : 345}" text-anchor="middle" font-family="Instrument Sans, Inter, -apple-system, Helvetica, Arial, sans-serif" font-weight="800" font-size="${maskable ? 240 : 300}" fill="#fff">${c.logoInitiale}</text></svg>`);
await sharp(svg(false)).png().toFile("public/icon-512.png");
await sharp(svg(false)).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(svg(true)).png().toFile("public/icon-512-maskable.png");
await sharp(svg(false)).resize(180, 180).png().toFile("public/apple-touch-icon.png");
console.log(`icônes ${c.nom} générées`);
