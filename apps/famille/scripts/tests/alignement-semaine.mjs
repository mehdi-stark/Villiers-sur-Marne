// Les cinq colonnes de jours DOIVENT tomber pile au-dessus des créneaux : c'est ce qui rend
// la semaine lisible. Les bandes de moment (06/09/2026) ajoutent un retrait — ce test échoue
// si un futur padding le casse, à 390 comme à 1440.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
const secret = process.env.FAMILLE_AUTH_SECRET;
const corps = `mehdi.stark@gmail.com|${Date.now() + 864e5}`;
const sig = createHmac("sha256", secret).update(`famille|${corps}`).digest("base64url");
const jeton = Buffer.from(`${corps}|${sig}`).toString("base64url");
const nav = await chromium.launch();
for (const w of [720, 1440]) { // sous 720 px, la semaine se lit par JOURS : pas de grille à aligner
  const ctx = await nav.newContext({ viewport: { width: w, height: 900 } });
  await ctx.addCookies([{ name: "famille_session", value: jeton, domain: "localhost", path: "/" }]);
  const p = await ctx.newPage();
  await p.goto("http://localhost:3001/", { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  const r = await p.evaluate(() => {
    const e = document.querySelector(".entete-jour"), c = document.querySelector(".creneau");
    if (!e || !c || e.getBoundingClientRect().width === 0) return null; // grille absente = rien à mesurer
    const de = e.getBoundingClientRect(), dc = c.getBoundingClientRect();
    const der = [...document.querySelectorAll(".entete-jour")].pop().getBoundingClientRect();
    const derc = [...document.querySelectorAll(".service-cellules")][0].lastElementChild.getBoundingClientRect();
    return { gauche: +(dc.left - de.left).toFixed(1), droite: +(derc.right - der.right).toFixed(1) };
  });
  if (!r) { console.error(`✗ ${w}px : la grille service × jours a disparu — c'est elle qu'on aligne`); process.exitCode = 1; continue; }
  if (Math.abs(r.gauche) > 1 || Math.abs(r.droite) > 1) {
    console.error(`✗ ${w}px : les jours ne sont plus alignés au-dessus des cellules (gauche ${r.gauche}px, droite ${r.droite}px)`);
    process.exitCode = 1;
  } else console.log(`✓ ${w}px : colonnes des jours alignées sur les créneaux (± ${Math.max(Math.abs(r.gauche), Math.abs(r.droite))}px)`);
  await ctx.close();
}
await nav.close();
