"use client";

import { useEffect, useRef, useState } from "react";

/* L'ÉCRAN DE CONNEXION, UNE SEULE FOIS pour les trois applications.
 * Deux corrections du 07/09/2026 :
 *   1. il DIT ce qu'il fait. Une adresse inconnue menait au même écran de saisie de code
 *      qu'une adresse valide — correct pour la sécurité (aucun oracle), désarçonnant pour
 *      l'utilisateur. La phrase rend le silence intentionnel : « si cette adresse est
 *      rattachée à un dossier, un code vient d'y être envoyé ».
 *   2. le renvoi ATTEND. Le quota est de 5 demandes par heure ; un parent qui ne reçoit
 *      rien cliquait cinq fois en dix secondes et se bloquait lui-même. Compte à rebours
 *      de 60 s, et le nombre de demandes restantes annoncé par le serveur. */

const ATTENTE_RENVOI_S = 60;

export type TexteConnexion = {
  titre: string;
  accroche: string;
  initiale: string;
  /** Ce qu'on répond quand le code est parti — sans jamais confirmer que le compte existe. */
  apresEnvoi: string;
  aide: string;
};

export function FormulaireConnexion({ textes, suite, avant, apres }: { textes: TexteConnexion; suite: string; avant?: React.ReactNode; apres?: React.ReactNode }) {
  const [email, setEmail] = useState("");
  const [etape, setEtape] = useState<"email" | "code">("email");
  const [msg, setMsg] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [reste, setReste] = useState<number | null>(null);
  const [attente, setAttente] = useState(0);
  const minuteur = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (minuteur.current) clearInterval(minuteur.current); }, []);

  const lancerAttente = () => {
    setAttente(ATTENTE_RENVOI_S);
    if (minuteur.current) clearInterval(minuteur.current);
    minuteur.current = setInterval(() => {
      setAttente((v) => {
        if (v <= 1 && minuteur.current) clearInterval(minuteur.current);
        return Math.max(0, v - 1);
      });
    }, 1000);
  };

  const envoyer = async () => {
    setOccupe(true);
    setMsg(null);
    try {
      const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "envoyer", email }) });
      const corps = (await r.json().catch(() => ({}))) as { reste?: number };
      setReste(typeof corps.reste === "number" ? corps.reste : null);
    } finally {
      setOccupe(false);
    }
    setEtape("code");
    lancerAttente();
  };

  const valider = async (code: string) => {
    setOccupe(true);
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "valider", email, code }) });
    setOccupe(false);
    if (r.ok) window.location.href = suite.startsWith("/") ? suite : "/";
    else if (r.status === 429) setMsg("Trop d'essais depuis cet appareil. Patientez quelques minutes.");
    else setMsg("Code refusé — vérifiez le code, ou demandez-en un nouveau.");
  };

  return (
    <div className="connexion" style={{ minHeight: "calc(100dvh - 140px)", display: "grid", placeItems: "center" }}>
      <form className="carte" style={{ width: "min(400px, 100%)", display: "grid", gap: 14, textAlign: "center", padding: 24 }}
        onSubmit={(e) => { e.preventDefault(); if (etape === "email") envoyer(); }}>
        <span className="marque-logo" style={{ width: 56, height: 56, fontSize: 26, margin: "0 auto", borderRadius: 18 }} aria-hidden>{textes.initiale}</span>
        <h1>{textes.titre}</h1>
        <p className="petit t-2">{textes.accroche}</p>
        {etape === "email" && avant}
        {etape === "email" ? (
          <>
            <input type="email" inputMode="email" autoComplete="email" placeholder="ton e-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            <button type="submit" className="bouton bouton-lg bouton-pleine" data-variant="primaire" disabled={!email.includes("@") || occupe}>
              {occupe ? "Envoi…" : "Recevoir un code"}
            </button>
            <p className="mini t-3">{textes.aide}</p>
            {apres}
          </>
        ) : (
          <>
            {/* On ne confirme JAMAIS que le compte existe : c'est la même phrase pour tous. */}
            <p className="petit t-2">{textes.apresEnvoi.replace("{email}", email)}</p>
            <input className="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="······"
              aria-label="Code à 6 chiffres" autoFocus disabled={occupe}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length === 6) valider(v); }} />
            <div className="rangee" style={{ justifyContent: "center" }}>
              <button type="button" className="bouton bouton-sm" data-variant="discret" onClick={envoyer} disabled={occupe || attente > 0 || reste === 0}>
                {attente > 0 ? `Renvoyer dans ${attente} s` : reste === 0 ? "Limite atteinte" : "Renvoyer un code"}
              </button>
              <button type="button" className="bouton bouton-sm" data-variant="discret" onClick={() => { setEtape("email"); setMsg(null); setReste(null); }}>Changer d&apos;adresse</button>
            </div>
            {reste !== null && (
              <p className="mini t-3" role="status">
                {reste === 0
                  ? "Vous avez atteint la limite de 5 demandes par heure. Réessayez plus tard, ou appelez l'accueil."
                  : `Encore ${reste} demande${reste > 1 ? "s" : ""} possible${reste > 1 ? "s" : ""} dans l'heure.`}
              </p>
            )}
          </>
        )}
        {msg && <p className="petit t-2" role="alert" style={{ color: "var(--danger)" }}>{msg}</p>}
      </form>
    </div>
  );
}
