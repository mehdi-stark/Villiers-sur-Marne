import { NextResponse } from "next/server";
import { piece } from "@ville/core/demarches";
import { agentCourant } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Les agents autorisés voient les pièces de la file : accès tracé par la session. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await agentCourant();
  if (!a) return new NextResponse("Authentification requise.", { status: 401 });
  const { id } = await ctx.params;
  const p = await piece(id);
  if (!p) return new NextResponse("Introuvable.", { status: 404 });
  return new NextResponse(Buffer.from(p.contenuBase64, "base64"), { headers: { "Content-Type": p.mime, "Content-Disposition": `inline; filename="${encodeURIComponent(p.nom)}"`, "Cache-Control": "private, no-store" } });
}
