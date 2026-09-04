// Session signée HMAC (Web Crypto : fonctionne en Edge — middleware — et en Node).
// Secret PROPRE au projet (AUTH_SECRET) : une fuite ailleurs n'ouvre pas ce cockpit.
const enc = new TextEncoder();

async function hmac(message: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`ville|${message}`));
  return b64url(new Uint8Array(sig));
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(b + "=".repeat((4 - (b.length % 4)) % 4));
}
function b64urlEncode(s: string): string {
  return b64url(enc.encode(s));
}

export const COOKIE = "ville_session";
export const DUREE_SESSION_MS = 30 * 24 * 3600 * 1000;
/** Sous ce délai avant expiration, le middleware réémet le cookie (session glissante). */
export const SEUIL_REEMISSION_MS = 7 * 24 * 3600 * 1000;

export function emailAutorise(email: string): boolean {
  const liste = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return liste.includes(email.trim().toLowerCase());
}

export async function signerSession(email: string): Promise<string> {
  const corps = `${email}|${Date.now() + DUREE_SESSION_MS}`;
  return b64urlEncode(`${corps}|${await hmac(corps)}`);
}

export type Session = { email: string; expireLe: number };

export async function verifierSession(jeton: string | undefined): Promise<Session | null> {
  if (!jeton) return null;
  try {
    const [email, expStr, sig] = b64urlDecode(jeton).split("|");
    if (!email || !expStr || !sig || Date.now() > Number(expStr)) return null;
    const attendu = await hmac(`${email}|${expStr}`);
    if (sig.length !== attendu.length) return null;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ attendu.charCodeAt(i);
    return diff === 0 && emailAutorise(email) ? { email, expireLe: Number(expStr) } : null;
  } catch {
    return null;
  }
}

/** Empreinte d'un OTP : HMAC(email|code) — le code lui-même n'est jamais stocké. */
export async function empreinteOtp(email: string, code: string): Promise<string> {
  return hmac(`otp|${email.toLowerCase()}|${code}`);
}
