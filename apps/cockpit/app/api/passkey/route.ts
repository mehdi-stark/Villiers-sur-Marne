import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { DUREE_SESSION_MS } from "@ville/core/auth";
import { db, schema } from "@ville/core/db";
import { connecter, enregistrer, optionsConnexion, optionsEnregistrement, revoquer, type ConfigPasskeys } from "@ville/core/passkeys";
import { COOKIE, signerSession, verifierSession } from "@ville/core/auth";
const auth = { COOKIE, signerSession, verifierSession, app: "cockpit" };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RP ID = domaine de CETTE app (une passkey par app) ; origine = celle de la requête.
function cfg(req: NextRequest): ConfigPasskeys {
  const origine = req.headers.get("origin") ?? `${req.nextUrl.protocol}//${req.headers.get("host")}`;
  return { app: auth.app, rpName: "Ville — cockpit", rpId: process.env.PASSKEY_RP_ID ?? new URL(origine).hostname, origine };
}
async function session() { const s = await verifierSession((await cookies()).get(COOKIE)?.value); return s; }

export async function GET(req: NextRequest) {
  const etape = req.nextUrl.searchParams.get("etape");
  if (etape === "options-connexion") return NextResponse.json(await optionsConnexion(cfg(req)));
  if (etape === "options-enregistrement") { const s = await session(); if (!s) return NextResponse.json({ ok: false }, { status: 401 }); return NextResponse.json(await optionsEnregistrement(cfg(req), s.email)); }
  return NextResponse.json({ ok: false }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { etape?: string; reponse?: never; id?: string };
  const ua = req.headers.get("user-agent");
  if (b.etape === "enregistrer") {
    const s = await session(); if (!s) return NextResponse.json({ ok: false }, { status: 401 });
    const r = await enregistrer(cfg(req), s.email, b.reponse!, ua);
    if (r.ok) await db.insert(schema.journalConnexions).values({ app: auth.app, email: s.email, evenement: "passkey_activee", detail: { appareil: r.appareil } });
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, cause: r.cause }, { status: 400 });
  }
  if (b.etape === "connecter") {
    const r = await connecter(cfg(req), b.reponse!);
    if (!r.ok) return NextResponse.json({ ok: false, cause: r.cause }, { status: 401 });
    await db.insert(schema.journalConnexions).values({ app: auth.app, email: r.email, evenement: "connexion", detail: { via: "passkey", appareil: r.appareil } });
    (await cookies()).set(auth.COOKIE, await auth.signerSession(r.email), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: DUREE_SESSION_MS / 1000, path: "/" });
    return NextResponse.json({ ok: true });
  }
  if (b.etape === "revoquer") {
    const s = await session(); if (!s || !b.id) return NextResponse.json({ ok: false }, { status: 401 });
    const ok = await revoquer(auth.app, s.email, b.id);
    if (ok) await db.insert(schema.journalConnexions).values({ app: auth.app, email: s.email, evenement: "passkey_revoquee", detail: { id: b.id } });
    return NextResponse.json({ ok });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
