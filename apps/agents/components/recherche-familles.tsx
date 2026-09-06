"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Rouet } from "@ville/ui";

/** Recherche à la frappe, mais SANS bombarder le serveur : on attend 250 ms de silence.
 *  Le texte reste dans l'URL — un agent peut envoyer sa recherche à un collègue. */
export function RechercheFamilles({ valeur }: { valeur: string }) {
  const router = useRouter();
  const [texte, setTexte] = useState(valeur);
  const [enAttente, demarrer] = useTransition();
  useEffect(() => {
    if (texte === valeur) return;
    const t = setTimeout(() => demarrer(() => router.replace(texte ? `/familles?q=${encodeURIComponent(texte)}` : "/familles")), 250);
    return () => clearTimeout(t);
  }, [texte, valeur, router]);
  return (
    <div className="recherche">
      <Search size={16} aria-hidden />
      <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Nom de famille, prénom d'un enfant, école, e-mail…"
        aria-label="Rechercher un dossier" autoComplete="off" type="search" />
      {enAttente && <Rouet />}
      {texte && !enAttente && (
        <button type="button" className="bouton-icone bouton-icone-sm" onClick={() => setTexte("")} aria-label="Effacer la recherche"><X size={14} /></button>
      )}
    </div>
  );
}
