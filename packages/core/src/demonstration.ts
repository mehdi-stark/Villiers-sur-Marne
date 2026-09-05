import { sourceActive } from "./donnees";

// MODE DÉMONSTRATION — un lien qui ouvre l'app « déjà connectée » contourne l'authentification :
// il ne s'ouvre que sous conditions, et il le DIT à l'écran (bandeau permanent).
// Garde-fous : (1) refusé si la source n'est pas fictive — jamais sur des données réelles ;
// (2) refusé sans DEMO_SECRET ; (3) jeton signé à durée courte ; (4) accès journalisé.
export const DUREE_DEMO_MS = 2 * 3600 * 1000;

export type Verdict = { ok: true; email: string } | { ok: false; cause: string };

export function demonstrationActive(): { ok: true } | { ok: false; cause: string } {
  if (!process.env.DEMO_SECRET) return { ok: false, cause: "DEMO_SECRET absent : le mode présentation est fermé" };
  const nom = sourceActive().nom;
  if (nom !== "fictif") return { ok: false, cause: `source « ${nom} » : le mode présentation ne s'ouvre JAMAIS sur des données réelles` };
  return { ok: true };
}

const enc = new TextEncoder();
function b64url(b: Uint8Array): string { let s = ""; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function deB64url(s: string): string { const b = s.replace(/-/g, "+").replace(/_/g, "/"); return atob(b + "=".repeat((4 - (b.length % 4)) % 4)); }

async function signer(message: string): Promise<string> {
  const cle = await crypto.subtle.importKey("raw", enc.encode(process.env.DEMO_SECRET!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", cle, enc.encode(`demo|${message}`))));
}

/** Fabrique un lien de présentation : `?demo=<jeton>` valable 2 h pour CE compte de démonstration. */
export async function jetonDemo(email: string, dureeMs = DUREE_DEMO_MS): Promise<string> {
  const corps = `${email}|${Date.now() + dureeMs}`;
  return b64url(enc.encode(`${corps}|${await signer(corps)}`));
}

export async function verifierDemo(jeton: string | undefined): Promise<Verdict> {
  const etat = demonstrationActive();
  if (!etat.ok) return etat;
  if (!jeton) return { ok: false, cause: "jeton absent" };
  try {
    const [email, expStr, sig] = deB64url(jeton).split("|");
    if (!email || !expStr || !sig) return { ok: false, cause: "jeton illisible" };
    if (Date.now() > Number(expStr)) return { ok: false, cause: "lien de présentation expiré (2 h) — regénérez-en un" };
    const attendu = await signer(`${email}|${expStr}`);
    if (sig.length !== attendu.length) return { ok: false, cause: "signature refusée" };
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ attendu.charCodeAt(i);
    return diff === 0 ? { ok: true, email } : { ok: false, cause: "signature refusée" };
  } catch {
    return { ok: false, cause: "jeton illisible" };
  }
}

/** Vrai quand l'application sert des données de démonstration : le bandeau doit le dire. */
export function surDonneesFictives(): boolean {
  return sourceActive().nom === "fictif";
}
