"use client";

import { BookOpen, Check, Palette, Sunrise, Sunset, Utensils, X } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { basculerCreneau } from "@/app/actions";
import { Rouet } from "@ville/ui";
import type { CelluleClient, FormuleClient } from "./ligne-service";
import type { EtatReservation } from "@ville/core/donnees/types";

/* LA SEMAINE SUR UN TÉLÉPHONE — retour de l'opérateur (07/09/2026) : « on ne comprend
 * pas quoi est réservé pour quel jour ». Il avait raison, et la cause était structurelle :
 * la grille service × jours mettait l'en-tête des jours à 600 px des cellules, hors écran
 * dès qu'on descendait. Sur une largeur de 390 px, cinq colonnes de 62 px ne peuvent pas
 * porter un libellé lisible NI rappeler leur jour.
 * Ici, la semaine se lit dans le sens de la question du parent : « mardi, qu'est-ce qu'il
 * a ? ». Un bloc par jour, le jour écrit en toutes lettres, un service par ligne, et
 * l'action nommée — « Réserver » ou « ANNULER », jamais un état muet sur lequel il
 * faudrait deviner qu'on peut taper.
 * La grille reste sur grand écran : là, elle sert à comparer les jours d'un coup d'œil. */

const ICONES = { utensils: Utensils, sunrise: Sunrise, sunset: Sunset, book: BookOpen, palette: Palette } as const;
const JOURS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

export type ServiceSemaine = {
  groupe: string; nom: string; icone: keyof typeof ICONES; ton: string;
  reservable: boolean; formules: FormuleClient[];
};

type Ligne = { service: ServiceSemaine; formule: FormuleClient; cellule: CelluleClient };

export function SemaineParJour({ enfantId, services, jours }: { enfantId: string; services: ServiceSemaine[]; jours: { date: string; jour: number }[] }) {
  const [enAttente, demarrer] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const cle = (activiteId: string, date: string) => `${activiteId}|${date}`;
  const initial = Object.fromEntries(services.flatMap((s) => s.formules.flatMap((f) => f.cellules.map((c) => [cle(f.activiteId, c.date), c.etat] as const))));
  const [etats, poserOptimiste] = useOptimistic(initial as Record<string, string>, (courant, maj: { k: string; etat: string }) => ({ ...courant, [maj.k]: maj.etat }));

  const taper = (activiteId: string, date: string, etat: string) => demarrer(async () => {
    poserOptimiste({ k: cle(activiteId, date), etat: etat === "libre" ? "reservee" : "libre" });
    const actuel: EtatReservation | null = etat === "libre" ? null : (etat as EtatReservation);
    const r = await basculerCreneau({ enfantId, activiteId, date, actuel });
    setMessage(r.message);
    setTimeout(() => setMessage(null), 4000);
  });

  // Les services « inscrit à l'année » sont les MÊMES tous les jours d'école : les
  // répéter cinq fois allongeait la page de 2 000 px sans rien apprendre. Ils sont
  // rappelés une seule fois, en bas ; les blocs de jour ne portent que ce qui se DÉCIDE.
  const annuels = services.filter((s) => !s.reservable);
  const aDecider = services.filter((s) => s.reservable);

  return (
    <div className="semaine-jours" aria-busy={enAttente}>
      {jours.map((j) => {
        // Ce que l'enfant a CE jour-là : une formule non servie ne s'affiche pas.
        const lignes: Ligne[] = aDecider.flatMap((s) => s.formules
          .map((f) => ({ service: s, formule: f, cellule: f.cellules.find((c) => c.date === j.date)! }))
          .filter((l) => l.cellule && l.cellule.etat !== "non_servi"));
        // Un service à plusieurs formules : on ne montre que celle qui est retenue,
        // ou la première si rien n'est pris — sinon le mercredi affiche trois lignes.
        const vues = new Map<string, Ligne>();
        for (const l of lignes) {
          const dedans = vues.get(l.service.groupe);
          const pris = (etats[cle(l.formule.activiteId, j.date)] ?? l.cellule.etat) !== "libre";
          if (!dedans || pris) if (!dedans || pris) vues.set(l.service.groupe, l);
        }
        const dujour = [...vues.values()];
        const reserves = dujour.filter((l) => ["reservee", "presence"].includes(etats[cle(l.formule.activiteId, j.date)] ?? l.cellule.etat)).length;
        const d = new Date(`${j.date}T12:00:00Z`);
        return (
          <section key={j.date} className="jour-bloc" aria-label={`${JOURS[j.jour]} ${d.getUTCDate()}`}>
            <div className="jour-bloc-tete">
              <h3>{JOURS[j.jour]} {d.getUTCDate()}</h3>
              <span className="badge" data-tone={reserves ? "accent" : undefined}>{reserves === 0 ? "rien de réservé" : `${reserves} réservé${reserves > 1 ? "s" : ""}`}</span>
            </div>
            {dujour.length === 0 ? (
              <p className="mini t-3">Rien à réserver ce jour.</p>
            ) : dujour.map(({ service, formule, cellule }) => {
              const k = cle(formule.activiteId, j.date);
              const etat = etats[k] ?? cellule.etat;
              const enregistre = etat !== cellule.etat;
              const Icone = ICONES[service.icone];
              const tapable = service.reservable && cellule.possible && (etat === "libre" || etat === "reservee");
              return (
                <div key={service.groupe} className="jour-service" data-etat={etat} data-ton={service.ton}>
                  <span className="service-icone" aria-hidden><Icone size={15} /></span>
                  <div style={{ minWidth: 0 }}>
                    <strong>{service.nom}{formule.libelle && <span className="mini t-3"> · {formule.libelle}</span>}</strong>
                    <div className="mini t-3">{formule.horaires} · {formule.tarif}{!service.reservable ? " · inscription à l'année" : etat === "presence" ? " · présent" : etat === "absence" ? " · absent" : ""}</div>
                  </div>
                  {service.reservable ? (
                    <button type="button" className="bouton bouton-sm" data-variant={etat === "libre" ? "primaire" : undefined} data-choisi={etat === "reservee" || undefined}
                      data-charge={enregistre || undefined} disabled={!tapable || enAttente} onClick={() => taper(formule.activiteId, j.date, etat)}
                      title={cellule.verdict}
                      aria-label={`${service.nom}, ${JOURS[j.jour]} ${d.getUTCDate()} : ${etat === "libre" ? "réserver" : etat === "reservee" ? "annuler la réservation" : etat}. ${cellule.verdict}`}>
                      {etat === "presence" && <Check size={13} aria-hidden />}
                      {etat === "absence" && <X size={13} aria-hidden />}
                      {etat === "libre" ? "Réserver" : etat === "reservee" ? "Annuler" : etat === "presence" ? "Présent" : "Absent"}
                      {enregistre && <Rouet />}
                    </button>
                  ) : (
                    <span className="badge" data-tone="ok">à l&apos;année</span>
                  )}
                </div>
              );
            })}
            {dujour.some((l) => l.service.reservable && !l.cellule.possible) && (
              <p className="tiny">{dujour.find((l) => l.service.reservable && !l.cellule.possible)!.cellule.verdict}</p>
            )}
          </section>
        );
      })}
      {annuels.length > 0 && (
        <div className="jour-bloc" data-annuel>
          <div className="jour-bloc-tete"><h3>Tous les jours d&apos;école</h3><span className="badge" data-tone="ok">sans réservation</span></div>
          {annuels.map((s) => {
            const Icone = ICONES[s.icone];
            const f = s.formules[0]!;
            return (
              <div key={s.groupe} className="jour-service" data-ton={s.ton}>
                <span className="service-icone" aria-hidden><Icone size={15} /></span>
                <div style={{ minWidth: 0 }}>
                  <strong>{s.nom}</strong>
                  <div className="mini t-3">{f.horaires} · {f.tarif} · facturé à la fréquentation réelle</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {message && <p className="petit" role="status" style={{ color: "var(--accent)" }}>{message}</p>}
    </div>
  );
}
