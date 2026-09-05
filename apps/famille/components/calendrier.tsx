"use client";

import { useState } from "react";
import { basculerCreneau } from "@/app/actions";
import type { EtatReservation } from "@ville/core/donnees/types";
import type { JourMois } from "@/lib/mois";

const LIBELLE: Record<string, string> = { reservee: "Réservé", presence: "Présent", absence: "Absent", libre: "Libre" };
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const fmtJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

/** Le mois d'un coup d'œil : une pastille par service et par jour ; le détail au tap,
 *  avec le verdict de délai — et la réservation depuis le même écran. */
export function Calendrier({ enfantId, prenom, jours, euros }: { enfantId: string; prenom: string; jours: JourMois[]; euros: Record<string, string> }) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const jour = jours.find((j) => j.date === ouvert) ?? null;
  const taper = async (activiteId: string, date: string, etat: string) => {
    setEnCours(true);
    const actuel: EtatReservation | null = etat === "libre" ? null : (etat as EtatReservation);
    const r = await basculerCreneau({ enfantId, activiteId, date, actuel });
    setMessage(r.message);
    setEnCours(false);
    setTimeout(() => setMessage(null), 4000);
  };
  return (
    <div className="calendrier">
      <div className="calendrier-entete" aria-hidden>{JOURS.map((j) => <span key={j}>{j}</span>)}</div>
      <div className="calendrier-grille">
        {jours.map((j) => (
          <button key={j.date} type="button" className="jour-mois" data-hors={!j.dansLeMois || undefined} data-aujourdhui={j.aujourdhui || undefined} data-weekend={j.weekend || undefined} data-ouvert={ouvert === j.date || undefined}
            onClick={() => setOuvert(ouvert === j.date ? null : j.date)}
            aria-label={`${fmtJour.format(new Date(`${j.date}T12:00:00Z`))} : ${j.services.length ? j.services.map((s) => `${s.nom} ${LIBELLE[s.etat]}`).join(", ") : "aucun service"}`}>
            <span className="jour-mois-num">{j.jour}</span>
            <span className="jour-mois-pastilles">
              {j.services.slice(0, 3).map((s) => <span key={s.activiteId} className="pastille" data-ton={s.ton} data-etat={s.etat} />)}
            </span>
          </button>
        ))}
      </div>
      {jour && (
        <div className="calendrier-detail" role="region" aria-live="polite">
          <strong>{fmtJour.format(new Date(`${jour.date}T12:00:00Z`))}</strong>
          {jour.services.length === 0 ? (
            <p className="petit t-2">Aucun service réservable ce jour pour {prenom}.</p>
          ) : (
            <div className="pile" style={{ gap: 8 }}>
              {jour.services.map((s) => (
                <div key={s.activiteId} className="detail-ligne">
                  <div style={{ minWidth: 0 }}>
                    <strong>{s.nom}</strong>{s.nomCourt && s.nomCourt !== s.nom && <span className="mini t-3"> · {s.nomCourt}</span>}
                    <div className="mini t-3">{euros[s.activiteId]} · {s.verdict}</div>
                  </div>
                  <button type="button" className="bouton bouton-sm" data-variant={s.etat === "libre" ? "primaire" : undefined} data-choisi={s.etat !== "libre" || undefined}
                    disabled={enCours || !s.possible || s.etat === "presence" || s.etat === "absence"}
                    onClick={() => taper(s.activiteId, jour.date, s.etat)}>
                    {s.etat === "libre" ? "Réserver" : s.etat === "reservee" ? "Annuler" : LIBELLE[s.etat]}
                  </button>
                </div>
              ))}
            </div>
          )}
          {message && <p className="petit" role="status" style={{ color: "var(--accent)" }}>{message}</p>}
        </div>
      )}
      <div className="legende" aria-hidden>
        <span style={{ "--x": "var(--accent)" } as React.CSSProperties}>Réservé</span>
        <span style={{ "--x": "var(--ok)" } as React.CSSProperties}>Présent</span>
        <span style={{ "--x": "var(--warn)" } as React.CSSProperties}>Absent</span>
        <span style={{ "--x": "var(--bord-fort)" } as React.CSSProperties}>Libre</span>
      </div>
    </div>
  );
}
