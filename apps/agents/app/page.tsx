import { redirect } from "next/navigation";
import { agentCourant } from "@/lib/session";
import { sourceFictive } from "@ville/core/donnees/fictif";
import type { EtatReservation } from "@ville/core/donnees/types";
import { Pointage } from "@/components/pointage";
import { Cascade, EtatVide, IlluFile, TuileChiffre } from "@ville/ui";
import { compterAValider } from "@ville/core/demarches";

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
  const [activites, aValider] = await Promise.all([a.source.activites(), compterAValider()]);
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
        <div><h1>File du jour</h1><p className="petit t-2">{fmt.format(new Date(`${jour}T12:00:00Z`))} · {a.commune.nom} · source {a.source.nom}</p></div>
        <div className="segment"><a href={`/?d=${prec}`}>← Veille</a><a href={`/?d=${jour}`} data-actif>{jour}</a><a href={`/?d=${suiv}`}>Lendemain →</a></div>

      <ActiverFaceId cle="agents-passkey" />
      </div>
      {lignes.length > 0 && (
        <div className="tuiles">
          <TuileChiffre libelle="À pointer" valeur={reserves} tone={reserves ? "accent" : undefined} detail="réservés, pas encore pointés" />
          <TuileChiffre libelle="Présents" valeur={presents} tone="ok" />
          <TuileChiffre libelle="Absents" valeur={absents} tone={absents ? "warn" : undefined} detail="réservé non consommé : ×2" />
          <TuileChiffre href="/demarches" libelle="Démarches à traiter" valeur={aValider} tone={aValider ? "warn" : undefined} detail="déposées par les familles" />
        </div>
      )}
      {lignes.length === 0 ? (
        <EtatVide illustration={<IlluFile />} titre="Rien à pointer ce jour" enfants={<>Aucune réservation sur les familles connues de la source « {a.source.nom} ». Un jour d'école de septembre 2026 en montre.</>} />
      ) : <Cascade className="pile">{[...groupes].map(([titre, lot]) => (
        <section key={titre} className="carte pile">
          <div className="rangee" style={{ justifyContent: "space-between" }}><h2>{titre}</h2><span className="mini t-3">{lot.length} enfant{lot.length > 1 ? "s" : ""}</span></div>
          <div className="file">
            {lot.map((l) => (
              <div key={l.enfantId + l.activiteId} className="file-ligne" data-etat={l.etat}>
                <div><strong>{l.prenom}</strong><div className="petit t-2">{l.etat === "reservee" ? "réservé — à pointer" : l.etat === "presence" ? "présent" : "absent (réservé non consommé : ×2 selon la grille)"}</div></div>
                <Pointage enfantId={l.enfantId} prenom={l.prenom} activiteId={l.activiteId} date={jour} etat={l.etat} />
              </div>
            ))}
          </div>
        </section>
      ))}</Cascade>}
      <p className="mini t-3">Chaque tap est journalisé (agent, avant → après) ; le pointage nourrit la facture sans ressaisie. Une date future est refusée par le code.</p>
    </>
  );
}
