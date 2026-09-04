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
