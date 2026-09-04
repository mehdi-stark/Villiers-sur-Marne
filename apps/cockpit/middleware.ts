import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, DUREE_SESSION_MS, SEUIL_REEMISSION_MS, signerSession, verifierSession } from "@ville/core/auth";

// Tout est protégé sauf la connexion, l'API auth et les fichiers publics de
// l'app (manifest/icônes : un 401 rend une PWA non installable).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // /api/agent vérifie son propre secret (x-agent-secret) : l'agent n'a pas de session.
  if (pathname === "/connexion" || pathname.startsWith("/api/auth") || pathname === "/api/agent") return NextResponse.next();
  if (pathname === "/manifest.webmanifest" || pathname === "/sw.js" || /\.(png|svg|ico|webp)$/.test(pathname)) return NextResponse.next();

  const session = await verifierSession(req.cookies.get(COOKIE)?.value);
  if (session) {
    const res = NextResponse.next();
    // Session glissante : réémise sous 7 j de l'expiration — une PWA utilisée
    // reste ouverte, l'inactivité déconnecte toujours.
    if (session.expireLe - Date.now() < SEUIL_REEMISSION_MS) {
      res.cookies.set(COOKIE, await signerSession(session.email), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: DUREE_SESSION_MS / 1000, path: "/" });
    }
    return res;
  }
  if ((req.headers.get("accept") ?? "").includes("text/html")) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = pathname !== "/" ? `?suite=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(url);
  }
  return new NextResponse("Authentification requise.", { status: 401 });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
