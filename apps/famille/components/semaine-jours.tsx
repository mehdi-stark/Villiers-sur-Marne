"use client";

import { BookOpen, Check, Palette, Sunrise, Sunset, Utensils, X } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { basculerCreneau, reserverEnSerie } from "@/app/actions";
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
  groupe: string; nom: string; nomCourt: string; icone: keyof typeof ICONES; ton: string;
  reservable: boolean; formules: FormuleClient[];
};

type Ligne = { service: ServiceSemaine; formule: FormuleClient; cellule: CelluleClient };

export function SemaineParJour({ enfantId, services, jours, aujourdhui }: { enfantId: string; services: ServiceSemaine[]; jours: { date: string; jour: number }[]; aujourdhui: string }) {
  const [enAttente, demarrer] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  // Ce qu'on a changé DEPUIS SON ARRIVÉE : un parent enchaîne les taps puis ferme
  // l'onglet. Le compte et le montant net lui disent ce qu'il vient de décider.
  const [bilan, setBilan] = useState({ ajouts: 0, retraits: 0, euros: 0 });
  const compter = (etatAvant: string, tarif: string) => {
    const prix = Number(tarif.replace(/[^\d,]/g, "").replace(",", ".") || 0);
    setBilan((b) => etatAvant === "libre"
      ? { ajouts: b.ajouts + 1, retraits: b.retraits, euros: b.euros + prix }
      : { ajouts: b.ajouts, retraits: b.retraits + 1, euros: b.euros - prix });
  };
  const cle = (activiteId: string, date: string) => `${activiteId}|${date}`;
  const initial = Object.fromEntries(services.flatMap((s) => s.formules.flatMap((f) => f.cellules.map((c) => [cle(f.activiteId, c.date), c.etat] as const))));
  const [etats, poserOptimiste] = useOptimistic(initial as Record<string, string>, (courant, maj: { k: string; etat: string }) => ({ ...courant, [maj.k]: maj.etat }));

  const taper = (activiteId: string, date: string, etat: string, tarif: string) => demarrer(async () => {
    compter(etat, tarif);
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

  // « Tout réserver » : ce qui est encore réservable et pas déjà pris, sur la semaine
  // affichée. Le total est annoncé AVANT le tap — on ne demande pas un geste en aveugle.
  const restants = aDecider.flatMap((s) => s.formules.flatMap((f) => f.cellules
    .filter((c) => c.etat === "libre" && c.possible)
    .map((c) => ({ activiteId: f.activiteId, date: c.date, tarif: f.tarif, groupe: s.groupe }))))
    // Un service à plusieurs formules ne se réserve qu'une fois par jour : on garde la première.
    .filter((x, i, tous) => tous.findIndex((y) => y.groupe === x.groupe && y.date === x.date) === i);
  const total = restants.reduce((s, x) => s + Number(x.tarif.replace(/[^\d,]/g, "").replace(",", ".") || 0), 0);
  const toutReserver = () => demarrer(async () => {
    for (const r of restants) poserOptimiste({ k: cle(r.activiteId, r.date), etat: "reservee" });
    const r = await reserverEnSerie({ enfantId, creneaux: restants.map(({ activiteId, date }) => ({ activiteId, date })) });
    setBilan((b) => ({ ajouts: b.ajouts + r.reservees, retraits: b.retraits, euros: b.euros + total }));
    setMessage(r.message);
    setTimeout(() => setMessage(null), 5000);
  });

  return (
    <div className="semaine-jours" aria-busy={enAttente}>
      {restants.length > 0 && (
        <button type="button" className="bouton bouton-pleine" data-variant="primaire" data-charge={enAttente || undefined} disabled={enAttente} onClick={toutReserver}>
          Tout réserver — {restants.length} créneau{restants.length > 1 ? "x" : ""} · {total.toFixed(2).replace(".", ",")} €
          {enAttente && <Rouet />}
        </button>
      )}
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
        // Le badge NOMME ce qui est réservé : « 2 réservés » ne dit pas QUOI. Un parent
        // veut lire « Cantine · Loisirs » sans ouvrir le jour.
        const prisCeJour = dujour.filter((l) => ["reservee", "presence"].includes(etats[cle(l.formule.activiteId, j.date)] ?? l.cellule.etat));
        const noms = prisCeJour.map((l) => l.service.nomCourt);
        const passe = dujour.some((l) => l.cellule.verdict.startsWith("Journée passée"));
        const d = new Date(`${j.date}T12:00:00Z`);
        return (
          <section key={j.date} className="jour-bloc" data-aujourdhui={j.date === aujourdhui || undefined} aria-label={`${JOURS[j.jour]} ${d.getUTCDate()}${j.date === aujourdhui ? " (aujourd\u2019hui)" : ""}`}>
            <div className="jour-bloc-tete">
              <h3>{JOURS[j.jour]} {d.getUTCDate()}{j.date === aujourdhui && <em>aujourd&apos;hui</em>}</h3>
              <span className="badge" data-tone={noms.length ? "accent" : undefined}>{noms.length === 0 ? (passe ? "rien ce jour-là" : "rien de réservé") : noms.join(" · ")}</span>
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
                      data-charge={enregistre || undefined} disabled={!tapable || enAttente} onClick={() => taper(formule.activiteId, j.date, etat, formule.tarif)}
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
            {/* Les services à l'année reviennent CHAQUE jour d'école : une ligne suffit,
                mais elle doit être là — sinon on ne sait pas ce qui est prévu ce jour. */}
            {annuels.length > 0 && dujour.length > 0 && (
              <p className="tiny jour-annuels">
                <b>Aussi ce jour</b> — {annuels.map((s) => `${s.nomCourt} ${s.formules[0]!.horaires}`).join(" · ")} · sans réservation
              </p>
            )}
            {dujour.some((l) => l.service.reservable && !l.cellule.possible) && (
              <p className="tiny">{dujour.find((l) => l.service.reservable && !l.cellule.possible)!.cellule.verdict}</p>
            )}
          </section>
        );
      })}
      {(bilan.ajouts > 0 || bilan.retraits > 0) && (
        <p className="bilan-session" role="status">
          <b>Depuis votre arrivée</b> — {bilan.ajouts > 0 && `${bilan.ajouts} réservation${bilan.ajouts > 1 ? "s" : ""}`}
          {bilan.ajouts > 0 && bilan.retraits > 0 && ", "}
          {bilan.retraits > 0 && `${bilan.retraits} annulation${bilan.retraits > 1 ? "s" : ""}`}
          {" · "}{bilan.euros >= 0 ? "+" : "−"}{Math.abs(bilan.euros).toFixed(2).replace(".", ",")} € sur la facture à venir
        </p>
      )}
      {message && <p className="petit" role="status" style={{ color: "var(--accent)" }}>{message}</p>}
    </div>
  );
}
