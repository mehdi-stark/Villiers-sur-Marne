import { redirect } from "next/navigation";
import { agentCourant } from "@/lib/session";
import { sourceFictive } from "@ville/core/donnees/fictif";
import type { EtatReservation } from "@ville/core/donnees/types";
import { Pointage } from "@/components/pointage";

import { ActiverFaceId } from "@ville/core/ui/passkeys";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

// La file du jour : par école et par activité, chaque enfant réservé avec son
// pointage — présent / absent en un tap. Les écarts (réservé non pointé,
// absent) ressortent en tête ; ce que l'agent traite le matin, pas une archive.
type Ligne = { enfantId: string; prenom: string; ecole: string; activiteId: string; activite: string; etat: EtatReservation };

export default async function FileDuJour({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const a = await agentCourant();
  if (!a) redirect("/connexion");
  const { d } = await searchParams;
  const jour = d ?? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
  const activites = await a.source.activites();
  const lignes: Ligne[] = [];
  for (const fid of ["fam-demo-1", "fam-demo-2"]) {
    for (const e of await sourceFictive.enfants(fid)) {
      for (const r of await a.source.reservations(e.id, jour, jour)) {
        if (r.etat === "annulee") continue;
        lignes.push({ enfantId: e.id, prenom: e.prenom, ecole: e.ecole, activiteId: r.activiteId, activite: activites.find((x) => x.id === r.activiteId)?.libelle ?? r.activiteId, etat: r.etat });
      }
    }
  }
  const groupes = new Map<string, Ligne[]>();
  for (const l of lignes) { const k = `${l.ecole} — ${l.activite}`; groupes.set(k, [...(groupes.get(k) ?? []), l]); }
  const reserves = lignes.filter((l) => l.etat === "reservee").length, presents = lignes.filter((l) => l.etat === "presence").length, absents = lignes.filter((l) => l.etat === "absence").length;
  const t0 = new Date(`${jour}T00:00:00Z`).getTime();
  const prec = new Date(t0 - 86_400_000).toISOString().slice(0, 10), suiv = new Date(t0 + 86_400_000).toISOString().slice(0, 10);
  return (
    <>
      <div className="page-tete">
        <div><h1>File du jour</h1><p className="muted">{fmt.format(new Date(`${jour}T12:00:00Z`))} · {a.commune.nom} · source {a.source.nom}</p></div>
        <div className="rangee"><a className="bouton bouton-sm" href={`/?d=${prec}`}>← Veille</a><a className="bouton bouton-sm" href={`/?d=${suiv}`}>Lendemain →</a></div>

      <ActiverFaceId cle="agents-passkey" />
      </div>
      {lignes.length > 0 && (
        <div className="rangee">
          <span className="badge" data-tone="accent">{reserves} à pointer</span>
          <span className="badge" data-tone="ok">{presents} présent{presents > 1 ? "s" : ""}</span>
          <span className="badge" data-tone={absents ? "warn" : undefined}>{absents} absent{absents > 1 ? "s" : ""}</span>
        </div>
      )}
      {lignes.length === 0 ? (
        <div className="carte vide"><strong>Rien à pointer ce jour</strong><span>Aucune réservation sur les familles connues de la source « {a.source.nom} ». Un jour d'école de septembre 2026 en montre.</span></div>
      ) : [...groupes].map(([titre, lot]) => (
        <section key={titre} className="carte pile">
          <div className="rangee" style={{ justifyContent: "space-between" }}><h2>{titre}</h2><span className="tiny">{lot.length} enfant{lot.length > 1 ? "s" : ""}</span></div>
          <div className="file">
            {lot.map((l) => (
              <div key={l.enfantId + l.activiteId} className="file-ligne">
                <div><strong>{l.prenom}</strong><div className="muted">{l.etat === "reservee" ? "réservé — à pointer" : l.etat === "presence" ? "présent" : "absent (réservé non consommé : ×2 selon la grille)"}</div></div>
                <Pointage enfantId={l.enfantId} prenom={l.prenom} activiteId={l.activiteId} date={jour} etat={l.etat} />
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="tiny">Chaque tap est journalisé (agent, avant → après) ; le pointage nourrit la facture sans ressaisie. Une date future est refusée par le code.</p>
    </>
  );
}
