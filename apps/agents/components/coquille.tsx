"use client";

import { CalendarDays, FileText, Receipt, Smartphone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { VerrouBiometrique } from "@ville/core/ui/passkeys";
import { CoquilleAdmin } from "@ville/ui";

const DESTINATIONS = [
  { href: "/", label: "File du jour", Icone: CalendarDays },
  { href: "/demarches", label: "Démarches", Icone: FileText },
  { href: "/familles", label: "Familles", Icone: Users },
  { href: "/activites", label: "Activités", Icone: Receipt },
  { href: "/appareils", label: "Appareils", Icone: Smartphone },
];

export function Coquille({ children, commune }: { children: React.ReactNode; commune: { nom: string; courte: string; initiale: string; telephone: string } }) {
  const router = useRouter();
  const deconnecter = async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deconnecter" }) }); router.push("/connexion"); router.refresh(); };
  return <CoquilleAdmin marque={{ nom: `Agents — ${commune.nom}`, courte: "Agents", initiale: commune.initiale, sousTitre: commune.courte }} destinations={DESTINATIONS} deconnecter={deconnecter} pied={<p className="mini t-3"><VerrouBiometrique cle="agents-passkey" />Espace Accueil et Facturation — {commune.telephone}</p>}>{children}</CoquilleAdmin>;
}
