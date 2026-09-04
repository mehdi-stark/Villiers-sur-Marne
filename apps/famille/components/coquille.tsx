"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, LogOut, Menu, Receipt, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DESTINATIONS = [
  { href: "/", label: "Ma semaine", Icone: CalendarDays },
  { href: "/factures", label: "Factures", Icone: Receipt },
  { href: "/enfants", label: "Mes enfants", Icone: Users },
];

export function Coquille({ children, commune }: { children: React.ReactNode; commune: { nom: string; courte: string; initiale: string; telephone: string } }) {
  const p = usePathname();
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const connexion = p === "/connexion";
  const actif = (href: string) => (href === "/" ? p === "/" : p.startsWith(href));
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  const deconnecter = async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deconnecter" }) }); router.push("/connexion"); router.refresh(); };
  const liens = (onClick?: () => void) => DESTINATIONS.map(({ href, label, Icone }) => (
    <Link key={href} href={href} className="nav-item" data-actif={actif(href) || undefined} onClick={onClick}><Icone size={16} aria-hidden />{label}</Link>
  ));
  return (
    <div className="coquille">
      <header className="entete">
        <div className="entete-inner">
          {!connexion && (
            <Dialog.Root open={ouvert} onOpenChange={setOuvert}>
              <Dialog.Trigger asChild><button className="bouton-icone bouton-menu" aria-label="Ouvrir le menu"><Menu size={18} /></button></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="voile" />
                <Dialog.Content className="tiroir" aria-describedby={undefined}>
                  <div className="rangee" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                    <Dialog.Title asChild><span className="marque"><span className="marque-logo">{commune.initiale}</span>{commune.nom}</span></Dialog.Title>
                    <Dialog.Close asChild><button className="bouton-icone" aria-label="Fermer le menu"><X size={18} /></button></Dialog.Close>
                  </div>
                  {liens(() => setOuvert(false))}
                  <div className="tiroir-pied">
                    <Link href="/appareils" className="nav-item" onClick={() => setOuvert(false)}>Appareils de confiance</Link>
                    <p className="tiny">Espace Accueil et Facturation : {commune.telephone}</p>
                    <button className="bouton" data-variant="discret" onClick={deconnecter}><LogOut size={15} aria-hidden /> Se déconnecter</button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
          <Link href="/" className="marque" aria-label="Portail Famille — accueil"><span className="marque-logo" aria-hidden>{commune.initiale}</span><span>Famille <small>{commune.courte}</small></span></Link>
          {!connexion && <nav className="nav-desktop" aria-label="Navigation principale">{liens()}</nav>}
          {!connexion && <div className="entete-droite"><button className="bouton bouton-sm nav-desktop" data-variant="discret" onClick={deconnecter}><LogOut size={14} aria-hidden /> Quitter</button></div>}
        </div>
      </header>
      <main className="contenu">{children}</main>
    </div>
  );
}
