import type { Metadata } from "next";
import { teinteEnfant } from "@ville/ui/teintes";
import Link from "next/link";
import { redirect } from "next/navigation";
import { agentCourant } from "@/lib/session";
import { trancheDe } from "@ville/core/donnees/regles";
import { RechercheFamilles } from "@/components/recherche-familles";

export const metadata: Metadata = { title: "Familles" };
export const dynamic = "force-dynamic";

/** Un agent au téléphone cherche par nom de famille AUTANT que par prénom d'enfant :
 *  la recherche porte sur les deux, plus l'e-mail. Sans accents ni casse — on tape vite. */
const normaliser = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default async function Familles({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const a = await agentCourant();
  if (!a) redirect("/connexion");
  const { q } = await searchParams;
  const toutes = await a.source.familles();
  const tousEnfants = await Promise.all(toutes.map((f) => a.source.enfants(f.id)));
  const requete = normaliser((q ?? "").trim());
  const gardees = toutes
    .map((f, i) => ({ famille: f, enfants: tousEnfants[i]! }))
    .filter(({ famille, enfants }) => requete.length === 0
      || normaliser(famille.nom).includes(requete)
      || normaliser(famille.email).includes(requete)
      || enfants.some((e) => normaliser(e.prenom).includes(requete) || normaliser(e.ecole).includes(requete)));
  const familles = gardees.map((g) => g.famille);
  const enfants = gardees.map((g) => g.enfants);
  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Familles</h1>
          <p className="petit t-2">
            {requete ? `${familles.length} dossier${familles.length > 1 ? "s" : ""} sur ${toutes.length} pour « ${q} »` : `${toutes.length} dossiers`} — source « {a.source.nom} »
          </p>
        </div>
      </div>
      <RechercheFamilles valeur={q ?? ""} />
      <div className="file">
        {familles.map((f, i) => (
          <div key={f.id} className="file-ligne">
            <div style={{ minWidth: 0 }}>
              <strong>{f.nom}</strong>
              <div className="petit t-2">{f.email}</div>
              <div className="rangee-enfants">
                {enfants[i]!.length === 0
                  ? <span className="mini t-3">aucun enfant rattaché</span>
                  : enfants[i]!.map((e) => (
                    <span key={e.id} className="jeton-enfant" data-enfant={teinteEnfant(e.id)}>
                      <span className="jeton-pastille" aria-hidden />{e.prenom} <small>{e.classe}</small>
                    </span>
                  ))}
              </div>
            </div>
            <div className="rangee" style={{ justifyContent: "flex-end", gap: 6 }}>
              <span className="badge" data-tone={f.quotientFamilial === null ? "warn" : "accent"}>{f.quotientFamilial === null ? "QF non calculé → T9" : `QF ${f.quotientFamilial} · T${trancheDe(f.quotientFamilial, f.exterieur)}`}</span>
              <Link className="bouton bouton-sm" href={`/familles/${f.id}`}>Ouvrir le dossier</Link>
            </div>
          </div>
        ))}
      </div>
      {familles.length === 0 && <p className="petit t-2">Aucun dossier ne correspond à « {q} ». La recherche porte sur le nom de famille, l&apos;e-mail, le prénom d&apos;un enfant et son école.</p>}
      <p className="mini t-3">Un enfant se rattache depuis le dossier — jamais par le parent : la ville tient le dossier famille (inscription scolaire), le périscolaire en découle. Recherche et régularisations : prochains maillons.</p>
    </>
  );
}
