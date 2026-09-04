"use client";

import { CalendarDays, FileText, Receipt, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { VerrouBiometrique } from "@ville/core/ui/passkeys";
import { CoquilleClient } from "@ville/ui";

const DESTINATIONS = [
  { href: "/", label: "Ma semaine", Icone: CalendarDays },
  { href: "/factures", label: "Factures", Icone: Receipt },
  { href: "/demarches", label: "Démarches", Icone: FileText },
  { href: "/enfants", label: "Enfants", Icone: Users },
];

export function Coquille({ children, commune }: { children: React.ReactNode; commune: { nom: string; courte: string; initiale: string; telephone: string } }) {
  const router = useRouter();
  const deconnecter = async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deconnecter" }) }); router.push("/connexion"); router.refresh(); };
  return <CoquilleClient marque={{ nom: `Portail Famille — ${commune.nom}`, courte: "Famille", initiale: commune.initiale, sousTitre: commune.courte }} destinations={DESTINATIONS} deconnecter={deconnecter}><VerrouBiometrique cle="famille-passkey" />{children}</CoquilleClient>;
}
