import { NextResponse, type NextRequest } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db, schema } from "@ville/core/db";
import { verifierSession } from "@ville/core/auth";
import { masquer } from "@/lib/systeme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* EXPORT DU JOURNAL DE SÉCURITÉ — ce qu'une mairie demandera lors d'un audit.
 * Deux formes, et le CHOIX est explicite et tracé :
 *   • masqué (défaut) : suffit pour prouver un comportement (rafales, échecs d'envoi) ;
 *   • complet : nécessaire pour répondre à une réquisition ou à un droit d'accès —
 *     l'export lui-même est alors journalisé, avec qui l'a demandé.
 * Aucune donnée ne sort sans session valide du cockpit. */
export async function GET(req: NextRequest) {
  const session = await verifierSession(req.cookies.get("ville_session")?.value);
  if (!session) return NextResponse.json({ error: "non autorisé" }, { status: 401 });

  const jours = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get("jours") ?? 30)));
  const complet = req.nextUrl.searchParams.get("complet") === "1";
  const depuis = new Date(Date.now() - jours * 86_400_000);

  const lignes = await db.select().from(schema.journalConnexions)
    .where(sql`cree_le > ${depuis.toISOString()}`)
    .orderBy(desc(schema.journalConnexions.creeLe)).limit(5000);

  if (complet) {
    // Un export nominatif LAISSE UNE TRACE : c'est la contrepartie du droit de le faire.
    await db.insert(schema.journalConnexions).values({
      app: "cockpit", email: session.email, evenement: "export_securite",
      detail: { lignes: lignes.length, jours, nominatif: true },
    });
  }

  const echapper = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    ["horodatage_paris", "application", "adresse", "evenement", "detail"].join(";"),
    ...lignes.map((l) => [
      echapper(new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Paris" }).format(l.creeLe)),
      echapper(l.app),
      echapper(complet ? l.email : masquer(l.email)),
      echapper(l.evenement),
      echapper(l.detail ? JSON.stringify(l.detail) : ""),
    ].join(";")),
  ].join("\n");

  const nom = `securite-ville-${new Date().toISOString().slice(0, 10)}-${jours}j${complet ? "-nominatif" : "-masque"}.csv`;
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nom}"`,
      "cache-control": "no-store",
    },
  });
}
