import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse, type AuthenticationResponseJSON, type RegistrationResponseJSON } from "@simplewebauthn/server";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "./db";

// Passkeys : la BIOMÉTRIE VIENT APRÈS le premier code, jamais à sa place — le code
// reste le repli universel. RP ID = domaine de l'application (une passkey par app).
export type ConfigPasskeys = { app: string; rpName: string; rpId: string; origine: string };

function b64u(b: Uint8Array): string { return Buffer.from(b).toString("base64url"); }
function fromB64u(s: string): Uint8Array<ArrayBuffer> { return Uint8Array.from(Buffer.from(s, "base64url")); }

export function appareilDepuis(ua: string | null): string {
  if (!ua) return "Appareil inconnu";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "PC Windows";
  return "Appareil";
}

async function poserDefi(app: string, email: string | null, type: "enregistrement" | "connexion", defi: string) {
  await db.insert(schema.defisWebauthn).values({ app, email, type, defi, expireLe: new Date(Date.now() + 5 * 60_000) });
}
async function prendreDefi(app: string, email: string | null, type: "enregistrement" | "connexion"): Promise<string | null> {
  const cond = email === null ? and(eq(schema.defisWebauthn.app, app), eq(schema.defisWebauthn.type, type), isNull(schema.defisWebauthn.email), gt(schema.defisWebauthn.expireLe, new Date())) : and(eq(schema.defisWebauthn.app, app), eq(schema.defisWebauthn.type, type), eq(schema.defisWebauthn.email, email), gt(schema.defisWebauthn.expireLe, new Date()));
  const [d] = await db.select().from(schema.defisWebauthn).where(cond).orderBy(desc(schema.defisWebauthn.creeLe)).limit(1);
  if (!d) return null;
  await db.delete(schema.defisWebauthn).where(eq(schema.defisWebauthn.id, d.id));
  return d.defi;
}

export async function passkeysDe(app: string, email: string) {
  return db.select().from(schema.passkeys).where(and(eq(schema.passkeys.app, app), eq(schema.passkeys.email, email), isNull(schema.passkeys.revoqueLe))).orderBy(desc(schema.passkeys.creeLe));
}

export async function optionsEnregistrement(cfg: ConfigPasskeys, email: string) {
  const existantes = await passkeysDe(cfg.app, email);
  const options = await generateRegistrationOptions({
    rpName: cfg.rpName, rpID: cfg.rpId, userName: email, userDisplayName: email,
    attestationType: "none",
    excludeCredentials: existantes.map((p) => ({ id: p.credentialId, transports: (p.transports ?? undefined) as never })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
  });
  await poserDefi(cfg.app, email, "enregistrement", options.challenge);
  return options;
}

export async function enregistrer(cfg: ConfigPasskeys, email: string, reponse: RegistrationResponseJSON, ua: string | null): Promise<{ ok: true; appareil: string } | { ok: false; cause: string }> {
  const defi = await prendreDefi(cfg.app, email, "enregistrement");
  if (!defi) return { ok: false, cause: "défi expiré — recommence" };
  try {
    const v = await verifyRegistrationResponse({ response: reponse, expectedChallenge: defi, expectedOrigin: cfg.origine, expectedRPID: cfg.rpId });
    if (!v.verified || !v.registrationInfo) return { ok: false, cause: "réponse non vérifiée" };
    const c = v.registrationInfo.credential;
    const appareil = appareilDepuis(ua);
    await db.insert(schema.passkeys).values({ app: cfg.app, email, credentialId: c.id, clePublique: b64u(c.publicKey), compteur: c.counter, transports: c.transports ?? [], appareil });
    return { ok: true, appareil };
  } catch (e) {
    return { ok: false, cause: e instanceof Error ? e.message.slice(0, 120) : "erreur" };
  }
}

export async function optionsConnexion(cfg: ConfigPasskeys) {
  const options = await generateAuthenticationOptions({ rpID: cfg.rpId, userVerification: "preferred" });
  await poserDefi(cfg.app, null, "connexion", options.challenge);
  return options;
}

export async function connecter(cfg: ConfigPasskeys, reponse: AuthenticationResponseJSON): Promise<{ ok: true; email: string; appareil: string | null } | { ok: false; cause: string }> {
  const defi = await prendreDefi(cfg.app, null, "connexion");
  if (!defi) return { ok: false, cause: "défi expiré" };
  const [p] = await db.select().from(schema.passkeys).where(and(eq(schema.passkeys.app, cfg.app), eq(schema.passkeys.credentialId, reponse.id), isNull(schema.passkeys.revoqueLe))).limit(1);
  if (!p) return { ok: false, cause: "appareil inconnu ou révoqué" };
  try {
    const v = await verifyAuthenticationResponse({ response: reponse, expectedChallenge: defi, expectedOrigin: cfg.origine, expectedRPID: cfg.rpId, credential: { id: p.credentialId, publicKey: fromB64u(p.clePublique), counter: p.compteur, transports: (p.transports ?? undefined) as never } });
    if (!v.verified) return { ok: false, cause: "signature refusée" };
    await db.update(schema.passkeys).set({ compteur: v.authenticationInfo.newCounter, dernierUsageLe: new Date() }).where(eq(schema.passkeys.id, p.id));
    return { ok: true, email: p.email, appareil: p.appareil };
  } catch (e) {
    return { ok: false, cause: e instanceof Error ? e.message.slice(0, 120) : "erreur" };
  }
}

export async function revoquer(app: string, email: string, id: string): Promise<boolean> {
  const r = await db.update(schema.passkeys).set({ revoqueLe: new Date() }).where(and(eq(schema.passkeys.app, app), eq(schema.passkeys.email, email), eq(schema.passkeys.id, id), isNull(schema.passkeys.revoqueLe))).returning({ id: schema.passkeys.id });
  return r.length > 0;
}

/** Journal des accès de l'utilisateur (20 derniers) — zéro collecte supplémentaire. */
export async function journalAcces(app: string, email: string) {
  return db.select().from(schema.journalConnexions).where(and(eq(schema.journalConnexions.app, app), eq(schema.journalConnexions.email, email))).orderBy(desc(schema.journalConnexions.creeLe)).limit(20);
}
