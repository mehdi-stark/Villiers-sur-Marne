#!/usr/bin/env node
// Test RÉEL des passkeys avec l'authentificateur VIRTUEL de Playwright (CDP WebAuthn) :
// après une session (code), « Activer » enregistre une passkey (ligne en base) ; déconnecté,
// « Se connecter avec Face ID » ouvre une session sans code. Acteur test@ville.local, purge à la fin.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });
const BASE = process.argv[2] ?? "http://localhost:3001";
const EMAIL = "test@ville.local";
const corps = `${EMAIL}|${Date.now() + 3600e3}`;
const sig = createHmac("sha256", process.env.FAMILLE_AUTH_SECRET).update(`famille|${corps}`).digest("base64url");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
let code = 1; const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
  await ctx.addCookies([{ name: "famille_session", value: Buffer.from(`${corps}|${sig}`).toString("base64url"), url: BASE }]);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", { options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Activer", exact: true }).click();
  // Constater l'EFFET en base (la première compilation de la route peut prendre quelques secondes).
  let pk = [];
  for (let i = 0; i < 20 && pk.length === 0; i++) { await p.waitForTimeout(1000); pk = await sql`SELECT id, appareil FROM passkeys WHERE app = 'famille' AND email = ${EMAIL} AND revoque_le IS NULL`; }
  if (pk.length !== 1) throw new Error(`passkey non enregistrée : ${JSON.stringify(pk)}`);
  // Déconnexion, puis connexion par passkey (même authentificateur virtuel)
  await ctx.clearCookies();
  await p.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Face ID/ }).click();
  await p.waitForURL((u) => new URL(u).pathname === "/", { timeout: 15000 });
  const cookie = (await ctx.cookies()).find((c) => c.name === "famille_session");
  if (!cookie) throw new Error("pas de cookie de session après Face ID");
  const j = await sql`SELECT detail FROM journal_connexions WHERE app = 'famille' AND email = ${EMAIL} AND evenement = 'connexion' ORDER BY cree_le DESC LIMIT 1`;
  const via = j[0]?.detail?.via;
  if (via !== "passkey") throw new Error(`journal : via=${via}`);
  // Page Appareils : la passkey est listée ; révocation
  await p.goto(`${BASE}/appareils`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Révoquer" }).first().click();
  await p.waitForTimeout(1500);
  const rev = await sql`SELECT revoque_le FROM passkeys WHERE id = ${pk[0].id}`;
  if (!rev[0]?.revoque_le) throw new Error("révocation non enregistrée");
  await p.screenshot({ path: "captures/appareils-390.png", fullPage: true });
  console.log(`✓ passkey enregistrée (${pk[0].appareil}), connexion Face ID sans code (journal via=passkey), révocation constatée`);
  code = 0;
} catch (e) { console.error("✗", e.message); }
finally { await sql`DELETE FROM passkeys WHERE email = ${EMAIL}`; await sql`DELETE FROM defis_webauthn WHERE email = ${EMAIL} OR email IS NULL`; await sql`DELETE FROM journal_connexions WHERE email = ${EMAIL}`; console.log("purge ok"); await sql.end(); await b.close(); }
process.exit(code);
