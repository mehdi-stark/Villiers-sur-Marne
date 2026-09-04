import { NextResponse, type NextRequest } from "next/server";
import { clesVapid, enregistrerAbonnement } from "@ville/core/push";
import { sessionCourante } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET : clé publique VAPID (la session est exigée par le middleware).
export async function GET() {
  const { publicKey } = await clesVapid();
  return NextResponse.json({ publicKey });
}

// POST : enregistre l'abonnement de CET appareil pour l'utilisateur connecté.
export async function POST(req: NextRequest) {
  const s = await sessionCourante();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  if (!b?.endpoint || !b.keys?.p256dh || !b.keys.auth) return NextResponse.json({ ok: false, cause: "abonnement incomplet" }, { status: 400 });
  await enregistrerAbonnement({ email: s.email, endpoint: b.endpoint, p256dh: b.keys.p256dh, auth: b.keys.auth, agent: req.headers.get("user-agent")?.slice(0, 160) ?? undefined });
  return NextResponse.json({ ok: true });
}
