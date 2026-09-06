import { NextResponse, type NextRequest } from "next/server";
import { executerRun } from "@ville/core/runs";
import { APPLICATIONS } from "@/lib/systeme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* HISTORIQUE DE DISPONIBILITÉ — un instantané ne dit pas si une app est tombée pendant
 * qu'on regardait ailleurs. Une fois par jour, on ping les trois et on journalise le
 * résultat dans `runs` : la page Système en fait une bande de trente jours. */
async function releve() {
  const mesures = await Promise.all(APPLICATIONS.map(async (a) => {
    const t0 = Date.now();
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(`${a.url}/connexion`, { headers: { accept: "text/html" }, signal: ctrl.signal, cache: "no-store" });
      return [a.cle, { code: res.status, ms: Date.now() - t0 }] as const;
    } catch {
      return [a.cle, { code: 0, ms: Date.now() - t0 }] as const;
    } finally {
      clearTimeout(minuteur);
    }
  }));
  const etat = Object.fromEntries(mesures);
  const enPanne = mesures.filter(([, m]) => m.code !== 200).map(([c]) => c);
  // Un relevé qui trouve une app à terre DOIT échouer : c'est ce qui pose l'alerte.
  if (enPanne.length > 0) throw new Error(`injoignable : ${enPanne.join(", ")}`);
  return etat as Record<string, unknown>;
}

function autorise(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET ?? process.env.SANTE_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret || req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!autorise(req)) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const r = await executerRun("sante_apps", releve, { verrouMs: 5 * 60_000 });
  return NextResponse.json(r, { status: r.statut === "erreur" ? 200 : 200 });
}

export const POST = GET;
