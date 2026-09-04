import type { MetadataRoute } from "next";
import { commune } from "@ville/core/communes";

export default function manifest(): MetadataRoute.Manifest {
  const c = commune(process.env.COMMUNE_ID);
  return {
    name: `Portail Famille — ${c.nom}`, short_name: `Famille ${c.courte}`, description: "Réserver, payer, suivre : le portail famille de votre commune.",
    start_url: "/", display: "standalone", background_color: "#f7f7f8", theme_color: c.accent, lang: "fr",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
    shortcuts: [{ name: "Ma semaine", url: "/" }, { name: "Factures", url: "/factures" }],
  };
}
