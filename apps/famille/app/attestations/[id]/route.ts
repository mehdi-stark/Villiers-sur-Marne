import { NextResponse } from "next/server";
import { lireDocument } from "@ville/core/documents/attestation";
import { familleCourante } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sert le PDF figé d'une attestation — seulement à la famille qui la possède. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const f = await familleCourante();
  if (!f) return new NextResponse("Authentification requise.", { status: 401 });
  const { id } = await ctx.params;
  const doc = await lireDocument(id, f.famille.id);
  if (!doc) return new NextResponse("Introuvable.", { status: 404 });
  return new NextResponse(Buffer.from(doc.pdfBase64, "base64"), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="attestation-${doc.periode ?? "paiement"}.pdf"`, "Cache-Control": "private, no-store" } });
}
