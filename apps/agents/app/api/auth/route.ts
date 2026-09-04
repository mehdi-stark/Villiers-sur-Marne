import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { DUREE_SESSION_MS } from "@ville/core/auth";
import { db, schema } from "@ville/core/db";
import { envoyerEmail } from "@ville/core/email";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const APP = "agents", MAX_ESSAIS = 5, VALIDITE_MS = 10 * 60 * 1000, ENVOIS_PAR_HEURE = 5;

async function journal(email: string, evenement: string, detail?: Record<string, unknown>) {
  await db.insert(schema.journalConnexions).values({ app: APP, email, evenement, detail });
}

// Même mécanique éprouvée que le cockpit, isolée par `app` : hash seulement, 10 min, 5 essais, 5 envois/h, pas d'oracle.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { action?: string; email?: string; code?: string };
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 120);
  const formatOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (b.action === "envoyer") {
    if (!formatOk || !(await auth.emailAutorise(email))) return NextResponse.json({ ok: true });
    const recents = await db.select({ id: schema.otpCodes.id }).from(schema.otpCodes).where(and(eq(schema.otpCodes.app, APP), eq(schema.otpCodes.email, email), gt(schema.otpCodes.creeLe, new Date(Date.now() - 3600_000))));
    if (recents.length >= ENVOIS_PAR_HEURE) return NextResponse.json({ ok: true });
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
    await db.insert(schema.otpCodes).values({ app: APP, email, hash: await auth.empreinteOtp(email, code), expireLe: new Date(Date.now() + VALIDITE_MS) });
    const envoi = await envoyerEmail({ a: email, sujet: `${code} — code Back-office agents`, texte: `Votre code de connexion au Back-office agents : ${code}\nValable 10 minutes.`, html: `<p>Votre code de connexion au <strong>Back-office agents</strong> :</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;font-family:ui-monospace,monospace">${code}</p><p>Valable 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>` });
    await journal(email, envoi.ok ? "otp_envoye" : "envoi_echec", envoi.ok ? undefined : { cause: envoi.cause });
    return NextResponse.json({ ok: true });
  }
  if (b.action === "valider") {
    const code = String(b.code ?? "").replace(/\D/g, "").slice(0, 6);
    const [otp] = await db.select().from(schema.otpCodes).where(and(eq(schema.otpCodes.app, APP), eq(schema.otpCodes.email, email), isNull(schema.otpCodes.consommeLe))).orderBy(desc(schema.otpCodes.creeLe)).limit(1);
    const valide = code.length === 6 && (await auth.emailAutorise(email)) && !!otp && otp.expireLe.getTime() > Date.now() && otp.essais < MAX_ESSAIS && otp.hash === (await auth.empreinteOtp(email, code));
    if (!valide) {
      if (otp) await db.update(schema.otpCodes).set({ essais: otp.essais + 1 }).where(eq(schema.otpCodes.id, otp.id));
      await journal(email, "otp_refuse", { essais: (otp?.essais ?? 0) + 1 });
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    await db.update(schema.otpCodes).set({ consommeLe: new Date() }).where(eq(schema.otpCodes.id, otp.id));
    await journal(email, "connexion", { via: "otp", agent: req.headers.get("user-agent")?.slice(0, 160) });
    (await cookies()).set(auth.COOKIE, await auth.signerSession(email), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: DUREE_SESSION_MS / 1000, path: "/" });
    return NextResponse.json({ ok: true });
  }
  if (b.action === "deconnecter") { (await cookies()).delete(auth.COOKIE); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ ok: false }, { status: 400 });
}
