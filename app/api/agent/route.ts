import { NextResponse, type NextRequest } from "next/server";
import { envoyerPush } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Parlée par l'AGENT (scripts/notifier.mjs) avec AGENT_SECRET : « une décision
// t'attend », « verdict marché rendu »… Jamais depuis le navigateur.
export async function POST(req: NextRequest) {
  const secret = process.env.AGENT_SECRET;
  if (!secret || req.headers.get("x-agent-secret") !== secret) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { titre?: string; corps?: string; url?: string };
  if (!b.titre) return NextResponse.json({ error: "titre requis" }, { status: 400 });
  const r = await envoyerPush({ titre: b.titre.slice(0, 80), corps: (b.corps ?? "").slice(0, 200), url: b.url?.startsWith("/") ? b.url : "/" });
  return NextResponse.json({ ok: true, ...r });
}
