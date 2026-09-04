"use client";

import { BarChart3, CheckSquare, ClipboardList, Compass, Database, LayoutDashboard, Palette, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { VerrouBiometrique } from "@ville/core/ui/passkeys";
import { CoquilleAdmin } from "@ville/ui";
import { Pwa } from "./pwa";

const DESTINATIONS = [
  { href: "/", label: "Pilotage", Icone: LayoutDashboard },
  { href: "/pilotage/decisions", label: "Décisions", Icone: CheckSquare },
  { href: "/pilotage/cadrage", label: "Cadrage", Icone: Compass },
  { href: "/pilotage/design", label: "Design", Icone: Palette },
  { href: "/pilotage/marche", label: "Marché", Icone: BarChart3 },
  { href: "/pilotage/backlog", label: "Backlog", Icone: ClipboardList },
  { href: "/pilotage/donnees", label: "Données", Icone: Database },
  { href: "/appareils", label: "Appareils", Icone: Smartphone },
];

export function Coquille({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const deconnecter = async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deconnecter" }) }); router.push("/connexion"); router.refresh(); };
  return <CoquilleAdmin marque={{ nom: "Ville — cockpit", courte: "Ville", initiale: "V", sousTitre: "cockpit" }} destinations={DESTINATIONS} deconnecter={deconnecter}><VerrouBiometrique cle="ville-passkey" /><Pwa />{children}</CoquilleAdmin>;
}
