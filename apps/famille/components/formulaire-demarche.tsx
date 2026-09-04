"use client";

import { Check, Paperclip, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { envoyerDemarche } from "@/app/demarches/actions";
import { MIMES, PIECES, TAILLE_MAX, TYPES, type CodePiece, type TypeDemarche } from "@ville/core/demarches-definitions";

type Fichier = { code: CodePiece; nom: string; mime: string; contenuBase64: string; taille: number };

/** Démarche guidée : ce qu'on demande, pourquoi, une pièce à la fois — et le délai annoncé. */
export function FormulaireDemarche({ type }: { type: TypeDemarche }) {
  const def = TYPES[type];
  const router = useRouter();
  const [fichiers, setFichiers] = useState<Record<string, Fichier>>({});
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [enAttente, demarrer] = useTransition();

  const choisir = async (code: CodePiece, file: File | null) => {
    setErreur(null);
    if (!file) return;
    if (!MIMES.includes(file.type)) { setErreur(`Format refusé : photo (JPEG, PNG, HEIC) ou PDF. Reçu « ${file.type || "inconnu"} ».`); return; }
    if (file.size > TAILLE_MAX) { setErreur(`« ${file.name} » fait ${Math.round(file.size / 1024)} Ko, la limite est de 2 Mo. Reprenez la photo en qualité normale.`); return; }
    const contenuBase64 = await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onerror = () => rej(new Error("lecture")); fr.onload = () => res(String(fr.result).split(",")[1] ?? ""); fr.readAsDataURL(file); });
    setFichiers((f) => ({ ...f, [code]: { code, nom: file.name, mime: file.type, contenuBase64, taille: file.size } }));
  };

  const manquantes = def.pieces.filter((c) => !fichiers[c]);
  const envoyer = () => demarrer(async () => {
    const r = await envoyerDemarche({ type, message, pieces: Object.values(fichiers) });
    if (r.ok) { setOk(r.message); setTimeout(() => router.push("/demarches"), 1200); } else setErreur(r.message);
  });

  return (
    <div className="pile">
      <div className="carte pile">
        <h2>{def.nom}</h2>
        <p className="petit t-2">{def.explication}</p>
        <p className="mini t-3">{def.delai}</p>
      </div>
      {def.pieces.map((code) => {
        const f = fichiers[code];
        return (
          <div key={code} className="carte pile piece">
            <div className="rangee" style={{ justifyContent: "space-between" }}>
              <strong>{PIECES[code].nom}</strong>
              {f ? <span className="badge" data-tone="ok"><Check size={12} aria-hidden /> jointe</span> : <span className="badge">à joindre</span>}
            </div>
            <p className="mini t-2">{PIECES[code].aide}</p>
            <label className="bouton bouton-pleine" style={{ cursor: "pointer" }}>
              {f ? <><Paperclip size={15} aria-hidden /> {f.nom.slice(0, 28)} ({Math.round(f.taille / 1024)} Ko) — remplacer</> : <><Upload size={15} aria-hidden /> Photographier ou choisir un fichier</>}
              <input type="file" accept="image/*,application/pdf" capture="environment" style={{ display: "none" }} onChange={(e) => choisir(code, e.target.files?.[0] ?? null)} aria-label={PIECES[code].nom} />
            </label>
          </div>
        );
      })}
      <div className="carte pile">
        <label className="petit" htmlFor="msg">Précision (facultatif)</label>
        <textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Un changement d'école, une garde alternée, une date…" />
      </div>
      {erreur && <div className="bandeau" data-tone="danger" role="alert"><div>{erreur}</div></div>}
      {ok && <div className="bandeau" data-tone="ok" role="status"><div>{ok}</div></div>}
      <button type="button" className="bouton bouton-lg bouton-pleine" data-variant="primaire" disabled={manquantes.length > 0 || enAttente} onClick={envoyer}>
        {enAttente ? "Envoi…" : manquantes.length ? `Il manque ${manquantes.length} pièce${manquantes.length > 1 ? "s" : ""}` : "Envoyer ma démarche"}
      </button>
      {manquantes.length > 0 && <p className="mini t-3">À joindre : {manquantes.map((c) => PIECES[c].nom).join(", ")}.</p>}
    </div>
  );
}
