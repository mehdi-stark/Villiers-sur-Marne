import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { euros } from "@ville/core/donnees/regles";

export const metadata: Metadata = { title: "Factures" };
export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

export default async function Factures() {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const [factures, enfants, activites] = await Promise.all([f.source.factures(f.famille.id), f.source.enfants(f.famille.id), f.source.activites()]);
  const nom = (id: string) => enfants.find((e) => e.id === id)?.prenom ?? id;
  const lib = (id: string) => activites.find((a) => a.id === id)?.libelle ?? id;
  return (
    <>
      <div className="page-tete"><div><h1>Factures</h1><p className="muted">Le détail par enfant et par jour, le paiement PayFIP (Trésor public), l'attestation.</p></div></div>
      {factures.length === 0 ? (
        <div className="carte vide"><strong>Aucune facture</strong><span>Les factures sont émises à terme échu, après le mois de consommation.</span></div>
      ) : factures.map((fa) => {
        const parEnfant = new Map<string, number>();
        for (const l of fa.lignes) parEnfant.set(l.enfantId, (parEnfant.get(l.enfantId) ?? 0) + l.montant);
        return (
          <section key={fa.id} className="carte facture">
            <div className="facture-tete">
              <div><strong>Période {fa.periode}</strong><div className="tiny">Échéance le {fmt.format(new Date(fa.echeance))}</div></div>
              <div style={{ textAlign: "right" }}><div className="facture-montant">{euros(fa.montant)}</div><span className="badge" data-tone={fa.etat === "payee" ? "ok" : "warn"}>{fa.etat === "payee" ? "Payée" : "À payer"}</span></div>
            </div>
            <div className="backlog-meta">{[...parEnfant].map(([e, m]) => <span key={e}><b>{nom(e)}</b>{euros(m)}</span>)}</div>
            <details><summary>{fa.lignes.length} lignes</summary>
              <div className="doc" style={{ marginTop: 8 }}><div className="tableau-defile"><table style={{ minWidth: 420 }}><thead><tr><th>Date</th><th>Enfant</th><th>Prestation</th><th>Montant</th></tr></thead><tbody>
                {fa.lignes.map((l, i) => <tr key={i}><td>{l.date}</td><td>{nom(l.enfantId)}</td><td>{lib(l.activiteId)}</td><td>{euros(l.montant)}</td></tr>)}
              </tbody></table></div></div>
            </details>
            <div className="rangee">
              <button className="bouton" data-variant="primaire" disabled title="Paiement PayFIP : prochain maillon (sandbox DGFiP)">Payer avec PayFIP</button>
              <button className="bouton" disabled title="Attestation PDF : prochain maillon">Attestation de paiement</button>
            </div>
            <p className="tiny">Le paiement passe par PayFIP (Trésor public) : aucun autre moyen n'est légal pour une régie. Boutons actifs au maillon « factures ».</p>
          </section>
        );
      })}
    </>
  );
}
