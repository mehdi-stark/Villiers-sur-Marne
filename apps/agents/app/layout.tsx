import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { commune, jetonsCommune } from "@ville/core/communes";
import { Coquille } from "@/components/coquille";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Instrument_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"], display: "swap" });
const c = commune(process.env.COMMUNE_ID);

export const metadata: Metadata = {
  title: { default: `Agents — ${c.nom}`, template: `%s · Agents ${c.courte}` },
  description: "Back-office périscolaire : la file du jour, les écarts, les familles — sur poste et sur tablette.",
  applicationName: `Agents ${c.courte}`, manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: `Agents ${c.courte}` }, icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f7f8" }, { media: "(prefers-color-scheme: dark)", color: "#0f0f13" }] };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <head><style dangerouslySetInnerHTML={{ __html: jetonsCommune(c) }} /></head>
      <body><Coquille commune={{ nom: c.nom, courte: c.courte, initiale: c.logoInitiale, telephone: c.telephoneAccueil }}>{children}</Coquille></body>
    </html>
  );
}
