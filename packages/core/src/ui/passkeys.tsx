"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";

// Composants partagés par les trois apps : chaque app expose /api/passkey avec la même grammaire.
export function BoutonFaceId({ suite = "/" }: { suite?: string }) {
  const [dispo, setDispo] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setDispo(!!window.PublicKeyCredential); }, []);
  if (!dispo) return null;
  const connecter = async () => {
    try {
      const r0 = await fetch("/api/passkey?etape=options-connexion");
      if (!r0.ok) { setMsg("Aucun appareil enregistré ici — utilise le code une première fois."); return; }
      const reponse = await startAuthentication({ optionsJSON: await r0.json() });
      const r = await fetch("/api/passkey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ etape: "connecter", reponse }) });
      if (r.ok) window.location.href = suite; else setMsg("Face ID refusé — utilise le code.");
    } catch { setMsg("Face ID annulé — utilise le code."); }
  };
  return (
    <>
      <button type="button" className="bouton" data-variant="primaire" onClick={connecter}>Se connecter avec Face ID / Touch ID</button>
      {msg && <p className="tiny" role="status">{msg}</p>}
      <p className="tiny">— ou par code e-mail —</p>
    </>
  );
}

/** Proposé juste APRÈS un code réussi (le moment où l'intention est là) ; refusable par appareil. */
export function ActiverFaceId({ cle }: { cle: string }) {
  const [etat, setEtat] = useState<"cache" | "off" | "on">("cache");
  useEffect(() => {
    if (!window.PublicKeyCredential) return;
    try { setEtat(localStorage.getItem(cle) === "1" ? "on" : localStorage.getItem(`${cle}-non`) === "1" ? "cache" : "off"); } catch { setEtat("off"); }
  }, [cle]);
  if (etat !== "off") return null;
  const activer = async () => {
    try {
      const options = await (await fetch("/api/passkey?etape=options-enregistrement")).json();
      const reponse = await startRegistration({ optionsJSON: options });
      const r = await fetch("/api/passkey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ etape: "enregistrer", reponse }) });
      if (r.ok) { try { localStorage.setItem(cle, "1"); } catch { /* plein */ } setEtat("on"); }
    } catch { /* annulé par l'utilisateur */ }
  };
  const refuser = () => { try { localStorage.setItem(`${cle}-non`, "1"); } catch { /* plein */ } setEtat("cache"); };
  return (
    <div className="bandeau" data-tone="accent" role="status">
      <div style={{ flex: 1 }}>
        <strong>Activer Face ID / Touch ID sur cet appareil ?</strong>
        <div className="tiny">Plus de code à taper ici ; le code par e-mail reste toujours possible. Révocable depuis « Appareils ».</div>
        <div className="rangee" style={{ marginTop: 8 }}>
          <button type="button" className="bouton bouton-sm" data-variant="primaire" onClick={activer}>Activer</button>
          <button type="button" className="bouton bouton-sm" data-variant="discret" onClick={refuser}>Pas sur cet appareil</button>
        </div>
      </div>
    </div>
  );
}

export type AppareilClient = { id: string; appareil: string | null; creeLe: string; dernierUsageLe: string | null };
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });

export function ListeAppareils({ appareils }: { appareils: AppareilClient[] }) {
  const [liste, setListe] = useState(appareils);
  const [erreur, setErreur] = useState<string | null>(null);
  const revoquer = async (id: string) => {
    const r = await fetch("/api/passkey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ etape: "revoquer", id }) });
    if (r.ok) setListe((l) => l.filter((a) => a.id !== id)); else setErreur("La révocation n'a pas été enregistrée — réessaie.");
  };
  if (!liste.length) return <div className="carte vide"><strong>Aucun appareil de confiance</strong><span>Après un code réussi, l'app propose d'activer Face ID / Touch ID sur l'appareil courant.</span></div>;
  return (
    <div className="file">
      {liste.map((a) => (
        <div key={a.id} className="file-ligne">
          <div><strong>{a.appareil ?? "Appareil"}</strong><div className="tiny">Ajouté le {fmt.format(new Date(a.creeLe))} · dernier usage : {a.dernierUsageLe ? fmt.format(new Date(a.dernierUsageLe)) : "jamais"} (Paris)</div></div>
          <button type="button" className="bouton bouton-sm" onClick={() => revoquer(a.id)}>Révoquer</button>
        </div>
      ))}
      {erreur && <p className="tiny" role="alert" style={{ color: "var(--danger)" }}>{erreur}</p>}
    </div>
  );
}
