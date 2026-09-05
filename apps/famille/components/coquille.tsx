"use client";

import { Bell, CalendarDays, FileText, Receipt, Smartphone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { CoquilleClient, MenuProfil } from "@ville/ui";
import { VerrouBiometrique } from "@ville/core/ui/passkeys";

export function Coquille({ children, commune, famille, email, demarchesActives }: { children: React.ReactNode; commune: { nom: string; courte: string; initiale: string; telephone: string }; famille: string | null; email: string | null; demarchesActives: number }) {
  const router = useRouter();
  const deconnecter = async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deconnecter" }) }); router.push("/connexion"); router.refresh(); };
  const destinations = [
    { href: "/", label: "Ma semaine", Icone: CalendarDays },
    { href: "/factures", label: "Factures", Icone: Receipt },
    { href: "/demarches", label: "Démarches", Icone: FileText, compteur: demarchesActives, tone: "accent" as const },
    { href: "/enfants", label: "Enfants", Icone: Users },
  ];
  const profil = famille && email ? (
    <MenuProfil cote="bottom" align="end" identite={{ nom: famille, sousTitre: email, initiale: famille.slice(0, 1).toUpperCase() }}
      liens={[{ href: "/enfants", label: "Mon dossier", Icone: Users }, { href: "/appareils", label: "Appareils et sécurité", Icone: Smartphone }, { href: "/reglages", label: "Notifications", Icone: Bell }]}
      deconnecter={deconnecter}
      extra={<div className="profil-item" style={{ cursor: "default" }}>Accueil et Facturation — {commune.telephone}</div>} />
  ) : undefined;
  return <CoquilleClient marque={{ nom: `Portail Famille — ${commune.nom}`, courte: "Famille", initiale: commune.initiale, sousTitre: commune.courte }} destinations={destinations} profil={profil}><VerrouBiometrique cle="famille-passkey" />{children}</CoquilleClient>;
}
