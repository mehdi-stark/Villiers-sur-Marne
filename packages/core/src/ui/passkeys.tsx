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


/** Verrou au retour : sur un appareil à passkey, > 1 h hors de l'app → voile « verrouillé »,
 *  déverrouillage par Face ID (qui réémet la session) ; repli : le code par e-mail. */
export function VerrouBiometrique({ cle, seuilMs = 3600_000 }: { cle: string; seuilMs?: number }) {
  const [verrouille, setVerrouille] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let actif = false;
    try { actif = localStorage.getItem(cle) === "1"; } catch { /* stockage indisponible */ }
    if (!actif) return;
    const noter = () => { try { localStorage.setItem(`${cle}-depart`, String(Date.now())); } catch { /* plein */ } };
    try { const d = Number(localStorage.getItem(`${cle}-depart`) ?? 0); if (d && Date.now() - d > seuilMs) setVerrouille(true); } catch { /* rien */ }
    window.addEventListener("pagehide", noter);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") noter(); });
    return () => window.removeEventListener("pagehide", noter);
  }, [cle, seuilMs]);
  if (!verrouille) return null;
  const deverrouiller = async () => {
    try {
      const r0 = await fetch("/api/passkey?etape=options-connexion");
      const reponse = await startAuthentication({ optionsJSON: await r0.json() });
      const r = await fetch("/api/passkey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ etape: "connecter", reponse }) });
      if (r.ok) { try { localStorage.removeItem(`${cle}-depart`); } catch { /* rien */ } setVerrouille(false); window.location.reload(); } else setMsg("Face ID refusé.");
    } catch { setMsg("Face ID annulé."); }
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Verrouillé" style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", background: "color-mix(in srgb, var(--fond, #f4f5f9) 70%, transparent)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}>
      <div className="carte" style={{ width: "min(360px, 90vw)", display: "grid", gap: 12, textAlign: "center" }}>
        <strong>Verrouillé après une heure d'absence</strong>
        <p className="petit t-2">Déverrouille avec Face ID / Touch ID, ou reconnecte-toi par code.</p>
        <button type="button" className="bouton bouton-lg" data-variant="primaire" onClick={deverrouiller}>Déverrouiller</button>
        <a className="bouton" data-variant="discret" href="/connexion">Code par e-mail</a>
        {msg && <p className="mini" role="status">{msg}</p>}
      </div>
    </div>
  );
}
