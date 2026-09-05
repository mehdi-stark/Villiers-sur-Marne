"use client";

import { Check, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Rouet } from "@ville/ui";
import { traiterDemarche } from "@/app/demarches/actions";

/** Valider en un tap ; refuser EXIGE un motif — la famille doit savoir quoi corriger. */
export function TraiterDemarche({ id, etat }: { id: string; etat: string }) {
  const [enAttente, demarrer] = useTransition();
  const [refus, setRefus] = useState(false);
  const [motif, setMotif] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const aller = (vers: "en_cours" | "validee" | "refusee") => { setEnCours(vers); demarrer(async () => { const r = await traiterDemarche({ id, vers, motif }); setEnCours(null); setMsg(r.message); if (r.ok) setRefus(false); }); };
  return (
    <div className="pile" aria-busy={enAttente}>
      <div className="rangee">
        {etat === "deposee" && <button className="bouton bouton-sm" data-charge={enCours === "en_cours" || undefined} disabled={enAttente} onClick={() => aller("en_cours")}>Prendre en charge{enCours === "en_cours" && <Rouet />}</button>}
        <button className="bouton bouton-sm" data-variant="primaire" data-charge={enCours === "validee" || undefined} disabled={enAttente} onClick={() => aller("validee")}>{enCours === "validee" ? <Rouet /> : <Check size={14} aria-hidden />} Valider</button>
        <button className="bouton bouton-sm" data-variant="danger" disabled={enAttente} onClick={() => setRefus((v) => !v)}><X size={14} aria-hidden /> Demander une correction</button>
      </div>
      {refus && (
        <div className="pile">
          <textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ce que la famille doit corriger : « le justificatif de domicile date de plus de 3 mois »…" aria-label="Motif" />
          <button className="bouton bouton-sm" data-variant="danger" data-charge={enCours === "refusee" || undefined} disabled={enAttente || motif.trim().length < 5} onClick={() => aller("refusee")}>Renvoyer à la famille avec ce motif{enCours === "refusee" && <Rouet />}</button>
        </div>
      )}
      {msg && <p className="petit" role="status">{msg}</p>}
    </div>
  );
}
