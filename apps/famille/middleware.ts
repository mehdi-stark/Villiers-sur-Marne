import { NextResponse, type NextRequest } from "next/server";
import { creerAuth, DUREE_SESSION_MS, SEUIL_REEMISSION_MS } from "@ville/core/auth";

// En Edge, pas de base : on vérifie la SIGNATURE ici, l'existence du compte est
// re-vérifiée côté serveur (familleCourante). Fichiers PWA publics.
const auth = creerAuth({ app: "famille", cookie: "famille_session", secretEnv: "FAMILLE_AUTH_SECRET", autorise: () => true });

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // /api/passkey : les options de CONNEXION sont publiques par nature ; la route protège elle-même les étapes qui exigent une session.
  if (pathname === "/connexion" || pathname.startsWith("/decouvrir") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/passkey") || pathname.startsWith("/api/cron")) return NextResponse.next();
  if (pathname === "/manifest.webmanifest" || pathname === "/sw.js" || /\.(png|svg|ico|webp)$/.test(pathname)) return NextResponse.next();
  const session = await auth.verifierSession(req.cookies.get(auth.COOKIE)?.value);
  if (session) {
    const res = NextResponse.next();
    if (session.expireLe - Date.now() < SEUIL_REEMISSION_MS) res.cookies.set(auth.COOKIE, await auth.signerSession(session.email), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: DUREE_SESSION_MS / 1000, path: "/" });
    return res;
  }
  if ((req.headers.get("accept") ?? "").includes("text/html")) {
    const url = req.nextUrl.clone(); url.pathname = "/connexion"; url.search = pathname !== "/" ? `?suite=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(url);
  }
  return new NextResponse("Authentification requise.", { status: 401 });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
