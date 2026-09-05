import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@ville/core/db";
import { sourceActive } from "@ville/core/donnees";
import { verdictDelai } from "@ville/core/donnees/regles";
import { service } from "@ville/core/donnees/services";
import { envoyerPush } from "@ville/core/push";
import { executerRun, verifierSilence } from "@ville/core/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CODE = "rappel_reservations";
const CADENCE_MS = 7 * 24 * 3600_000; // une fois par semaine

/** Rappel utile et RARE : un push par famille, seulement s'il reste des jours réservables
 *  la semaine prochaine et que le délai court encore. Jamais un message par créneau
 *  (leçon 27 : « 300 commissions = 299 mails pour rien »). */
/** Deux appelants, un seul secret : notre `pnpm rappels` (en-tête `x-cron-secret`) et
 *  l'ordonnanceur Vercel, qui appelle en GET avec `Authorization: Bearer $CRON_SECRET`. */
function autorise(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret || req.headers.get("authorization") === `Bearer ${secret}`;
}

/** L'ordonnanceur Vercel déclenche en GET, une fois par semaine (voir `vercel.json`).
 *  Le garde d'heure locale est ici, pas dans la cadence : Vercel programme en UTC, et
 *  Paris change d'heure deux fois par an — sans ce garde, le rappel partirait à 17 h
 *  l'été et à 19 h l'hiver. Hors de la fenêtre, on ne fait RIEN et on le dit. */
export async function GET(req: NextRequest) {
  if (!autorise(req)) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  // `format()` en fr-FR rend « 2 h » — Number(« 2 h ») = NaN, et NaN passe toutes les
  // comparaisons : on lit la PARTIE `hour`, jamais la chaîne localisée.
  const parts = new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).formatToParts(new Date());
  const heureParis = Number(parts.find((x) => x.type === "hour")?.value);
  // Fenêtre TOLÉRANTE (17 h – 19 h) : l'ordonnanceur ne promet pas la minute exacte.
  if (!(heureParis >= 17 && heureParis <= 19)) return NextResponse.json({ statut: "hors_fenetre", heureParis, fenetre: "17h–19h Europe/Paris" });
  return POST(req);
}

export async function POST(req: NextRequest) {
  if (!autorise(req)) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const sec = req.nextUrl.searchParams.get("action") === "verifier";
  if (sec) return NextResponse.json(await verifierSilence(CODE, CADENCE_MS));

  const r = await executerRun(CODE, async () => {
    const source = sourceActive();
    const comptes = await db.select().from(schema.comptesFamilles);
    const activites = await source.activites();
    const maintenant = new Date();
    // La semaine prochaine (lundi → vendredi).
    const lundi = new Date(maintenant); lundi.setUTCHours(0, 0, 0, 0);
    lundi.setUTCDate(lundi.getUTCDate() + ((8 - (lundi.getUTCDay() || 7)) % 7 || 7));
    const jours = Array.from({ length: 5 }, (_, i) => new Date(lundi.getTime() + i * 86_400_000).toISOString().slice(0, 10));
    let notifiees = 0, envoyes = 0, sansAppareil = 0;
    for (const c of comptes) {
      const enfants = await source.enfants(c.familleId);
      if (!enfants.length) continue;
      let libres = 0;
      let dernierVerdict = "";
      let nomService = "";
      for (const a of activites.filter((x) => x.prevenance.joursAvant > 0)) {
        for (const j of jours) {
          if (!a.joursServis.includes(new Date(`${j}T00:00:00Z`).getUTCDay())) continue;
          const v = verdictDelai(a, j, maintenant);
          if (!v.possible) continue;
          for (const e of enfants) {
            const res = await source.reservations(e.id, j, j);
            const pris = res.some((x) => x.activiteId === a.id && (x.etat === "reservee" || x.etat === "presence"));
            if (!pris) { libres++; dernierVerdict = v.libelle; nomService = service(a).nomGroupe; }
          }
        }
      }
      if (libres === 0) continue;
      const res = await envoyerPush({ titre: `${libres} créneau${libres > 1 ? "x" : ""} encore réservable${libres > 1 ? "s" : ""}`, corps: `${nomService} et autres services de la semaine prochaine — ${dernierVerdict.toLowerCase()}`, url: "/", tag: "rappel-semaine" }, { app: "famille", email: c.email });
      notifiees++; envoyes += res.envoyes;
      if (res.abonnes === 0) sansAppareil++;
    }
    return { comptes: comptes.length, notifiees, envoyes, sansAppareil, semaine: jours[0] };
  }, { verrouMs: 5 * 60_000 });

  return NextResponse.json(r, { status: r.statut === "erreur" ? 500 : 200 });
}
