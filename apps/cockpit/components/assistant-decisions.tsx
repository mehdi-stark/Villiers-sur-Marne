"use client";

import { ArrowRight, List } from "lucide-react";
import { useState } from "react";
import { Decision, type PriseClient } from "./decision";

export type DecisionClient = { sujet: "cadrage" | "design" | "marche" | "backlog"; cle: string; titre: string; texte?: string; options: readonly string[]; recommandation: string | null; bloque: string; groupe: string };

/** Une décision à la fois : progression, la carte, « Passer », « Voir la liste ». Moins de 8 ouvertes → la liste. */
export function AssistantDecisions({ ouvertes, dejaPrises, enfants }: { ouvertes: DecisionClient[]; dejaPrises: number; enfants: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [liste, setListe] = useState(ouvertes.length < 8);
  const [tranchees, setTranchees] = useState<Record<string, PriseClient>>({});
  if (liste || ouvertes.length === 0) return <>{ouvertes.length > 0 && <button className="bouton bouton-sm" data-variant="discret" onClick={() => setListe(false)} style={{ justifySelf: "start" }}>Une décision à la fois</button>}{enfants}</>;
  const restantes = ouvertes.filter((d) => !tranchees[d.cle]);
  const courante = restantes[index % Math.max(1, restantes.length)];
  if (!courante) return <div className="carte vide"><strong>Tout est tranché</strong><span className="petit">{dejaPrises + Object.keys(tranchees).length} décisions prises. L'agent les relit et les reporte.</span></div>;
  const pos = ouvertes.length - restantes.length + 1;
  return (
    <>
      <div className="pile" style={{ gap: 6 }}>
        <span className="salut">Décision {pos} sur {ouvertes.length} · {courante.groupe}</span>
        <div style={{ height: 6, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ width: `${Math.round(((pos - 1) / ouvertes.length) * 100)}%`, height: 6, background: "var(--accent)", transition: "width var(--d-3) var(--ease)" }} /></div>
      </div>
      <div className="pile">
        <span className="badge" data-tone="accent" style={{ justifySelf: "start" }}>Bloque {courante.bloque}</span>
        <DecisionSuivie cle={courante.cle} d={courante} onPrise={(p) => setTranchees((t) => ({ ...t, [courante.cle]: p }))} />
      </div>
      <div className="rangee" style={{ justifyContent: "space-between" }}>
        <button className="bouton bouton-sm" onClick={() => setIndex((i) => i + 1)}>Passer <ArrowRight size={14} aria-hidden /></button>
        <button className="bouton bouton-sm" data-variant="discret" onClick={() => setListe(true)}><List size={14} aria-hidden /> Voir la liste</button>
      </div>
    </>
  );
}

function DecisionSuivie({ cle, d, onPrise }: { cle: string; d: DecisionClient; onPrise: (p: PriseClient) => void }) {
  // Le composant Decision enregistre côté serveur ; on suit localement le choix pour avancer sans recharger.
  return (
    <div onClickCapture={(e) => { const b = (e.target as HTMLElement).closest("button"); if (b && d.options.includes(b.textContent?.trim() ?? "")) setTimeout(() => onPrise({ choix: b.textContent!.trim(), note: null, acteur: "", trancheLe: new Date().toISOString(), reporteLe: null }), 800); }}>
      <Decision key={cle} sujet={d.sujet} cle={d.cle} titre={d.titre} texte={d.texte} options={d.options} recommandation={d.recommandation} prise={null} />
    </div>
  );
}
