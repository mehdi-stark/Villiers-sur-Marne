"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

/* CHARGEMENT ET CLICS — un geste sans réponse est un geste raté.
 * Retour de l'opérateur (06/09/2026) : « la gestion des clics et des chargements doit être
 * mieux gérée ». Trois règles, tenues ici pour les trois apps :
 *   1. Tout clic répond en MOINS de 100 ms — le contrôle passe visiblement « en cours ».
 *   2. Un changement de page montre une barre de progression, puis un SQUELETTE de la page
 *      visée (jamais un écran blanc, jamais un spinner centré sur du vide).
 *   3. Un contrôle « en cours » ne se re-tape pas : il se désactive, et il le montre. */

/** Point d'attente : le seul mouvement autorisé dans un outil de travail. */
export function Rouet({ taille = 14 }: { taille?: number }) {
  return <span className="rouet" style={{ width: taille, height: taille }} role="presentation" aria-hidden />;
}

/** Barre de progression de navigation, montée une fois dans la coquille.
 *  Elle démarre au clic sur un lien interne et s'efface quand la nouvelle page est peinte. */
export function BarreRoute() {
  const chemin = usePathname();
  const [actif, setActif] = useState(false);
  const dernier = useRef(chemin);
  useEffect(() => {
    const clic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      if (href.split("?")[0] === chemin) return; // même page : rien à charger
      setActif(true);
    };
    document.addEventListener("click", clic, true);
    return () => document.removeEventListener("click", clic, true);
  }, [chemin]);
  useEffect(() => {
    if (dernier.current !== chemin) { dernier.current = chemin; setActif(false); }
  }, [chemin]);
  // Filet de sécurité : une navigation qui n'aboutit pas ne laisse pas la barre à vie.
  useEffect(() => {
    if (!actif) return;
    const t = setTimeout(() => setActif(false), 8000);
    return () => clearTimeout(t);
  }, [actif]);
  return <div className="barre-route" data-actif={actif || undefined} aria-hidden />;
}

/** Un lien qui DIT qu'il charge : la cible reçoit un point d'attente tant que la page arrive. */
export function Lien({ children, className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={className}>
      <EtatLien>{children}</EtatLien>
    </Link>
  );
}

function EtatLien({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <>
      {children}
      {pending && <Rouet />}
    </>
  );
}

/** Squelettes — la forme de la page arrive avant ses données. */
export function SqueletteLigne({ largeur = "100%", hauteur = 14 }: { largeur?: number | string; hauteur?: number }) {
  return <span className="squelette" style={{ display: "block", width: largeur, height: hauteur }} />;
}

export function SqueletteCarte({ lignes = 3, titre = true }: { lignes?: number; titre?: boolean }) {
  return (
    <div className="carte pile" style={{ gap: 12 }} aria-hidden>
      {titre && <SqueletteLigne largeur="42%" hauteur={18} />}
      {Array.from({ length: lignes }, (_, i) => <SqueletteLigne key={i} largeur={i === lignes - 1 ? "64%" : "100%"} />)}
    </div>
  );
}

/** Squelette d'une page entière : en-tête, puis N cartes. Ce que rend chaque `loading.tsx`. */
export function SquelettePage({ cartes = 2, lignes = 4 }: { cartes?: number; lignes?: number }) {
  return (
    <div className="pile" aria-busy="true" aria-label="Chargement de la page">
      <div className="pile" style={{ gap: 10 }}>
        <SqueletteLigne largeur={120} hauteur={12} />
        <SqueletteLigne largeur="38%" hauteur={30} />
      </div>
      {Array.from({ length: cartes }, (_, i) => <SqueletteCarte key={i} lignes={lignes} />)}
    </div>
  );
}
