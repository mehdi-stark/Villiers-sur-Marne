import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { agentCourant } from "@/lib/session";
import { sourceFictive } from "@ville/core/donnees/fictif";
import { trancheDe } from "@ville/core/donnees/regles";

export const metadata: Metadata = { title: "Familles" };
export const dynamic = "force-dynamic";

export default async function Familles() {
  const a = await agentCourant();
  if (!a) redirect("/connexion");
  const ids = ["fam-demo-1", "fam-demo-2"];
  const familles = (await Promise.all(ids.map((id) => sourceFictive.famille(id)))).filter((f) => f !== null);
  const enfants = await Promise.all(familles.map((f) => sourceFictive.enfants(f.id)));
  return (
    <>
      <div className="page-tete"><div><h1>Familles</h1><p className="petit t-2">{familles.length} dossiers (fictifs — source « {a.source.nom} »)</p></div></div>
      <div className="file">
        {familles.map((f, i) => (
          <div key={f.id} className="file-ligne">
            <div><strong>{f.nom}</strong><div className="petit t-2">{f.email} · {enfants[i]!.map((e) => `${e.prenom} (${e.ecole})`).join(", ")}</div></div>
            <div className="rangee" style={{ justifyContent: "flex-end" }}>
              <span className="badge" data-tone={f.quotientFamilial === null ? "warn" : "accent"}>{f.quotientFamilial === null ? "QF non calculé → T9" : `QF ${f.quotientFamilial} · T${trancheDe(f.quotientFamilial, f.exterieur)}`}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mini t-3">Recherche, dossier complet, démarches à valider, régularisations : prochains maillons.</p>
    </>
  );
}
