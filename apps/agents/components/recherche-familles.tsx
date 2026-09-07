"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Rouet } from "@ville/ui";

/** Recherche à la frappe, mais SANS bombarder le serveur : on attend 250 ms de silence.
 *  Le texte reste dans l'URL — un agent peut envoyer sa recherche à un collègue. */
export function RechercheFamilles({ valeur }: { valeur: string }) {
  const router = useRouter();
  const [texte, setTexte] = useState(valeur);
  const [enAttente, demarrer] = useTransition();
  const champ = useRef<HTMLInputElement>(null);
  // Un agent enchaîne les dossiers au téléphone : « / » met le curseur dans la recherche,
  // « Échap » l'efface, « Entrée » ouvre le premier résultat. Sans toucher la souris.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      const dansUnChamp = cible instanceof HTMLInputElement || cible instanceof HTMLTextAreaElement || cible instanceof HTMLSelectElement;
      if (e.key === "/" && !dansUnChamp) { e.preventDefault(); champ.current?.focus(); champ.current?.select(); return; }
      if (e.key === "Escape" && cible === champ.current) { setTexte(""); champ.current?.blur(); return; }
      if (e.key === "Enter" && cible === champ.current) {
        const premier = document.querySelector<HTMLAnchorElement>('.file-ligne a[href^="/familles/"]');
        if (premier) { e.preventDefault(); premier.click(); }
      }
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, []);
  useEffect(() => {
    if (texte === valeur) return;
    const t = setTimeout(() => demarrer(() => router.replace(texte ? `/familles?q=${encodeURIComponent(texte)}` : "/familles")), 250);
    return () => clearTimeout(t);
  }, [texte, valeur, router]);
  return (
    <div className="recherche">
      <Search size={16} aria-hidden />
      <input ref={champ} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Nom de famille, prénom d'un enfant, école, e-mail…"
        aria-label="Rechercher un dossier" autoComplete="off" type="search" />
      <kbd className="touche" aria-hidden>/</kbd>
      {enAttente && <Rouet />}
      {texte && !enAttente && (
        <button type="button" className="bouton-icone bouton-icone-sm" onClick={() => setTexte("")} aria-label="Effacer la recherche"><X size={14} /></button>
      )}
    </div>
  );
}
