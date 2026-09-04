"use client";

import { Check, Clock } from "lucide-react";
import { useState, useTransition } from "react";
import { prevenirAgent, trancher } from "@/app/pilotage/actions";

export type PriseClient = { choix: string; note: string | null; acteur: string; trancheLe: string; reporteLe: string | null };

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });

/** Une décision : ses options en boutons, une note facultative, l'état pris.
 *  Re-trancher est toujours possible — l'historique complet reste en base. */
export function Decision(p: {
  sujet: "cadrage" | "design" | "backlog" | "marche";
  cle: string;
  numero?: number;
  titre: string;
  texte?: string;
  meta?: React.ReactNode;
  options: readonly string[];
  recommandation?: string | null;
  prise: PriseClient | null;
}) {
  const [note, setNote] = useState("");
  const [enAttente, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvrirNote, setOuvrirNote] = useState(false);
  const [prevenu, setPrevenu] = useState<string | null>(null);
  const prevenir = () => demarrer(async () => { const r = await prevenirAgent(); setPrevenu(r.message); });

  const choisir = (choix: string) => {
    setErreur(null);
    demarrer(async () => {
      try {
        await trancher({ sujet: p.sujet, cle: p.cle, libelle: p.titre, choix, note: note || undefined });
        setNote("");
        setOuvrirNote(false);
      } catch {
        setErreur("La décision n'a pas été enregistrée — réessaie.");
      }
    });
  };

  return (
    <article className="carte decision" data-etat={p.prise ? "tranchee" : "ouverte"} aria-busy={enAttente}>
      <div className="decision-tete">
        <span className="decision-num" aria-hidden>{p.prise ? <Check size={14} /> : (p.numero ?? "·")}</span>
        <div style={{ minWidth: 0 }}>
          <h3>{p.titre}</h3>
          {p.texte && <p className="muted" style={{ marginTop: 4 }}>{p.texte}</p>}
          {p.meta}
          {p.recommandation && (
            <p className="reco" style={{ marginTop: 6 }}>Recommandation : <strong>{p.recommandation}</strong></p>
          )}
        </div>
      </div>
      <div className="decision-options" role="group" aria-label={`Options pour « ${p.titre} »`}>
        {p.options.map((o) => (
          <button key={o} className="bouton" data-choisi={p.prise?.choix === o || undefined} data-variant={!p.prise && p.recommandation === o ? "primaire" : undefined} disabled={enAttente} onClick={() => choisir(o)}>
            {o}
          </button>
        ))}
      </div>
      {ouvrirNote ? (
        <div className="decision-note">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Condition, précision, contre-proposition — enregistrée avec le prochain choix." aria-label="Note" />
        </div>
      ) : (
        <button className="bouton bouton-sm" data-variant="discret" style={{ justifySelf: "start" }} onClick={() => setOuvrirNote(true)}>+ Ajouter une note</button>
      )}
      {erreur && <p className="muted" role="alert" style={{ color: "var(--danger)" }}>{erreur}</p>}
      {p.prise ? (
        <div className="decision-prise">
          <span className="badge" data-tone={p.prise.reporteLe ? "ok" : "accent"}>
            {p.prise.reporteLe ? <Check size={12} aria-hidden /> : <Clock size={12} aria-hidden />}
            {p.prise.reporteLe ? "Reportée dans le document" : "À reporter par l'agent"}
          </span>
          <span>{p.prise.choix} · {fmt.format(new Date(p.prise.trancheLe))} (Paris)</span>
          {p.prise.note && <span className="tiny" style={{ flexBasis: "100%", whiteSpace: "pre-line" }}>« {p.prise.note} »</span>}
          {!p.prise.reporteLe && (prevenu ? <span className="tiny" style={{ flexBasis: "100%" }}>{prevenu}</span> : <button className="bouton bouton-sm" data-variant="discret" disabled={enAttente} onClick={prevenir}>Prévenir l'agent maintenant</button>)}
        </div>
      ) : (
        <p className="tiny">Pas encore tranchée. Un tap suffit ; tu peux changer d'avis, l'historique est conservé.</p>
      )}
    </article>
  );
}
