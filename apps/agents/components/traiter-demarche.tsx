"use client";

import { Check, X } from "lucide-react";
import { useState, useTransition } from "react";
import { traiterDemarche } from "@/app/demarches/actions";

/** Valider en un tap ; refuser EXIGE un motif — la famille doit savoir quoi corriger. */
export function TraiterDemarche({ id, etat }: { id: string; etat: string }) {
  const [enAttente, demarrer] = useTransition();
  const [refus, setRefus] = useState(false);
  const [motif, setMotif] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const aller = (vers: "en_cours" | "validee" | "refusee") => demarrer(async () => { const r = await traiterDemarche({ id, vers, motif }); setMsg(r.message); if (r.ok) setRefus(false); });
  return (
    <div className="pile" aria-busy={enAttente}>
      <div className="rangee">
        {etat === "deposee" && <button className="bouton bouton-sm" disabled={enAttente} onClick={() => aller("en_cours")}>Prendre en charge</button>}
        <button className="bouton bouton-sm" data-variant="primaire" disabled={enAttente} onClick={() => aller("validee")}><Check size={14} aria-hidden /> Valider</button>
        <button className="bouton bouton-sm" data-variant="danger" disabled={enAttente} onClick={() => setRefus((v) => !v)}><X size={14} aria-hidden /> Demander une correction</button>
      </div>
      {refus && (
        <div className="pile">
          <textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ce que la famille doit corriger : « le justificatif de domicile date de plus de 3 mois »…" aria-label="Motif" />
          <button className="bouton bouton-sm" data-variant="danger" disabled={enAttente || motif.trim().length < 5} onClick={() => aller("refusee")}>Renvoyer à la famille avec ce motif</button>
        </div>
      )}
      {msg && <p className="petit" role="status">{msg}</p>}
    </div>
  );
}
