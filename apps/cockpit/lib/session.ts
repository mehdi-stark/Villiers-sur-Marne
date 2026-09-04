import { cookies } from "next/headers";
import { COOKIE, verifierSession, type Session } from "@ville/core/auth";

/** Session courante côté serveur (pages, server actions). Le middleware a déjà
 *  redirigé vers /connexion ; ici on relit pour connaître l'ACTEUR d'une décision. */
export async function sessionCourante(): Promise<Session | null> {
  return verifierSession((await cookies()).get(COOKIE)?.value);
}

export async function acteurRequis(): Promise<string> {
  const s = await sessionCourante();
  if (!s) throw new Error("Session requise");
  return s.email;
}
