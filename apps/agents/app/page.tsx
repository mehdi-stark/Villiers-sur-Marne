import { redirect } from "next/navigation";
import { agentCourant } from "@/lib/session";
import { sourceFictive } from "@ville/core/donnees/fictif";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

// La file du jour : par école et par activité, combien d'enfants réservés, combien
// pointés, et les ÉCARTS (réservé sans présence, présent sans réservation) —
// c'est ce que l'agent traite le matin, pas une archive.
export default async function FileDuJour({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const a = await agentCourant();
  if (!a) redirect("/connexion");
  const { d } = await searchParams;
  const jour = d ?? new Date().toISOString().slice(0, 10);
  const activites = await a.source.activites();
  // Démo : la source fictive n'expose pas « tous les enfants » ; on parcourt les familles connues.
  const familles = ["fam-demo-1", "fam-demo-2"];
  const lignes: { ecole: string; activite: string; reserves: number; presents: number; ecarts: number }[] = [];
  for (const fid of familles) {
    for (const e of await sourceFictive.enfants(fid)) {
      const res = await a.source.reservations(e.id, jour, jour);
      for (const r of res) {
        const act = activites.find((x) => x.id === r.activiteId)?.libelle ?? r.activiteId;
        let l = lignes.find((x) => x.ecole === e.ecole && x.activite === act);
        if (!l) { l = { ecole: e.ecole, activite: act, reserves: 0, presents: 0, ecarts: 0 }; lignes.push(l); }
        if (r.etat === "reservee" || r.etat === "presence") l.reserves++;
        if (r.etat === "presence") l.presents++;
        if (r.etat === "absence") l.ecarts++;
      }
    }
  }
  const prec = new Date(new Date(`${jour}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10);
  const suiv = new Date(new Date(`${jour}T00:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10);
  return (
    <>
      <div className="page-tete">
        <div><h1>File du jour</h1><p className="muted">{fmt.format(new Date(`${jour}T12:00:00Z`))} · {a.commune.nom} · source {a.source.nom}</p></div>
        <div className="rangee"><a className="bouton bouton-sm" href={`/?d=${prec}`}>← Veille</a><a className="bouton bouton-sm" href={`/?d=${suiv}`}>Lendemain →</a></div>
      </div>
      {lignes.length === 0 ? (
        <div className="carte vide"><strong>Rien à traiter ce jour</strong><span>Aucune réservation sur les familles connues de la source « {a.source.nom} ». Un jour d'école de septembre 2026 en montre.</span></div>
      ) : (
        <div className="file">
          {lignes.map((l) => (
            <div key={l.ecole + l.activite} className="file-ligne">
              <div><strong>{l.ecole}</strong><div className="muted">{l.activite}</div></div>
              <div className="rangee" style={{ justifyContent: "flex-end" }}>
                <span className="badge" data-tone="accent">{l.reserves} réservé{l.reserves > 1 ? "s" : ""}</span>
                <span className="badge" data-tone="ok">{l.presents} pointé{l.presents > 1 ? "s" : ""}</span>
                {l.ecarts > 0 && <span className="badge" data-tone="warn">{l.ecarts} écart{l.ecarts > 1 ? "s" : ""}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="tiny">Pointage tactile et régularisations : prochains maillons. Les chiffres viennent de la source active, jamais d'une ressaisie.</p>
    </>
  );
}
