"use server";

import { revalidatePath } from "next/cache";
import { deposerDemarche, type CodePiece, type TypeDemarche } from "@ville/core/demarches";
import { familleCourante } from "@/lib/session";

export async function envoyerDemarche(p: { type: TypeDemarche; message: string; pieces: { code: CodePiece; nom: string; mime: string; contenuBase64: string }[] }): Promise<{ ok: boolean; message: string }> {
  const f = await familleCourante();
  if (!f) return { ok: false, message: "Session expirée : reconnectez-vous." };
  const r = await deposerDemarche({ familleId: f.famille.id, email: f.email, type: p.type, donnees: { message: p.message.trim().replace(/\r\n?/g, "\n").slice(0, 2000), famille: f.famille.nom }, pieces: p.pieces });
  if (!r.ok) return { ok: false, message: r.cause };
  revalidatePath("/demarches");
  return { ok: true, message: "Démarche envoyée. Vous suivez son avancement ici." };
}
