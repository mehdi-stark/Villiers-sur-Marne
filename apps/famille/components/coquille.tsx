"use client";

import { Bell, CalendarDays, FileText, Receipt, Smartphone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { BandeauDemo, CoquilleClient, MenuProfil } from "@ville/ui";
import { VerrouBiometrique } from "@ville/core/ui/passkeys";

export function Coquille({ children, commune, famille, email, demarchesActives, demo, presentation }: { children: React.ReactNode; commune: { nom: string; courte: string; initiale: string; telephone: string; logoUrl: string | null; mentionLogo: string | null }; famille: string | null; email: string | null; demarchesActives: number; demo: boolean; presentation: boolean }) {
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
      extra={<div className="profil-item" style={{ cursor: "default", display: "grid", gap: 2 }}><span>Accueil et Facturation — {commune.telephone}</span>{commune.mentionLogo && <span className="mention">{commune.mentionLogo}</span>}</div>} />
  ) : undefined;
  const action = <a className="bouton bouton-sm" data-variant="primaire" href="/connexion">Se connecter</a>;
  return <CoquilleClient action={action} marque={{ nom: `Portail Famille — ${commune.nom}`, courte: "Famille", initiale: commune.initiale, sousTitre: commune.courte, logoUrl: commune.logoUrl }} destinations={destinations} profil={profil}><VerrouBiometrique cle="famille-passkey" />{demo && <BandeauDemo presentation={presentation} />}{children}</CoquilleClient>;
}
