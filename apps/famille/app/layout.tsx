import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { commune, jetonsCommune } from "@ville/core/communes";
import { Coquille } from "@/components/coquille";
import { scriptTheme } from "@ville/ui/theme";
import { familleCourante } from "@/lib/session";
import { demarchesDe } from "@ville/core/demarches";
import { surDonneesFictives } from "@ville/core/demonstration";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Instrument_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"], display: "swap" });
const c = commune(process.env.COMMUNE_ID);

export const metadata: Metadata = {
  title: { default: `Portail Famille — ${c.nom}`, template: `%s · Famille ${c.courte}` },
  description: "Réserver, payer, suivre : le portail famille de votre commune, sur votre téléphone.",
  applicationName: `Famille ${c.courte}`, manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: `Famille ${c.courte}` }, icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f7f8" }, { media: "(prefers-color-scheme: dark)", color: "#0f0f13" }] };

export default async function Layout({ children }: { children: React.ReactNode }) {
  const f = await familleCourante();
  const actives = f ? (await demarchesDe(f.famille.id).catch(() => [])).filter((d) => d.etat === "deposee" || d.etat === "en_cours" || d.etat === "refusee").length : 0;
  const presentation = (await cookies()).get("famille_presentation")?.value === "1";
  return (
    <html lang="fr" data-registre="client" className={`${inter.variable} ${display.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: jetonsCommune(c) }} />
        <script dangerouslySetInnerHTML={{ __html: scriptTheme }} />
      </head>
      <body><Coquille commune={{ nom: c.nom, courte: c.courte, initiale: c.logoInitiale, telephone: c.telephoneAccueil, logoUrl: c.logoUrl, mentionLogo: c.mentionLogo }} famille={f?.famille.nom ?? null} email={f?.email ?? null} demarchesActives={actives} demo={surDonneesFictives()} presentation={presentation}>{children}</Coquille></body>
    </html>
  );
}
