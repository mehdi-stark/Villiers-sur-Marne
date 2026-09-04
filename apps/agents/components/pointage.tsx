"use client";

import { Check, X } from "lucide-react";
import { useState, useTransition } from "react";
import { pointerEnfant } from "@/app/actions";
import type { EtatReservation } from "@ville/core/donnees/types";

export function Pointage(p: { enfantId: string; prenom: string; activiteId: string; date: string; etat: EtatReservation | null }) {
  const [enAttente, demarrer] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const aller = (voulu: "presence" | "absence") => demarrer(async () => { const r = await pointerEnfant({ enfantId: p.enfantId, activiteId: p.activiteId, date: p.date, actuel: p.etat, voulu }); if (!r.ok) { setMsg(r.message); setTimeout(() => setMsg(null), 4000); } });
  return (
    <div className="rangee" style={{ justifyContent: "flex-end", gap: 6 }} aria-busy={enAttente}>
      {msg && <span className="tiny" style={{ color: "var(--danger)" }}>{msg}</span>}
      <button type="button" className="bouton bouton-sm" data-choisi={p.etat === "presence" || undefined} disabled={enAttente} onClick={() => aller("presence")} aria-label={`${p.prenom} présent`}><Check size={14} aria-hidden /> Présent</button>
      <button type="button" className="bouton bouton-sm" data-choisi={p.etat === "absence" || undefined} disabled={enAttente} onClick={() => aller("absence")} aria-label={`${p.prenom} absent`}><X size={14} aria-hidden /> Absent</button>
    </div>
  );
}
