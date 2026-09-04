import { poserAlerte, resoudreAlerte } from "./alertes";

const EXPEDITEUR = process.env.EMAIL_FROM ?? "Ville <onboarding@resend.dev>";

/** Envoi transactionnel (Resend, seul fournisseur). Retourne la CAUSE d'un
 *  échec sans jamais republier le message du fournisseur. En dev sans clé, le
 *  code est journalisé côté serveur — et une alerte le dit, le silence ment. */
export async function envoyerEmail(p: { a: string; sujet: string; html: string; texte: string }): Promise<{ ok: true } | { ok: false; cause: string }> {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) {
    const cause = "RESEND_API_KEY absente : aucun e-mail ne part";
    await poserAlerte("critique", "email_cle_absente", cause, { destinataire: p.a });
    if (process.env.NODE_ENV !== "production") console.warn(`[email:dev] ${p.sujet} → ${p.a}\n${p.texte}`);
    return { ok: false, cause };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cle}` },
      body: JSON.stringify({ from: EXPEDITEUR, to: [p.a], subject: p.sujet, html: p.html, text: p.texte }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) {
      const cause = r.status === 401 || r.status === 403 ? "clé Resend refusée par le fournisseur" : r.status === 422 ? "expéditeur ou destinataire refusé (domaine non vérifié ?)" : `Resend a répondu ${r.status}`;
      await poserAlerte("critique", "email_envoi_echec", cause, { statut: r.status, destinataire: p.a });
      return { ok: false, cause };
    }
    await resoudreAlerte("email_envoi_echec");
    await resoudreAlerte("email_cle_absente");
    return { ok: true };
  } catch (e) {
    const cause = e instanceof Error && e.name === "TimeoutError" ? "Resend injoignable (délai dépassé)" : "Resend injoignable (réseau)";
    await poserAlerte("critique", "email_envoi_echec", cause, { destinataire: p.a });
    return { ok: false, cause };
  }
}
