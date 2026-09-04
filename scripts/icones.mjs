#!/usr/bin/env node
// Icônes PWA générées PAR CODE (même identité que le logo « V » de la coquille) :
// icon-192, icon-512, icon-512-maskable (marge de sécurité 20 %), apple-touch-icon.
import sharp from "sharp";
const ACCENT = "#2f5bea";
const svg = (taille, maskable) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 512 512">` +
  `<rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="${ACCENT}"/>` +
  `<text x="256" y="${maskable ? 330 : 345}" text-anchor="middle" font-family="Instrument Sans, Inter, -apple-system, Helvetica, Arial, sans-serif" font-weight="800" font-size="${maskable ? 240 : 300}" fill="#fff">V</text>` +
  `</svg>`,
);
await sharp(svg(512, false)).png().toFile("public/icon-512.png");
await sharp(svg(512, false)).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(svg(512, true)).png().toFile("public/icon-512-maskable.png");
await sharp(svg(512, false)).resize(180, 180).png().toFile("public/apple-touch-icon.png");
console.log("icônes générées : public/icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png");
