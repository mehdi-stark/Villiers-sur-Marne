"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export type Destination = { href: string; label: string; Icone: LucideIcon; compteur?: number; tone?: "warn" | "accent" };
export type Section = { titre: string; destinations: Destination[] };
export type Marque = { nom: string; courte: string; initiale: string; sousTitre?: string; logoUrl?: string | null };

const actif = (p: string, href: string) => (href === "/" ? p === "/" : p.startsWith(href));

/** Coquille PRODUIT CLIENT : en-tête léger + onglets en bas sur mobile, liens en haut sur desktop. */
/** La marque : le logo officiel de la commune s'il existe, sinon l'initiale sur l'accent. */
function Marque({ marque, style }: { marque: Marque; style?: React.CSSProperties }) {
  return (
    <Link href="/" className="marque" style={style} aria-label={`${marque.nom} — accueil`}>
      {marque.logoUrl ? <img src={marque.logoUrl} alt="" className="marque-logo-officiel" /> : <span className="marque-logo" aria-hidden>{marque.initiale}</span>}
      <span>{marque.courte} {marque.sousTitre && <small>{marque.sousTitre}</small>}</span>
    </Link>
  );
}

export function CoquilleClient({ children, marque, destinations, profil, connexionPath = "/connexion", action }: { children: ReactNode; marque: Marque; destinations: Destination[]; profil?: ReactNode; connexionPath?: string; action?: ReactNode }) {
  const p = usePathname();
  // Pas de profil = pas de session : la navigation privée disparaît (page publique).
  const connexion = p === connexionPath || !profil;
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  return (
    <div className="coquille">
      <header className="entete">
        <div className="entete-inner">
          <Marque marque={marque} />
          {!connexion && <nav className="nav-desktop" aria-label="Navigation principale" style={{ marginLeft: 8 }}>{destinations.map(({ href, label, Icone }) => <Link key={href} href={href} className="nav-lien" data-actif={actif(p, href) || undefined}><Icone size={16} aria-hidden />{label}</Link>)}</nav>}
          {!connexion && profil && <div style={{ marginLeft: "auto", maxWidth: 210 }}>{profil}</div>}
          {connexion && action && <div style={{ marginLeft: "auto" }}>{action}</div>}
        </div>
      </header>
      <main className="contenu">{children}</main>
      {!connexion && (
        <nav className="onglets" aria-label="Navigation">
          {destinations.map(({ href, label, Icone, compteur, tone }) => (
            <Link key={href} href={href} className="onglet" data-actif={actif(p, href) || undefined}>
              <span className="onglet-icone">{compteur !== undefined && compteur > 0 && <span className="onglet-pastille" data-tone={tone} aria-hidden />}<Icone size={20} aria-hidden /></span>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

/** Coquille ADMIN : barre latérale ORGANISÉE PAR SECTIONS (un menu qui s'empile ne dit
 *  plus quoi fait quoi), menu profil en bas, tiroir sur mobile. */
export function CoquilleAdmin({ children, marque, sections, profil, deconnecter, connexionPath = "/connexion" }: { children: ReactNode; marque: Marque; sections: Section[]; profil?: ReactNode; deconnecter?: () => void; connexionPath?: string }) {
  const p = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const connexion = p === connexionPath;
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  const menu = (onClick?: () => void) => sections.map((s) => (
    <div key={s.titre} className="nav-section">
      <div className="nav-titre">{s.titre}</div>
      {s.destinations.map(({ href, label, Icone, compteur, tone }) => (
        <Link key={href} href={href} className="nav-lien" data-actif={actif(p, href) || undefined} onClick={onClick}>
          <Icone size={16} aria-hidden />
          {label}
          {compteur !== undefined && compteur > 0 && <span className="nav-compteur" data-tone={tone}>{compteur}</span>}
        </Link>
      ))}
    </div>
  ));
  if (connexion) return <div className="coquille"><div className="principal"><main className="contenu">{children}</main></div></div>;
  return (
    <div className="coquille">
      <aside className="laterale">
        <Marque marque={marque} style={{ padding: "4px 8px 12px" }} />
        {menu()}
        <div className="laterale-pied">{profil}</div>
      </aside>
      <div className="principal">
        <header className="entete entete-mobile">
          <div className="entete-inner">
            <Dialog.Root open={ouvert} onOpenChange={setOuvert}>
              <Dialog.Trigger asChild><button className="bouton-icone" aria-label="Ouvrir le menu"><Menu size={18} /></button></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="voile" />
                <Dialog.Content className="tiroir" aria-describedby={undefined}>
                  <div className="rangee" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                    <Dialog.Title asChild><span className="marque"><span className="marque-logo">{marque.initiale}</span>{marque.nom}</span></Dialog.Title>
                    <Dialog.Close asChild><button className="bouton-icone" aria-label="Fermer le menu"><X size={18} /></button></Dialog.Close>
                  </div>
                  {menu(() => setOuvert(false))}
                  <div className="tiroir-pied">{profil}</div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <Marque marque={marque} />
            <div style={{ marginLeft: "auto" }}>{profil}</div>
          </div>
        </header>
        <main className="contenu">{children}</main>
      </div>
    </div>
  );
}

/** État vide ILLUSTRÉ et expliqué : pourquoi vide, qui débloque. */
export function EtatVide({ illustration, titre, enfants }: { illustration: ReactNode; titre: string; enfants?: ReactNode }) {
  return <div className="carte vide">{illustration}<strong>{titre}</strong>{enfants && <span className="petit">{enfants}</span>}</div>;
}

/** Tuile chiffre avec compteur animé (respecte prefers-reduced-motion). */
export function TuileChiffre({ libelle, valeur, suffixe, detail, href, tone }: { libelle: string; valeur: number | string; suffixe?: string; detail?: ReactNode; href?: string; tone?: "ok" | "warn" | "accent" | "danger" }) {
  const reduit = useReducedMotion();
  const [affiche, setAffiche] = useState<number | string>(typeof valeur === "number" && !reduit ? 0 : valeur);
  useEffect(() => {
    if (typeof valeur !== "number" || reduit) { setAffiche(valeur); return; }
    const debut = performance.now(); const duree = 500;
    let raf = 0;
    const tick = (t: number) => { const k = Math.min(1, (t - debut) / duree); setAffiche(Math.round(valeur * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [valeur, reduit]);
  const corps = (
    <>
      <span className="petit t-2">{libelle}</span>
      <span className="tuile-chiffre" style={tone ? { color: `var(--${tone})` } : undefined}>{affiche}{suffixe && <span className="t-3" style={{ fontSize: 14, fontWeight: 500 }}>{suffixe}</span>}</span>
      {detail && <span className="mini t-3">{detail}</span>}
    </>
  );
  return href ? <Link href={href} className="tuile">{corps}</Link> : <div className="tuile">{corps}</div>;
}

/** Liste dont les éléments apparaissent en cascade (léger, 8 px, 40 ms d'écart). */
export function Cascade({ children, className }: { children: ReactNode[]; className?: string }) {
  const reduit = useReducedMotion();
  return (
    <div className={className}>
      {children.map((c, i) => (
        <motion.div key={i} initial={reduit ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: Math.min(i, 8) * 0.04, ease: [0.2, 0.8, 0.2, 1] }}>{c}</motion.div>
      ))}
    </div>
  );
}

/** Bouton avec spring au tap. */
export function BoutonTap({ children, ...props }: React.ComponentProps<typeof motion.button>) {
  const reduit = useReducedMotion();
  return <motion.button whileTap={reduit ? undefined : { scale: 0.96 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} {...props}>{children}</motion.button>;
}

export { IlluAppareil, IlluCalendrier, IlluFacture, IlluFile } from "./illustrations";
export { MenuProfil, LIENS_COMPTE, type Identite, type LienProfil } from "./profil";
export { BasculeTheme, scriptTheme, type Theme } from "./theme";
export { BandeauDemo } from "./demo";
