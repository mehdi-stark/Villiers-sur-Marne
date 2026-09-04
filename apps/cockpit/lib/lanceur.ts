import { poserAlerte } from "@ville/core/alertes";

/** Dépose une consigne « à chaud » au Lanceur pour la session Claude ouverte sur
 *  ce projet (dossier `ville`). Sans LANCEUR_URL/LANCEUR_SECRET, on le DIT : la
 *  consigne n'est pas partie, l'agent relira au début de sa prochaine session. */
export async function deposerConsigne(texte: string): Promise<{ ok: true } | { ok: false; cause: string }> {
  const url = process.env.LANCEUR_URL, secret = process.env.LANCEUR_SECRET;
  if (!url || !secret) return { ok: false, cause: "Lanceur non configuré (LANCEUR_URL / LANCEUR_SECRET) : l'agent relira à sa prochaine session" };
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/api/ecouteur?action=consigne`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-lanceur-secret": secret },
      body: JSON.stringify({ dossier: process.env.LANCEUR_DOSSIER ?? "ville", texte }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) {
      const cause = r.status === 401 ? "secret Lanceur refusé" : `Lanceur a répondu ${r.status}`;
      await poserAlerte("warn", "lanceur_consigne_echec", cause, {});
      return { ok: false, cause };
    }
    return { ok: true };
  } catch {
    await poserAlerte("warn", "lanceur_consigne_echec", "Lanceur injoignable", {});
    return { ok: false, cause: "Lanceur injoignable" };
  }
}
