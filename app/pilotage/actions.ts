"use server";

import { revalidatePath } from "next/cache";
import { enregistrerDecision } from "@/lib/decisions";
import { acteurRequis } from "@/lib/session";

/** Un tap = une ligne dans `decisions`. L'acteur vient de la session, jamais du client. */
export async function trancher(p: { sujet: "cadrage" | "backlog" | "marche"; cle: string; libelle: string; choix: string; note?: string }) {
  const acteur = await acteurRequis();
  if (!p.cle || !p.choix) throw new Error("Décision incomplète");
  await enregistrerDecision({ ...p, acteur });
  revalidatePath("/pilotage/cadrage");
  revalidatePath("/pilotage/backlog");
  revalidatePath("/pilotage/marche");
  revalidatePath("/");
}
