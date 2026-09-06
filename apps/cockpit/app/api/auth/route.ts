import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { COOKIE, DUREE_SESSION_MS, emailAutorise, empreinteOtp, signerSession } from "@ville/core/auth";
import { alerterMartelement, garderDemandeOtp, ipDe, quota, repondreEnAuMoins } from "@ville/core/garde";
import { poserAlerte } from "@ville/core/alertes";
import { db, schema } from "@ville/core/db";
import { envoyerEmail } from "@ville/core/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Toute réponse de « envoyer » dure au moins ça : sinon la latence dit ce que le corps tait. */
const PLANCHER_MS = 350;

const MAX_ESSAIS = 5;
const VALIDITE_MS = 10 * 60 * 1000;
const ENVOIS_PAR_HEURE = 5;

async function journal(email: string, evenement: string, detail?: Record<string, unknown>) {
  await db.insert(schema.journalConnexions).values({ email, evenement, detail });
}

// OTP 6 chiffres : hash seulement, 10 min, 5 essais, 5 envois/h par e-mail.
// Réponse IDENTIQUE que l'e-mail soit autorisé ou non (pas d'oracle).
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { action?: string; email?: string; code?: string };
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 120);
  const formatOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  if (b.action === "envoyer") {
    // GARDE D'ENTRÉE : format, quota IP, quota adresse, autorisation en cache — la base
    // n'est atteinte qu'après. Réponse et délai IDENTIQUES quel que soit le verdict.
    const debut = Date.now();
    const verdict = await garderDemandeOtp({ app: "cockpit", email, ip: ipDe(req), autorise: emailAutorise });
    if (!verdict.passe) {
      // Un martèlement se SIGNALE (une alerte par quart d'heure au plus) : sans ça, on
      // découvre l'attaque sur la facture du fournisseur d'e-mails.
      if (verdict.motif === "quota_ip" && alerterMartelement("cockpit")) {
        await poserAlerte("warn", "connexion_martelee_cockpit", "Tentatives de connexion en rafale bloquées avant la base", { ip: ipDe(req) });
      }
      return repondreEnAuMoins(debut, PLANCHER_MS, NextResponse.json({ ok: true }));
    }
    const recents = await db
      .select({ id: schema.otpCodes.id })
      .from(schema.otpCodes)
      .where(and(eq(schema.otpCodes.email, email), gt(schema.otpCodes.creeLe, new Date(Date.now() - 3600_000))));
    if (recents.length >= ENVOIS_PAR_HEURE) return NextResponse.json({ ok: true });

    const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
    await db.insert(schema.otpCodes).values({ email, hash: await empreinteOtp(email, code), expireLe: new Date(Date.now() + VALIDITE_MS) });
    const envoi = await envoyerEmail({
      a: email,
      sujet: `${code} — code de connexion Ville`,
      texte: `Code de connexion au cockpit Ville : ${code}\nValable 10 minutes.`,
      html: `<p>Code de connexion au cockpit <strong>Ville</strong> :</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;font-family:ui-monospace,monospace">${code}</p><p>Valable 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
    });
    await journal(email, envoi.ok ? "otp_envoye" : "envoi_echec", envoi.ok ? undefined : { cause: envoi.cause });
    return repondreEnAuMoins(debut, PLANCHER_MS, NextResponse.json({ ok: true }));
  }

  if (b.action === "valider") {
    // Le code aussi se martèle : 20 essais par IP en 10 min, comptés AVANT toute lecture.
    if (!formatOk || !quota(`valider|cockpit|${ipDe(req)}`, 20, 10 * 60_000).ok) return NextResponse.json({ ok: false }, { status: 429 });
    const code = String(b.code ?? "").replace(/\D/g, "").slice(0, 6);
    const [otp] = await db
      .select()
      .from(schema.otpCodes)
      .where(and(eq(schema.otpCodes.email, email), isNull(schema.otpCodes.consommeLe)))
      .orderBy(desc(schema.otpCodes.creeLe))
      .limit(1);
    const valide =
      code.length === 6 && emailAutorise(email) && !!otp && otp.expireLe.getTime() > Date.now() && otp.essais < MAX_ESSAIS && otp.hash === (await empreinteOtp(email, code));
    if (!valide) {
      if (otp) await db.update(schema.otpCodes).set({ essais: otp.essais + 1 }).where(eq(schema.otpCodes.id, otp.id));
      await journal(email, "otp_refuse", { essais: (otp?.essais ?? 0) + 1 });
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    await db.update(schema.otpCodes).set({ consommeLe: new Date() }).where(eq(schema.otpCodes.id, otp.id));
    await journal(email, "connexion", { via: "otp", agent: req.headers.get("user-agent")?.slice(0, 160) });
    (await cookies()).set(COOKIE, await signerSession(email), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: DUREE_SESSION_MS / 1000, path: "/" });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "deconnecter") {
    (await cookies()).delete(COOKIE);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
