"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { BarChart3, ClipboardList, Compass, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Pwa } from "./pwa";

// Une coquille pour tout le cockpit : header collant, navigation desktop,
// drawer mobile (Radix Dialog : focus trap, Échap, aria — jamais une modale maison).
const DESTINATIONS = [
  { href: "/", label: "Pilotage", Icone: LayoutDashboard },
  { href: "/pilotage/cadrage", label: "Cadrage", Icone: Compass },
  { href: "/pilotage/marche", label: "Marché", Icone: BarChart3 },
  { href: "/pilotage/backlog", label: "Backlog", Icone: ClipboardList },
];

export function Coquille({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const actif = (href: string) => (href === "/" ? p === "/" : p.startsWith(href));
  const connexion = p === "/connexion";

  const deconnecter = async () => {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deconnecter" }) });
    router.push("/connexion");
    router.refresh();
  };

  const liens = (onClick?: () => void) =>
    DESTINATIONS.map(({ href, label, Icone }) => (
      <Link key={href} href={href} className="nav-item" data-actif={actif(href) || undefined} onClick={onClick}>
        <Icone size={16} aria-hidden />
        {label}
      </Link>
    ));

  return (
    <div className="coquille">
      <header className="entete">
        <div className="entete-inner">
          {!connexion && (
            <Dialog.Root open={ouvert} onOpenChange={setOuvert}>
              <Dialog.Trigger asChild>
                <button className="bouton-icone bouton-menu" aria-label="Ouvrir le menu">
                  <Menu size={18} />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="voile" />
                <Dialog.Content className="tiroir" aria-describedby={undefined}>
                  <div className="rangee" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                    <Dialog.Title asChild>
                      <span className="marque"><span className="marque-logo">V</span>Ville</span>
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="bouton-icone" aria-label="Fermer le menu"><X size={18} /></button>
                    </Dialog.Close>
                  </div>
                  {liens(() => setOuvert(false))}
                  <div className="tiroir-pied">
                    <button className="bouton" data-variant="discret" onClick={deconnecter}><LogOut size={15} aria-hidden /> Se déconnecter</button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
          <Link href="/" className="marque" aria-label="Ville — accueil du cockpit">
            <span className="marque-logo" aria-hidden>V</span>
            <span>Ville <small>cockpit</small></span>
          </Link>
          {!connexion && <nav className="nav-desktop" aria-label="Navigation principale">{liens()}</nav>}
          {!connexion && (
            <div className="entete-droite">
              <button className="bouton bouton-sm nav-desktop" data-variant="discret" onClick={deconnecter} title="Se déconnecter">
                <LogOut size={14} aria-hidden /> Quitter
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="contenu">
        {!connexion && <Pwa />}
        {children}
      </main>
    </div>
  );
}
