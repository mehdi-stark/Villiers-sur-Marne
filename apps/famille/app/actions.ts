"use server";

import { revalidatePath } from "next/cache";
import { reserverOuAnnuler } from "@ville/core/donnees/reservations";
import type { EtatReservation } from "@ville/core/donnees/types";
import { familleCourante } from "@/lib/session";

/** Un tap sur un créneau : le code vérifie que l'enfant est bien de la famille connectée, puis le délai. */
export async function basculerCreneau(p: { enfantId: string; activiteId: string; date: string; actuel: EtatReservation | null }): Promise<{ ok: boolean; message: string }> {
  const f = await familleCourante();
  if (!f) return { ok: false, message: "Session expirée : reconnectez-vous." };
  const enfants = await f.source.enfants(f.famille.id);
  if (!enfants.some((e) => e.id === p.enfantId)) return { ok: false, message: "Cet enfant n'est pas sur votre dossier." };
  const activite = (await f.source.activites()).find((a) => a.id === p.activiteId);
  if (!activite) return { ok: false, message: "Activité inconnue." };
  const voulu = p.actuel === "reservee" ? "annulee" : "reservee";
  const r = await reserverOuAnnuler({ enfantId: p.enfantId, activite, date: p.date, actuel: p.actuel, voulu, acteur: f.email });
  revalidatePath("/");
  return r.ok ? { ok: true, message: voulu === "reservee" ? "Réservé." : "Annulé." } : { ok: false, message: r.motif };
}

/** Semaine type : réserver les repas lundi/mardi/jeudi/vendredi sur N semaines à venir,
 *  chaque jour passant par le même verdict de délai — les refus sont comptés, pas cachés. */
export async function appliquerSemaineType(p: { semaines: number; jours: number[] }): Promise<{ ok: boolean; message: string; reservees: number; refusees: number; dejaReservees: number }> {
  const f = await familleCourante();
  if (!f) return { ok: false, message: "Session expirée.", reservees: 0, refusees: 0, dejaReservees: 0 };
  const n = Math.min(12, Math.max(1, Math.round(p.semaines)));
  const jours = p.jours.filter((j) => j >= 1 && j <= 5);
  const [enfants, activites] = await Promise.all([f.source.enfants(f.famille.id), f.source.activites()]);
  const cantine = activites.find((a) => a.type === "cantine");
  if (!cantine) return { ok: false, message: "Pas de restauration réservable.", reservees: 0, refusees: 0, dejaReservees: 0 };
  const lundi = new Date(); lundi.setUTCHours(0, 0, 0, 0); lundi.setUTCDate(lundi.getUTCDate() + ((8 - (lundi.getUTCDay() || 7)) % 7 || 7));
  let reservees = 0, refusees = 0, deja = 0;
  for (const e of enfants) {
    const du = lundi.toISOString().slice(0, 10), au = new Date(lundi.getTime() + (n * 7 - 1) * 86_400_000).toISOString().slice(0, 10);
    const existantes = await f.source.reservations(e.id, du, au);
    for (let s = 0; s < n; s++) for (const j of jours) {
      const d = new Date(lundi.getTime() + (s * 7 + j - 1) * 86_400_000).toISOString().slice(0, 10);
      if (!cantine.joursServis.includes(j)) continue;
      const actuel = existantes.find((r) => r.activiteId === cantine.id && r.date === d)?.etat ?? null;
      if (actuel === "reservee" || actuel === "presence") { deja++; continue; }
      const r = await reserverOuAnnuler({ enfantId: e.id, activite: cantine, date: d, actuel, voulu: "reservee", acteur: f.email });
      if (r.ok) reservees++; else refusees++;
    }
  }
  revalidatePath("/");
  return { ok: true, message: `${reservees} repas réservé${reservees > 1 ? "s" : ""}${deja ? `, ${deja} déjà réservé${deja > 1 ? "s" : ""}` : ""}${refusees ? `, ${refusees} refusé${refusees > 1 ? "s" : ""} (délai dépassé)` : ""}.`, reservees, refusees, dejaReservees: deja };
}

/** Attestation de paiement : données + PDF figé stockés ensemble, servis par /attestations/[id]. */
export async function genererAttestation(factureId: string): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const f = await familleCourante();
  if (!f) return { ok: false, message: "Session expirée." };
  const [factures, enfants, activites] = await Promise.all([f.source.factures(f.famille.id), f.source.enfants(f.famille.id), f.source.activites()]);
  const fa = factures.find((x) => x.id === factureId);
  if (!fa) return { ok: false, message: "Facture introuvable." };
  const { genererEtStockerAttestation } = await import("@ville/core/documents/attestation");
  const r = await genererEtStockerAttestation("famille", {
    familleId: f.famille.id, famille: f.famille.nom, email: f.email, periode: fa.periode, commune: f.commune,
    lignes: fa.lignes.map((l) => ({ date: l.date, enfant: enfants.find((e) => e.id === l.enfantId)?.prenom ?? l.enfantId, prestation: activites.find((a) => a.id === l.activiteId)?.libelle ?? l.activiteId, montant: l.montant })),
    total: fa.montant, paye: fa.etat === "payee" ? fa.montant : 0, etat: fa.etat, genereLe: new Date().toISOString(),
  });
  return { ok: true, id: r.id };
}
