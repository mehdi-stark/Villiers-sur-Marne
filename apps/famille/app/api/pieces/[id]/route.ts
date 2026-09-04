import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@ville/core/db";
import { piece } from "@ville/core/demarches";
import { familleCourante } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Une pièce n'est servie qu'à la famille qui l'a déposée. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const f = await familleCourante();
  if (!f) return new NextResponse("Authentification requise.", { status: 401 });
  const { id } = await ctx.params;
  const p = await piece(id);
  if (!p) return new NextResponse("Introuvable.", { status: 404 });
  const [d] = await db.select({ familleId: schema.demarches.familleId }).from(schema.demarches).where(eq(schema.demarches.id, p.demarcheId)).limit(1);
  if (d?.familleId !== f.famille.id) return new NextResponse("Introuvable.", { status: 404 });
  return new NextResponse(Buffer.from(p.contenuBase64, "base64"), { headers: { "Content-Type": p.mime, "Content-Disposition": `inline; filename="${encodeURIComponent(p.nom)}"`, "Cache-Control": "private, no-store" } });
}
