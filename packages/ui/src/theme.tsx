"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export type Theme = "clair" | "sombre" | "systeme";
const CLE = "ville-theme";

/** Script INLINE, exécuté avant le premier rendu : sans lui, un thème sombre choisi
 *  provoque un flash blanc à chaque chargement. Injecté par le layout. */
export const scriptTheme = `(function(){try{var t=localStorage.getItem("${CLE}");if(t==="sombre")document.documentElement.dataset.theme="dark";else if(t==="clair")document.documentElement.dataset.theme="light";}catch(e){}})();`;

export function lireTheme(): Theme {
  try { return (localStorage.getItem(CLE) as Theme) ?? "systeme"; } catch { return "systeme"; }
}

export function appliquerTheme(t: Theme) {
  const el = document.documentElement;
  if (t === "sombre") el.dataset.theme = "dark";
  else if (t === "clair") el.dataset.theme = "light";
  else delete el.dataset.theme;
  try { t === "systeme" ? localStorage.removeItem(CLE) : localStorage.setItem(CLE, t); } catch { /* stockage indisponible */ }
}

const CHOIX: { valeur: Theme; libelle: string; Icone: typeof Sun }[] = [
  { valeur: "clair", libelle: "Clair", Icone: Sun },
  { valeur: "sombre", libelle: "Sombre", Icone: Moon },
  { valeur: "systeme", libelle: "Système", Icone: Monitor },
];

export function BasculeTheme() {
  const [theme, setTheme] = useState<Theme>("systeme");
  useEffect(() => { setTheme(lireTheme()); }, []);
  const choisir = (t: Theme) => { setTheme(t); appliquerTheme(t); };
  return (
    <div className="themes" role="group" aria-label="Thème de l'application">
      {CHOIX.map(({ valeur, libelle, Icone }) => (
        <button key={valeur} type="button" className="theme-choix" data-choisi={theme === valeur || undefined} onClick={() => choisir(valeur)} aria-pressed={theme === valeur}>
          <Icone size={16} aria-hidden />
          {libelle}
        </button>
      ))}
    </div>
  );
}
