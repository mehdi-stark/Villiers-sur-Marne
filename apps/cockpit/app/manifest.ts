import type { MetadataRoute } from "next";

// PWA : le cockpit s'installe sur le téléphone (icône, plein écran, push).
// Servi HORS session par le middleware — un 401 rend l'app non installable.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ville — cockpit",
    short_name: "Ville",
    description: "Cadrage, backlog et décisions du projet Ville.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f8",
    theme_color: "#2f5bea",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Cadrage", url: "/pilotage/cadrage", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Backlog", url: "/pilotage/backlog", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
