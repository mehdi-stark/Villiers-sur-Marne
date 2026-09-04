import { cookies } from "next/headers";
import { auth } from "./auth";
import { sourceActive } from "@ville/core/donnees";
import { commune } from "@ville/core/communes";

export async function agentCourant() {
  const s = await auth.verifierSession((await cookies()).get(auth.COOKIE)?.value);
  if (!s) return null;
  return { email: s.email, commune: commune(process.env.COMMUNE_ID), source: sourceActive() };
}
