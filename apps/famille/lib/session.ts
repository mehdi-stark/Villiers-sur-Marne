import { cookies } from "next/headers";
import { auth, compteDe } from "./auth";
import { sourceActive } from "@ville/core/donnees";
import { commune } from "@ville/core/communes";

/** La famille connectée, sa commune et sa source de données — ou null (le middleware a déjà redirigé). */
export async function familleCourante() {
  const s = await auth.verifierSession((await cookies()).get(auth.COOKIE)?.value);
  if (!s) return null;
  const compte = await compteDe(s.email);
  if (!compte) return null;
  const source = sourceActive();
  const famille = await source.famille(compte.familleId);
  if (!famille) return null;
  return { email: s.email, compte, famille, commune: commune(compte.communeId), source };
}
