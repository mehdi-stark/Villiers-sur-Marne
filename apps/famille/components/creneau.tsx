"use client";

import { useState, useTransition } from "react";
import { basculerCreneau } from "@/app/actions";
import type { EtatReservation } from "@ville/core/donnees/types";

const LIBELLE: Record<string, string> = { reservee: "Réservé", presence: "Présent", absence: "Absent", libre: "Libre" };

/** Un créneau = un bouton. Le verdict de délai est déjà calculé côté serveur : un créneau
 *  hors délai est désactivé ET dit jusqu'à quand on pouvait ; jamais « contactez les services ». */
export function Creneau(p: { enfantId: string; activiteId: string; date: string; etat: "reservee" | "presence" | "absence" | "libre"; type: string; tarif: string; possible: boolean; verdict: string; reservable: boolean }) {
  const [enAttente, demarrer] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const tapable = p.reservable && p.possible && (p.etat === "libre" || p.etat === "reservee");
  const actuel: EtatReservation | null = p.etat === "libre" ? null : p.etat;
  const taper = () => demarrer(async () => { const r = await basculerCreneau({ enfantId: p.enfantId, activiteId: p.activiteId, date: p.date, actuel }); setMessage(r.message); setTimeout(() => setMessage(null), 4000); });
  return (
    <button type="button" className="creneau" data-etat={p.etat} data-type={p.type} disabled={!tapable || enAttente} onClick={taper} title={p.reservable ? p.verdict : "Sans réservation : l'inscription annuelle suffit"} aria-label={`${p.type} ${p.date} : ${LIBELLE[p.etat]} — ${p.verdict}`} aria-busy={enAttente}>
      <strong>{message ?? LIBELLE[p.etat]}</strong>
      <span>{p.type}</span>
      <span>{p.tarif}</span>
    </button>
  );
}
