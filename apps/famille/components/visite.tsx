"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const ETAPES = [
  { titre: "Réserver en un tap", texte: "Chaque service a sa ligne : pause méridienne, accueil de loisirs. Un tap sur un jour réserve ou annule — tant que le délai de prévenance court." },
  { titre: "Payer et justifier", texte: "La facture est calculée depuis les pointages réels. Paiement PayFIP, attestation en PDF pour l'employeur ou les impôts." },
  { titre: "Déposer une pièce", texte: "Inscription, quotient familial : les pièces se photographient depuis le téléphone, l'agent valide ou demande une correction motivée." },
];
const CLE = "villiers-visite";

/** Visite guidée : trois bulles, une fois, refusable — pour l'élu qui ouvre le lien sans compte. */
export function VisiteGuidee() {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => {
    try { if (localStorage.getItem(CLE) !== "vue") setI(0); } catch { setI(0); }
  }, []);
  if (i === null) return null;
  const fermer = () => { try { localStorage.setItem(CLE, "vue"); } catch { /* stockage indisponible */ } setI(null); };
  const e = ETAPES[i]!;
  return (
    <div className="visite" role="dialog" aria-label="Visite guidée">
      <div className="visite-tete">
        <span className="visite-pas">{i + 1} / {ETAPES.length}</span>
        <button type="button" className="bouton-icone" onClick={fermer} aria-label="Fermer la visite" style={{ width: 30, height: 30 }}><X size={15} /></button>
      </div>
      <strong>{e.titre}</strong>
      <p className="petit t-2">{e.texte}</p>
      <div className="rangee" style={{ justifyContent: "space-between" }}>
        <div className="visite-points" aria-hidden>{ETAPES.map((_, k) => <span key={k} data-actif={k === i || undefined} />)}</div>
        <button type="button" className="bouton bouton-sm" data-variant="primaire" onClick={() => (i + 1 < ETAPES.length ? setI(i + 1) : fermer())}>
          {i + 1 < ETAPES.length ? "Suivant" : "Commencer"}
        </button>
      </div>
    </div>
  );
}
