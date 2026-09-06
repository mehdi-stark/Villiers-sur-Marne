import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { agentCourant } from "@/lib/session";
import { trancheDe } from "@ville/core/donnees/regles";

export const metadata: Metadata = { title: "Familles" };
export const dynamic = "force-dynamic";

export default async function Familles() {
  const a = await agentCourant();
  if (!a) redirect("/connexion");
  const familles = await a.source.familles();
  const enfants = await Promise.all(familles.map((f) => a.source.enfants(f.id)));
  return (
    <>
      <div className="page-tete"><div><h1>Familles</h1><p className="petit t-2">{familles.length} dossiers (fictifs — source « {a.source.nom} »)</p></div></div>
      <div className="file">
        {familles.map((f, i) => (
          <div key={f.id} className="file-ligne">
            <div style={{ minWidth: 0 }}>
              <strong>{f.nom}</strong>
              <div className="petit t-2">{f.email} · {enfants[i]!.length === 0 ? "aucun enfant rattaché" : enfants[i]!.map((e) => `${e.prenom} (${e.classe})`).join(", ")}</div>
            </div>
            <div className="rangee" style={{ justifyContent: "flex-end", gap: 6 }}>
              <span className="badge" data-tone={f.quotientFamilial === null ? "warn" : "accent"}>{f.quotientFamilial === null ? "QF non calculé → T9" : `QF ${f.quotientFamilial} · T${trancheDe(f.quotientFamilial, f.exterieur)}`}</span>
              <Link className="bouton bouton-sm" href={`/familles/${f.id}`}>Ouvrir le dossier</Link>
            </div>
          </div>
        ))}
      </div>
      <p className="mini t-3">Un enfant se rattache depuis le dossier — jamais par le parent : la ville tient le dossier famille (inscription scolaire), le périscolaire en découle. Recherche et régularisations : prochains maillons.</p>
    </>
  );
}
