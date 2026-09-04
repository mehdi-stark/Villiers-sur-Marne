"use client";

import { BookOpen, Check, Palette, Sunrise, Sunset, Utensils, X } from "lucide-react";
import { useState, useTransition } from "react";
import { basculerCreneau } from "@/app/actions";
import type { EtatReservation } from "@ville/core/donnees/types";

const ICONES = { utensils: Utensils, sunrise: Sunrise, sunset: Sunset, book: BookOpen, palette: Palette } as const;
const LIBELLE: Record<string, string> = { reservee: "Réservé", presence: "Présent", absence: "Absent", libre: "Réserver", non_servi: "" };
const JOURS = ["", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven."];

export type CelluleClient = { date: string; jour: number; etat: "reservee" | "presence" | "absence" | "libre" | "non_servi"; possible: boolean; verdict: string };
export type FormuleClient = { activiteId: string; libelle: string | null; horaires: string; tarif: string; cellules: CelluleClient[]; reserves: number };

/** UN service par ligne : nom complet, horaire, tarif, état de chaque jour. Un service à
 *  plusieurs FORMULES (loisirs du mercredi : journée, matinée, après-midi) reste UNE ligne :
 *  on choisit la formule, puis on tape le jour. Un service sans réservation le DIT. */
export function LigneService(p: {
  enfantId: string; nom: string; icone: keyof typeof ICONES; ton: string; reservable: boolean; formules: FormuleClient[]; reserves: number;
}) {
  const Icone = ICONES[p.icone];
  const [iFormule, setIFormule] = useState(0);
  const [enAttente, demarrer] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const multi = p.formules.length > 1;
  // Quand une formule est déjà réservée dans la semaine, c'est celle-là qu'on montre d'abord.
  const iAffiche = multi ? (p.formules.findIndex((f) => f.reserves > 0) >= 0 && p.formules[iFormule]!.reserves === 0 ? p.formules.findIndex((f) => f.reserves > 0) : iFormule) : 0;
  const f = p.formules[iAffiche]!;
  const taper = (c: CelluleClient) => demarrer(async () => {
    const actuel: EtatReservation | null = c.etat === "libre" || c.etat === "non_servi" ? null : c.etat;
    const r = await basculerCreneau({ enfantId: p.enfantId, activiteId: f.activiteId, date: c.date, actuel });
    setMessage(r.message);
    setTimeout(() => setMessage(null), 4000);
  });
  return (
    <div className="service" data-ton={p.ton} aria-busy={enAttente}>
      <div className="service-tete">
        <span className="service-icone" aria-hidden><Icone size={17} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="service-nom">{p.nom}</div>
          <div className="mini t-3">{f.horaires} · {f.tarif} la séance</div>
        </div>
        {p.reservable ? (
          <span className="badge" data-tone={p.reserves ? "accent" : undefined}>{p.reserves ? `${p.reserves} réservé${p.reserves > 1 ? "s" : ""}` : "aucun"}</span>
        ) : (
          <span className="badge" data-tone="ok" title="Ce service ne se réserve pas : l'inscription annuelle suffit, la facturation se fait à la fréquentation réelle.">Inscrit à l'année</span>
        )}
      </div>

      {p.reservable && multi && (
        <div className="formules" role="group" aria-label={`Formule — ${p.nom}`}>
          {p.formules.map((x, i) => (
            <button key={x.activiteId} type="button" className="formule" data-choisi={i === iAffiche || undefined} onClick={() => setIFormule(i)} disabled={enAttente}>
              {x.libelle ?? "Formule"}{x.reserves > 0 && <span className="formule-point" aria-label={`${x.reserves} réservé`} />}
            </button>
          ))}
        </div>
      )}

      {p.reservable ? (
        <>
          <div className="service-cellules" role="group" aria-label={`${p.nom}${f.libelle ? ` — ${f.libelle}` : ""}`}>
            {f.cellules.map((c) => {
              const tapable = c.etat !== "non_servi" && c.possible && (c.etat === "libre" || c.etat === "reservee");
              return (
                <button key={c.date} type="button" className="creneau" data-etat={c.etat} disabled={!tapable || enAttente} onClick={() => taper(c)}
                  title={c.etat === "non_servi" ? `${p.nom} : pas d'accueil ce jour` : `${p.nom}${f.libelle ? ` — ${f.libelle}` : ""} — ${c.verdict}`}
                  aria-label={`${p.nom}${f.libelle ? `, ${f.libelle}` : ""}, ${JOURS[c.jour]} : ${c.etat === "non_servi" ? "pas d'accueil" : LIBELLE[c.etat]}. ${c.verdict}`}>
                  {c.etat === "non_servi" ? <span className="creneau-vide" aria-hidden>·</span> : (
                    <>
                      {c.etat === "presence" && <Check size={12} aria-hidden />}
                      {c.etat === "absence" && <X size={12} aria-hidden />}
                      <span>{LIBELLE[c.etat]}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          {multi && <p className="mini t-3 service-note">Formule affichée : <b>{f.libelle}</b> — {f.tarif}. Changez de formule avant de taper un jour.</p>}
        </>
      ) : (
        <p className="mini t-2 service-note">Sans réservation : votre enfant peut venir chaque jour d'école{f.horaires ? ` (${f.horaires})` : ""}, vous êtes facturé à la fréquentation réelle.</p>
      )}
      {message && <p className="petit service-message" role="status">{message}</p>}
    </div>
  );
}
