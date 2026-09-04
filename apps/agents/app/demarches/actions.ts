"use server";

import { revalidatePath } from "next/cache";
import { changerEtat, type Etat } from "@ville/core/demarches";
import { agentCourant } from "@/lib/session";

export async function traiterDemarche(p: { id: string; vers: Etat; motif?: string }): Promise<{ ok: boolean; message: string }> {
  const a = await agentCourant();
  if (!a) return { ok: false, message: "Session expirée." };
  const r = await changerEtat({ id: p.id, vers: p.vers, acteur: a.email, app: "agents", motif: p.motif });
  revalidatePath("/demarches");
  revalidatePath("/");
  return r.ok ? { ok: true, message: p.vers === "validee" ? "Validée" : p.vers === "refusee" ? "Renvoyée à la famille" : "Prise en charge" } : { ok: false, message: r.cause };
}
