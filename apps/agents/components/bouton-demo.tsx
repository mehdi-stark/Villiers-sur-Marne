"use client";

import { RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { reinitialiserDemo } from "@/app/actions";

export function BoutonDemo() {
  const [enAttente, demarrer] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="pile" style={{ gap: 8 }}>
      <button type="button" className="bouton" disabled={enAttente} onClick={() => demarrer(async () => setMessage((await reinitialiserDemo()).message))}>
        <RotateCcw size={15} aria-hidden /> {enAttente ? "Réinitialisation…" : "Réinitialiser la démonstration"}
      </button>
      {message && <p className="petit" role="status">{message}</p>}
    </div>
  );
}
