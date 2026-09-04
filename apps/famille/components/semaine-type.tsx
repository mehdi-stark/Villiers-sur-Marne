"use client";

import { Repeat } from "lucide-react";
import { useState, useTransition } from "react";
import { appliquerSemaineType } from "@/app/actions";

const JOURS = [[1, "Lun."], [2, "Mar."], [4, "Jeu."], [5, "Ven."]] as const;

/** La semaine type : les repas, les jours choisis, sur N semaines — un tap, un bilan chiffré. */
export function SemaineType() {
  const [jours, setJours] = useState<number[]>([1, 2, 4, 5]);
  const [semaines, setSemaines] = useState(4);
  const [bilan, setBilan] = useState<string | null>(null);
  const [enAttente, demarrer] = useTransition();
  const basculer = (j: number) => setJours((l) => (l.includes(j) ? l.filter((x) => x !== j) : [...l, j]));
  const appliquer = () => demarrer(async () => { const r = await appliquerSemaineType({ semaines, jours }); setBilan(r.message); });
  return (
    <details className="carte">
      <summary><Repeat size={16} aria-hidden /> Semaine type : réserver les repas d'un coup</summary>
      <div className="pile" style={{ marginTop: 12 }}>
        <div className="rangee" role="group" aria-label="Jours">
          {JOURS.map(([j, l]) => <button key={j} type="button" className="bouton bouton-sm" data-choisi={jours.includes(j) || undefined} onClick={() => basculer(j)}>{l}</button>)}
        </div>
        <div className="rangee" role="group" aria-label="Durée">
          {[2, 4, 8].map((n) => <button key={n} type="button" className="bouton bouton-sm" data-choisi={semaines === n || undefined} onClick={() => setSemaines(n)}>{n} semaines</button>)}
        </div>
        <button type="button" className="bouton bouton-lg bouton-pleine" data-variant="primaire" disabled={enAttente || jours.length === 0} onClick={appliquer}>{enAttente ? "Réservation…" : "Appliquer à tous mes enfants"}</button>
        {bilan && <p className="petit" role="status">{bilan}</p>}
        <p className="mini t-3">Chaque jour passe par le même verdict de délai : ce qui est hors délai est compté comme refusé, pas réservé en douce.</p>
      </div>
    </details>
  );
}
