"use client";

import { BarChart3, CheckSquare, ClipboardList, Compass, Database, LayoutDashboard, Eye, Palette, Settings, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { BandeauDemo, CoquilleAdmin, MenuProfil, type Section } from "@ville/ui";
import { VerrouBiometrique } from "@ville/core/ui/passkeys";
import { Pwa } from "./pwa";

export function Coquille({ children, email, aTrancher, aReporter, demo }: { children: React.ReactNode; email: string | null; aTrancher: number; aReporter: number; demo: boolean }) {
  const router = useRouter();
  const deconnecter = async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deconnecter" }) }); router.push("/connexion"); router.refresh(); };
  const sections: Section[] = [
    { titre: "Pilotage", destinations: [
      { href: "/", label: "Tableau de bord", Icone: LayoutDashboard },
      { href: "/pilotage/decisions", label: "Décisions", Icone: CheckSquare, compteur: aTrancher, tone: "warn" },
    ] },
    { titre: "Le projet", destinations: [
      { href: "/pilotage/cadrage", label: "Cadrage", Icone: Compass },
      { href: "/pilotage/design", label: "Direction artistique", Icone: Palette },
      { href: "/pilotage/marche", label: "Analyse de marché", Icone: BarChart3 },
      { href: "/pilotage/backlog", label: "Backlog", Icone: ClipboardList },
    ] },
    { titre: "Le produit", destinations: [
      { href: "/pilotage/donnees", label: "Données et tarifs", Icone: Database },
      { href: "/pilotage/presentations", label: "Présentations", Icone: Eye },
    ] },
  ];
  const profil = email ? (
    <MenuProfil identite={{ nom: email.split("@")[0] ?? email, sousTitre: email, initiale: (email[0] ?? "V").toUpperCase() }}
      liens={[{ href: "/appareils", label: "Appareils et sécurité", Icone: Smartphone }, { href: "/reglages", label: "Réglages", Icone: Settings }]}
      deconnecter={deconnecter}
      extra={aReporter > 0 ? <div className="profil-item" style={{ cursor: "default" }}><CheckSquare size={16} aria-hidden /> {aReporter} décision(s) à reporter par l'agent</div> : undefined} />
  ) : undefined;
  return <CoquilleAdmin marque={{ nom: "Ville — cockpit", courte: "Ville", initiale: "V", sousTitre: "cockpit", logoUrl: "/logo-villiers.svg" }} sections={sections} profil={profil}><VerrouBiometrique cle="ville-passkey" /><Pwa />{demo && <BandeauDemo detail="Le produit tourne sur la source fictive." />}{children}</CoquilleAdmin>;
}
