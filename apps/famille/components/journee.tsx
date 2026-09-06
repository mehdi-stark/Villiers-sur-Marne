"use client";

import { BookOpen, Check, Palette, Sunrise, Sunset, Utensils, X } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { basculerCreneau } from "@/app/actions";
import { Rouet } from "@ville/ui";
import type { MomentJour } from "@/lib/jour";
import type { EtatReservation } from "@ville/core/donnees/types";

const ICONES = { utensils: Utensils, sunrise: Sunrise, sunset: Sunset, book: BookOpen, palette: Palette } as const;
const LIBELLE: Record<string, string> = { reservee: "Réservé", presence: "Présent", absence: "Absent", libre: "Non réservé" };

/** La journée d'un enfant, du matin au soir. Le tap réserve ou annule SUR PLACE, et
 *  l'affichage bascule tout de suite (le serveur corrige s'il refuse). */
export function Journee({ enfantId, date, moments, tarifs }: { enfantId: string; date: string; moments: MomentJour[]; tarifs: Record<string, string> }) {
  const [enAttente, demarrer] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [etats, poserOptimiste] = useOptimistic(
    Object.fromEntries(moments.flatMap((m) => m.services.map((s) => [s.activiteId, s.etat]))) as Record<string, string>,
    (courant, maj: { id: string; etat: string }) => ({ ...courant, [maj.id]: maj.etat }),
  );
  const taper = (id: string, etatActuel: string) => demarrer(async () => {
    poserOptimiste({ id, etat: etatActuel === "libre" ? "reservee" : "libre" });
    const actuel: EtatReservation | null = etatActuel === "libre" ? null : (etatActuel as EtatReservation);
    const r = await basculerCreneau({ enfantId, activiteId: id, date, actuel });
    setMessage(r.message);
    setTimeout(() => setMessage(null), 4000);
  });

  return (
    <div className="journee" aria-busy={enAttente}>
      {moments.map((m) => {
        const Icone = ICONES[m.icone as keyof typeof ICONES];
        return (
          <div key={m.cle} className="moment" data-ton={m.ton}>
            <div className="moment-tete">
              <span className="moment-icone" aria-hidden><Icone size={15} /></span>
              <div className="moment-titre"><b>{m.titre}</b> <span className="mini t-3">{m.quand}</span></div>
              {m.plage && <span className="moment-plage mini t-3">{m.plage}</span>}
            </div>
            {m.services.map((s) => {
              const etat = etats[s.activiteId] ?? s.etat;
              const enregistre = etat !== s.etat;
              const tapable = s.reservable && s.possible && (etat === "libre" || etat === "reservee");
              return (
                <div key={s.activiteId} className="jour-service" data-etat={etat}>
                  <div style={{ minWidth: 0 }}>
                    <strong>{s.nom}{s.formule && <span className="mini t-3"> · {s.formule}</span>}</strong>
                    <div className="mini t-3">{s.horaires} · {tarifs[s.activiteId]}{s.reservable ? ` · ${s.verdict}` : " · inscription à l'année"}</div>
                  </div>
                  {s.reservable ? (
                    <button type="button" className="bouton bouton-sm" data-variant={etat === "libre" ? "primaire" : undefined} data-choisi={etat !== "libre" || undefined}
                      data-charge={enregistre || undefined} aria-busy={enregistre || undefined} disabled={!tapable || enAttente}
                      onClick={() => taper(s.activiteId, etat)}
                      aria-label={`${s.nom}${s.formule ? ` ${s.formule}` : ""} : ${LIBELLE[etat]}. ${s.verdict}`}>
                      {etat === "presence" && <Check size={13} aria-hidden />}
                      {etat === "absence" && <X size={13} aria-hidden />}
                      {etat === "libre" ? "Réserver" : etat === "reservee" ? "Annuler" : LIBELLE[etat]}
                      {enregistre && <Rouet />}
                    </button>
                  ) : (
                    <span className="badge" data-tone="ok">Inscrit à l'année</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      {message && <p className="petit" role="status" style={{ color: "var(--accent)" }}>{message}</p>}
    </div>
  );
}
