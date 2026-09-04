import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { agentCourant } from "@/lib/session";
import { euros } from "@ville/core/donnees/regles";

export const metadata: Metadata = { title: "Activités" };
export const dynamic = "force-dynamic";

export default async function Activites() {
  const a = await agentCourant();
  if (!a) redirect("/connexion");
  const activites = await a.source.activites();
  return (
    <>
      <div className="page-tete"><div><h1>Activités et tarifs</h1><p className="petit t-2">Grille 2025-2026 et délais de prévenance — chaque règle porte sa source.</p></div></div>
      <section className="carte">
        <div className="doc"><div className="tableau-defile"><table style={{ minWidth: 900 }}>
          <thead><tr><th>Activité</th><th>Horaires</th><th>Public</th><th>Jours</th>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => <th key={t}>T{t}</th>)}<th>Ext.</th><th>Prévenance</th></tr></thead>
          <tbody>{activites.map((x) => (
            <tr key={x.id}><td><strong>{x.libelle}</strong>{x.forfaitMensuel && <div className="mini t-3">forfait dès {x.forfaitMensuel.declencheA}</div>}</td><td>{x.horaires}</td><td>{x.public}</td><td>{x.joursServis.map((j) => ["", "L", "Ma", "Me", "J", "V"][j]).join(" ")}</td>{x.tarifsParTranche.map((m, i) => <td key={i}>{euros(m)}</td>)}<td className="mini t-3">{x.prevenance.joursAvant ? `${x.prevenance.joursAvant} j ${x.prevenance.type} · ${x.prevenance.heureLimite}` : "sans réservation"}<div>{x.prevenance.source}</div></td></tr>
          ))}</tbody>
        </table></div></div>
      </section>
    </>
  );
}
