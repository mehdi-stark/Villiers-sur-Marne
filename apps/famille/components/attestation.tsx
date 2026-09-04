"use client";

import { FileDown } from "lucide-react";
import { useState, useTransition } from "react";
import { genererAttestation } from "@/app/actions";

export function BoutonAttestation({ factureId }: { factureId: string }) {
  const [enAttente, demarrer] = useTransition();
  const [lien, setLien] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const generer = () => demarrer(async () => { const r = await genererAttestation(factureId); if (r.ok) setLien(`/attestations/${r.id}`); else setErreur(r.message); });
  if (lien) return <a className="bouton bouton-pleine" href={lien} target="_blank" rel="noopener"><FileDown size={16} aria-hidden /> Ouvrir l'attestation (PDF)</a>;
  return (
    <>
      <button type="button" className="bouton bouton-pleine" disabled={enAttente} onClick={generer} aria-busy={enAttente}><FileDown size={16} aria-hidden /> {enAttente ? "Génération…" : "Attestation de paiement"}</button>
      {erreur && <p className="mini" role="alert" style={{ color: "var(--danger)" }}>{erreur}</p>}
    </>
  );
}
