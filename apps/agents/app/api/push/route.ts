import { NextResponse, type NextRequest } from "next/server";
import { clesVapid, enregistrerAbonnement } from "@ville/core/push";
import { agentCourant } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { publicKey } = await clesVapid();
  return NextResponse.json({ publicKey });
}

export async function POST(req: NextRequest) {
  const f = await agentCourant();
  if (!f) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  if (!b?.endpoint || !b.keys?.p256dh || !b.keys.auth) return NextResponse.json({ ok: false, cause: "abonnement incomplet" }, { status: 400 });
  await enregistrerAbonnement({ app: "agents", email: f.email, endpoint: b.endpoint, p256dh: b.keys.p256dh, auth: b.keys.auth, agent: req.headers.get("user-agent")?.slice(0, 160) ?? undefined });
  return NextResponse.json({ ok: true });
}
