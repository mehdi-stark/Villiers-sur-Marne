"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BoutonFaceId } from "@ville/core/ui/passkeys";

function Formulaire() {
  const params = useSearchParams();
  const suite = params.get("suite") ?? "/";
  const [email, setEmail] = useState("");
  const [etape, setEtape] = useState<"email" | "code">("email");
  const [msg, setMsg] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const envoyer = async () => {
    setOccupe(true);
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "envoyer", email }) });
    setOccupe(false);
    setEtape("code");
    setMsg(null);
  };
  const valider = async (code: string) => {
    setOccupe(true);
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "valider", email, code }) });
    setOccupe(false);
    if (r.ok) window.location.href = suite.startsWith("/") ? suite : "/";
    else setMsg("Code refusé — vérifie le code, ou demande-en un nouveau.");
  };

  return (
    <div className="connexion" style={{ minHeight: "calc(100dvh - 140px)", display: "grid", placeItems: "center" }}>
      <form
        className="carte"
        style={{ width: "min(400px, 100%)", display: "grid", gap: 14, textAlign: "center", padding: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (etape === "email") envoyer();
        }}
      >
        <span className="marque-logo" style={{ width: 56, height: 56, fontSize: 26, margin: "0 auto", borderRadius: 18 }} aria-hidden>V</span>
        <h1>Portail Famille</h1>
        <p className="petit t-2">Réserver, payer, suivre — pour vos enfants, depuis votre téléphone.</p>
        {etape === "email" && <BoutonFaceId suite={suite.startsWith("/") ? suite : "/"} />}
        {etape === "email" ? (
          <>
            <input type="email" inputMode="email" autoComplete="email" placeholder="ton e-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            <button type="submit" className="bouton bouton-lg bouton-pleine" data-variant="primaire" disabled={!email.includes("@") || occupe}>
              {occupe ? "Envoi…" : "Recevoir un code"}
            </button>
            <p className="mini t-3">Un code à 6 chiffres, valable 10 minutes. L'adresse doit être celle de votre dossier famille.</p>
            <a className="mini" href="/decouvrir">Découvrir le portail</a>
          </>
        ) : (
          <>
            <p className="petit t-2">Code envoyé à <strong>{email}</strong>. Il expire dans 10 minutes.</p>
            <input
              className="code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="······"
              aria-label="Code à 6 chiffres"
              autoFocus
              disabled={occupe}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                if (v.length === 6) valider(v);
              }}
            />
            <div className="rangee" style={{ justifyContent: "center" }}>
              <button type="button" className="bouton bouton-sm" data-variant="discret" onClick={envoyer} disabled={occupe}>Renvoyer un code</button>
              <button type="button" className="bouton bouton-sm" data-variant="discret" onClick={() => { setEtape("email"); setMsg(null); }}>Changer d'adresse</button>
            </div>
          </>
        )}
        {msg && <p className="petit t-2" role="alert" style={{ color: "var(--danger)" }}>{msg}</p>}
      </form>
    </div>
  );
}

export default function Connexion() {
  return (
    <Suspense>
      <Formulaire />
    </Suspense>
  );
}
