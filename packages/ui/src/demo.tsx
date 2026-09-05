"use client";

import { FlaskConical, X } from "lucide-react";
import { useState } from "react";

/** Bandeau « données de démonstration » — permanent quand la source est fictive.
 *  En mode PRÉSENTATION il n'est PAS refermable : une capture ne doit jamais pouvoir
 *  passer pour du réel. En usage normal, il se referme (mémorisé par appareil). */
export function BandeauDemo({ presentation = false, detail }: { presentation?: boolean; detail?: string }) {
  const [ferme, setFerme] = useState(() => {
    if (presentation) return false;
    try { return localStorage.getItem("ville-demo-bandeau") === "ferme"; } catch { return false; }
  });
  if (ferme) return null;
  const fermer = () => { try { localStorage.setItem("ville-demo-bandeau", "ferme"); } catch { /* stockage indisponible */ } setFerme(true); };
  return (
    <div className="bandeau-demo" role="note">
      <FlaskConical size={15} aria-hidden />
      <span><strong>Démonstration</strong> — familles, réservations et dossiers fictifs. {detail ?? "Proposition indépendante, sans lien officiel avec la commune."}</span>
      {!presentation && <button type="button" className="bandeau-demo-fermer" onClick={fermer} aria-label="Masquer ce bandeau"><X size={14} /></button>}
    </div>
  );
}
