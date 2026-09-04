// Session signée HMAC (Web Crypto : Edge — middleware — et Node). UNE identité
// PAR APPLICATION : cookie, secret et liste d'accès propres — jamais partagés
// entre le cockpit, le portail famille et le back-office agents (règle de la trame).
const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(b + "=".repeat((4 - (b.length % 4)) % 4));
}

export const DUREE_SESSION_MS = 30 * 24 * 3600 * 1000;
/** Sous ce délai avant expiration, le middleware réémet le cookie (session glissante). */
export const SEUIL_REEMISSION_MS = 7 * 24 * 3600 * 1000;

export type Session = { email: string; expireLe: number };

export type ConfigAuth = {
  app: string; // préfixe de signature : "ville" (cockpit), "famille", "agents"
  cookie: string;
  secretEnv: string; // nom de la variable du secret
  /** Qui a le droit d'entrer : liste blanche d'env, ou fonction (table de comptes). */
  autorise: (email: string) => boolean | Promise<boolean>;
};

export function whitelistEnv(nom: string): (email: string) => boolean {
  return (email) => (process.env[nom] ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase());
}

export function creerAuth(cfg: ConfigAuth) {
  async function hmac(message: string): Promise<string> {
    const secret = process.env[cfg.secretEnv];
    if (!secret) throw new Error(`${cfg.secretEnv} manquant`);
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${cfg.app}|${message}`))));
  }
  return {
    COOKIE: cfg.cookie,
    app: cfg.app,
    emailAutorise: (email: string) => cfg.autorise(email),
    async signerSession(email: string): Promise<string> {
      const corps = `${email}|${Date.now() + DUREE_SESSION_MS}`;
      return b64url(enc.encode(`${corps}|${await hmac(corps)}`));
    },
    async verifierSession(jeton: string | undefined): Promise<Session | null> {
      if (!jeton) return null;
      try {
        const [email, expStr, sig] = b64urlDecode(jeton).split("|");
        if (!email || !expStr || !sig || Date.now() > Number(expStr)) return null;
        const attendu = await hmac(`${email}|${expStr}`);
        if (sig.length !== attendu.length) return null;
        let diff = 0;
        for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ attendu.charCodeAt(i);
        return diff === 0 && (await cfg.autorise(email)) ? { email, expireLe: Number(expStr) } : null;
      } catch {
        return null;
      }
    },
    /** Empreinte d'un OTP : HMAC(email|code) — le code lui-même n'est jamais stocké. */
    empreinteOtp(email: string, code: string): Promise<string> {
      return hmac(`otp|${email.toLowerCase()}|${code}`);
    },
  };
}

// ---- Instance du COCKPIT (compatibilité avec le code existant) ----
const cockpit = creerAuth({ app: "ville", cookie: "ville_session", secretEnv: "AUTH_SECRET", autorise: whitelistEnv("ADMIN_EMAILS") });
export const COOKIE = cockpit.COOKIE;
export const emailAutorise = cockpit.emailAutorise as (email: string) => boolean;
export const signerSession = cockpit.signerSession;
export const verifierSession = cockpit.verifierSession;
export const empreinteOtp = cockpit.empreinteOtp;
