import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Coquille } from "@/components/coquille";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Instrument_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Ville — cockpit", template: "%s · Ville" },
  description: "Cockpit du projet Ville : cadrage, backlog, décisions.",
  applicationName: "Ville",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Ville" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f13" },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <body>
        <Coquille>{children}</Coquille>
      </body>
    </html>
  );
}
