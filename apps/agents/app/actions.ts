"use server";

import { revalidatePath } from "next/cache";
import { pointer } from "@ville/core/donnees/reservations";
import type { EtatReservation } from "@ville/core/donnees/types";
import { agentCourant } from "@/lib/session";

/** Pointage tactile : présent ou absent, journalisé avec l'agent ; refusé par le code sur une date future. */
export async function pointerEnfant(p: { enfantId: string; activiteId: string; date: string; actuel: EtatReservation | null; voulu: "presence" | "absence" }): Promise<{ ok: boolean; message: string }> {
  const a = await agentCourant();
  if (!a) return { ok: false, message: "Session expirée." };
  const aujourdhui = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
  const r = await pointer({ ...p, acteur: a.email, aujourdhui });
  revalidatePath("/");
  return r.ok ? { ok: true, message: p.voulu === "presence" ? "Présent" : "Absent" } : { ok: false, message: r.motif };
}
