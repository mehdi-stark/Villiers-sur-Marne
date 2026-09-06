"use client";

import { useState } from "react";
import { Rouet } from "@ville/ui";
import { basculerCreneau } from "@/app/actions";
import type { EtatReservation } from "@ville/core/donnees/types";
import type { JourMois } from "@/lib/mois";

const LIBELLE: Record<string, string> = { reservee: "Réservé", presence: "Présent", absence: "Absent", libre: "Libre" };
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOMENTS_LEGENDE = [["matin", "Matin"], ["midi", "Midi"], ["soir", "Soir"], ["hors_classe", "Mercredi et vacances"]] as const;
const fmtJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

/** Le mois d'un coup d'œil : une pastille par service et par jour ; le détail au tap,
 *  avec le verdict de délai — et la réservation depuis le même écran. */
export function Calendrier({ enfantId, prenom, jours, euros }: { enfantId: string; prenom: string; jours: JourMois[]; euros: Record<string, string> }) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null); // l'activité qu'on enregistre
  const jour = jours.find((j) => j.date === ouvert) ?? null;
  const presents = new Set(jours.flatMap((j) => j.services.map((s) => s.moment)));
  const taper = async (activiteId: string, date: string, etat: string) => {
    setEnCours(activiteId);
    const actuel: EtatReservation | null = etat === "libre" ? null : (etat as EtatReservation);
    const r = await basculerCreneau({ enfantId, activiteId, date, actuel });
    setMessage(r.message);
    setEnCours(null);
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
              {j.services.slice(0, 4).map((s) => <span key={s.activiteId} className="pastille" data-moment={s.moment} data-etat={s.etat} />)}
            </span>
          </button>
        ))}
      </div>
      {jour && (
        <div className="calendrier-detail" role="region" aria-live="polite">
          <div className="rangee" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <strong>{fmtJour.format(new Date(`${jour.date}T12:00:00Z`))}</strong>
            <a className="bouton bouton-sm" data-variant="discret" href={`/jour?d=${jour.date}`}>Voir la journée →</a>
          </div>
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
                    data-charge={enCours === s.activiteId || undefined}
                    disabled={enCours !== null || !s.possible || s.etat === "presence" || s.etat === "absence"}
                    onClick={() => taper(s.activiteId, jour.date, s.etat)}>
                    {s.etat === "libre" ? "Réserver" : s.etat === "reservee" ? "Annuler" : LIBELLE[s.etat]}
                    {enCours === s.activiteId && <Rouet />}
                  </button>
                </div>
              ))}
            </div>
          )}
          {message && <p className="petit" role="status" style={{ color: "var(--accent)" }}>{message}</p>}
        </div>
      )}
      {/* La légende dit ce que veut dire une pastille : sa COULEUR = le moment, son
          remplissage = réservé ou non. Même vocabulaire que la semaine et la vue jour. */}
      {/* La légende ne montre QUE les moments présents dans ce mois : une couleur qu'on
          ne voit nulle part dans la grille est une promesse non tenue. */}
      <div className="legende-moments" aria-hidden>
        {MOMENTS_LEGENDE.filter(([cle]) => presents.has(cle)).map(([cle, label]) => (
          <span key={cle}><span className="pastille" data-moment={cle} data-etat="reservee" />{label}</span>
        ))}
        <span><span className="pastille" data-moment={[...presents][0] ?? "midi"} data-etat="libre" />pas encore réservé</span>
      </div>
      <p className="mini t-3">Seuls les services <b>à réserver</b> apparaissent ici. L&apos;accueil du matin, du soir et l&apos;étude sont à l&apos;inscription annuelle : ils figurent dans la vue Jour et la vue Semaine.</p>
    </div>
  );
}
