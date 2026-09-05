import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db, schema } from "@ville/core/db";
import { verifierDemo } from "@ville/core/demonstration";
import { auth } from "@/lib/auth";
import { DUREE_SESSION_MS } from "@ville/core/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** MODE PRÉSENTATION : /presentation?demo=<jeton> ouvre une session de DÉMONSTRATION.
 *  Refusé si la source n'est pas fictive, si DEMO_SECRET manque, si le jeton a expiré (2 h)
 *  ou s'il est altéré. Chaque ouverture est journalisée, et l'app affiche un bandeau
 *  non refermable : une capture ne doit jamais pouvoir passer pour du réel. */
export async function GET(req: NextRequest) {
  const v = await verifierDemo(req.nextUrl.searchParams.get("demo") ?? undefined);
  if (!v.ok) return new NextResponse(`Présentation indisponible : ${v.cause}.`, { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const email = "demo@exemple.invalid";
  await db.insert(schema.journalConnexions).values({ app: "agents", email, evenement: "connexion", detail: { via: "presentation", agent: req.headers.get("user-agent")?.slice(0, 160) } });
  const c = await cookies();
  c.set(auth.COOKIE, await auth.signerSession(email), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 2 * 3600, path: "/" });
  c.set("agents_presentation", "1", { httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 2 * 3600, path: "/" });
  return NextResponse.redirect(new URL(req.nextUrl.searchParams.get("suite") ?? "/", req.url));
}
