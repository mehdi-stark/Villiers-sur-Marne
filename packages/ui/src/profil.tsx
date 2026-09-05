"use client";

import * as Popover from "@radix-ui/react-popover";
import { Bell, ChevronsUpDown, LogOut, Settings, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BasculeTheme } from "./theme";

export type Identite = { nom: string; sousTitre?: string; initiale?: string };
export type LienProfil = { href: string; label: string; Icone?: typeof Settings };

/** MENU PROFIL — standard de toute application à compte : qui je suis, mes réglages,
 *  le thème, mes appareils, la sortie. Au même endroit, en bas de la barre latérale
 *  (admin) ou dans l'en-tête (produit client) : plus de « Quitter » perdu dans les menus. */
export function MenuProfil({ identite, liens = [], deconnecter, extra, align = "start", cote = "top" }: {
  identite: Identite; liens?: LienProfil[]; deconnecter?: () => void; extra?: ReactNode; align?: "start" | "center" | "end"; cote?: "top" | "bottom";
}) {
  const [ouvert, setOuvert] = useState(false);
  const initiale = identite.initiale ?? identite.nom.slice(0, 1).toUpperCase();
  return (
    <Popover.Root open={ouvert} onOpenChange={setOuvert}>
      <Popover.Trigger asChild>
        <button type="button" className="profil-bouton" data-etat={ouvert ? "ouvert" : undefined} aria-label={`Compte : ${identite.nom}`}>
          <span className="profil-avatar" aria-hidden>{initiale}</span>
          <span className="profil-ident">
            <span className="profil-nom">{identite.nom}</span>
            {identite.sousTitre && <span className="profil-role">{identite.sousTitre}</span>}
          </span>
          <ChevronsUpDown size={15} aria-hidden style={{ marginLeft: "auto", color: "var(--texte-3)", flex: "0 0 auto" }} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="profil-panneau" side={cote} align={align} sideOffset={8} collisionPadding={12}>
          <div className="profil-entete">
            <span className="profil-avatar" aria-hidden>{initiale}</span>
            <div className="profil-ident">
              <span className="profil-nom">{identite.nom}</span>
              {identite.sousTitre && <span className="profil-role">{identite.sousTitre}</span>}
            </div>
          </div>
          {extra}
          <div className="profil-sep" />
          <div className="profil-libelle">Apparence</div>
          <BasculeTheme />
          {liens.length > 0 && <div className="profil-sep" />}
          {liens.map(({ href, label, Icone }) => (
            <Link key={href} href={href} className="profil-item" onClick={() => setOuvert(false)}>
              {Icone ? <Icone size={16} aria-hidden /> : <Settings size={16} aria-hidden />}
              {label}
            </Link>
          ))}
          {deconnecter && (
            <>
              <div className="profil-sep" />
              <button type="button" className="profil-item" data-danger onClick={deconnecter}><LogOut size={16} aria-hidden /> Se déconnecter</button>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export const LIENS_COMPTE: LienProfil[] = [
  { href: "/appareils", label: "Appareils et sécurité", Icone: Smartphone },
  { href: "/reglages", label: "Réglages et notifications", Icone: Bell },
];
