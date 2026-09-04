"use server";

import { revalidatePath } from "next/cache";
import { enregistrerDecision } from "@/lib/decisions";
import { acteurRequis } from "@/lib/session";
import { deposerConsigne } from "@/lib/lanceur";
import { nombreOuvertes } from "@/lib/ouvertes";

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

/** « Prévenir l'agent maintenant » : une consigne au Lanceur, qui la dépose dans
 *  .claude-consignes.md de la session ouverte — sinon elle attend `pnpm decisions`. */
export async function prevenirAgent(): Promise<{ ok: boolean; message: string }> {
  await acteurRequis();
  const restantes = await nombreOuvertes();
  const r = await deposerConsigne(`Décisions tranchées depuis le cockpit Ville : lance \`pnpm decisions\`, reporte chaque choix dans le document canonique (date), puis \`pnpm decisions --reporter <ids>\`. Il reste ${restantes} décision(s) ouverte(s).`);
  return r.ok ? { ok: true, message: "Consigne déposée : l'agent la lit entre deux maillons." } : { ok: false, message: r.cause };
}
