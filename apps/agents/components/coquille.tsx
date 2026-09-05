"use client";

import { CalendarDays, FileText, Receipt, Settings, Smartphone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { CoquilleAdmin, MenuProfil, type Section } from "@ville/ui";
import { VerrouBiometrique } from "@ville/core/ui/passkeys";

export function Coquille({ children, commune, email, aTraiter, aPointer }: { children: React.ReactNode; commune: { nom: string; courte: string; initiale: string; telephone: string }; email: string | null; aTraiter: number; aPointer: number }) {
  const router = useRouter();
  const deconnecter = async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deconnecter" }) }); router.push("/connexion"); router.refresh(); };
  const sections: Section[] = [
    { titre: "Aujourd'hui", destinations: [{ href: "/", label: "File du jour", Icone: CalendarDays, compteur: aPointer, tone: "accent" }] },
    { titre: "Dossiers", destinations: [
      { href: "/demarches", label: "Démarches", Icone: FileText, compteur: aTraiter, tone: "warn" },
      { href: "/familles", label: "Familles", Icone: Users },
    ] },
    { titre: "Référentiel", destinations: [{ href: "/activites", label: "Activités et tarifs", Icone: Receipt }] },
  ];
  const profil = email ? (
    <MenuProfil identite={{ nom: email.split("@")[0] ?? email, sousTitre: `Agent · ${commune.nom}`, initiale: (email[0] ?? "A").toUpperCase() }}
      liens={[{ href: "/appareils", label: "Appareils et sécurité", Icone: Smartphone }, { href: "/reglages", label: "Réglages", Icone: Settings }]}
      deconnecter={deconnecter}
      extra={<div className="profil-item" style={{ cursor: "default" }}>Accueil et Facturation — {commune.telephone}</div>} />
  ) : undefined;
  return <CoquilleAdmin marque={{ nom: `Agents — ${commune.nom}`, courte: "Agents", initiale: commune.initiale, sousTitre: commune.courte }} sections={sections} profil={profil}><VerrouBiometrique cle="agents-passkey" />{children}</CoquilleAdmin>;
}
