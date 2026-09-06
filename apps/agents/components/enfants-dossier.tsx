"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { Rouet } from "@ville/ui";
import { detacher, rattacher } from "@/app/actions";

const CLASSES = ["TPS", "PS", "MS", "GS", "CP", "CE1", "CE2", "CM1", "CM2"];

export function LigneEnfant({ id, familleId, prenom, detail, rattache }: { id: string; familleId: string; prenom: string; detail: string; rattache: boolean }) {
  const [enAttente, demarrer] = useTransition();
  const [confirme, setConfirme] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="file-ligne">
      <div style={{ minWidth: 0 }}>
        <strong>{prenom}</strong>
        <div className="petit t-2">{detail}</div>
        {msg && <div className="mini t-3">{msg}</div>}
      </div>
      <div className="rangee" style={{ justifyContent: "flex-end", gap: 6 }}>
        {!rattache ? (
          <span className="badge" title="Fourni par la source de données de la ville — se corrige à la source, pas ici.">source ville</span>
        ) : confirme ? (
          <>
            <button className="bouton bouton-sm" data-variant="danger" data-charge={enAttente || undefined} disabled={enAttente}
              onClick={() => demarrer(async () => { const r = await detacher({ id, familleId }); setMsg(r.message); setConfirme(false); })}>
              Confirmer le détachement{enAttente && <Rouet />}
            </button>
            <button className="bouton bouton-sm" data-variant="discret" disabled={enAttente} onClick={() => setConfirme(false)}>Annuler</button>
          </>
        ) : (
          <button className="bouton bouton-sm" data-variant="discret" onClick={() => setConfirme(true)} aria-label={`Détacher ${prenom} du dossier`}>
            <UserMinus size={14} aria-hidden /> Détacher
          </button>
        )}
      </div>
    </div>
  );
}

/** Le formulaire d'un agent au téléphone : peu de champs, des listes plutôt que du texte
 *  libre (une école mal orthographiée casse la facturation), un refus qui dit pourquoi. */
export function FormulaireEnfant({ familleId, ecoles }: { familleId: string; ecoles: string[] }) {
  const [enAttente, demarrer] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null);
  const [prenom, setPrenom] = useState("");
  const [naissance, setNaissance] = useState("");
  const [ecole, setEcole] = useState(ecoles[0] ?? "");
  const [classe, setClasse] = useState("CP");
  const complet = prenom.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(naissance);
  return (
    <form className="pile" onSubmit={(e) => {
      e.preventDefault();
      demarrer(async () => {
        const r = await rattacher({ familleId, prenom, naissance, ecole, classe });
        setMsg({ ok: r.ok, texte: r.message });
        if (r.ok) { setPrenom(""); setNaissance(""); }
      });
    }}>
      <div className="grille-champs">
        <label className="champ"><span>Prénom</span>
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Lina" autoComplete="off" required />
        </label>
        <label className="champ"><span>Date de naissance</span>
          <input type="date" value={naissance} onChange={(e) => setNaissance(e.target.value)} required />
        </label>
        <label className="champ"><span>École</span>
          <select value={ecole} onChange={(e) => setEcole(e.target.value)}>{ecoles.map((n) => <option key={n}>{n}</option>)}</select>
        </label>
        <label className="champ"><span>Classe</span>
          <select value={classe} onChange={(e) => setClasse(e.target.value)}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
      </div>
      <button type="submit" className="bouton" data-variant="primaire" data-charge={enAttente || undefined} disabled={!complet || enAttente} style={{ justifySelf: "start" }}>
        <UserPlus size={15} aria-hidden /> Rattacher au dossier{enAttente && <Rouet />}
      </button>
      {msg && <p className="petit" role="status" style={{ color: msg.ok ? "var(--ok)" : "var(--danger)" }}>{msg.texte}</p>}
    </form>
  );
}
