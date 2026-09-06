"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Copier une commande ou une URL sans la resélectionner à la main. Le retour est
 *  IMMÉDIAT et borné dans le temps ; si le presse-papier est refusé (contexte non
 *  sécurisé, permission), on le dit au lieu de faire semblant d'avoir réussi. */
export function BoutonCopier({ valeur, libelle = "Copier", petit = true }: { valeur: string; libelle?: string; petit?: boolean }) {
  const [etat, setEtat] = useState<"repos" | "copie" | "refus">("repos");
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(valeur);
      setEtat("copie");
    } catch {
      setEtat("refus");
    }
    setTimeout(() => setEtat("repos"), 2200);
  };
  return (
    <button type="button" className={`bouton-copier${petit ? " bouton-copier-sm" : ""}`} onClick={copier}
      aria-label={etat === "copie" ? "Copié" : `${libelle} : ${valeur}`} title={etat === "refus" ? "Copie refusée par le navigateur" : libelle}>
      {etat === "copie" ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      <span>{etat === "copie" ? "Copié" : etat === "refus" ? "Refusé" : libelle}</span>
    </button>
  );
}
