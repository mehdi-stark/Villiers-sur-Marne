import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { fileDesDemarches, piecesDe } from "@ville/core/demarches";
import { PIECES, TYPES, type CodePiece } from "@ville/core/demarches-definitions";
import { agentCourant } from "@/lib/session";
import { EtatVide, IlluFile } from "@ville/ui";
import { TraiterDemarche } from "@/components/traiter-demarche";

export const metadata: Metadata = { title: "Démarches à traiter" };
export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });

export default async function DemarchesAgents() {
  const a = await agentCourant();
  if (!a) redirect("/connexion");
  const file = await fileDesDemarches();
  const pieces = await Promise.all(file.map((d) => piecesDe(d.id)));
  return (
    <>
      <div className="page-tete">
        <div><h1>Démarches à traiter</h1><p className="petit t-2">Déposées par les familles, dans l'ordre d'arrivée. Un refus porte toujours son motif.</p></div>
        <span className="badge" data-tone={file.length ? "warn" : "ok"}>{file.length ? `${file.length} en attente` : "file vide"}</span>
      </div>
      {file.length === 0 ? (
        <EtatVide illustration={<IlluFile />} titre="Aucune démarche en attente" enfants="Les inscriptions, calculs de quotient et changements de coordonnées déposés par les familles arrivent ici." />
      ) : (
        <div className="pile">
          {file.map((d, i) => (
            <section key={d.id} className="carte pile">
              <div className="rangee" style={{ justifyContent: "space-between" }}>
                <div><strong>{TYPES[d.type as keyof typeof TYPES]?.nom ?? d.type}</strong><div className="mini t-3">{(d.donnees as { famille?: string }).famille ?? d.familleId} · {d.email} · déposée le {fmt.format(d.creeLe)}</div></div>
                <span className="badge" data-tone={d.etat === "deposee" ? "accent" : "warn"}>{d.etat === "deposee" ? "Nouvelle" : "En cours"}</span>
              </div>
              {(d.donnees as { message?: string }).message && <p className="petit" style={{ whiteSpace: "pre-line" }}>« {(d.donnees as { message?: string }).message} »</p>}
              <div className="file">
                {pieces[i]!.map((p) => (
                  <a key={p.id} className="file-ligne" href={`/api/pieces/${p.id}`} target="_blank" rel="noopener">
                    <div><strong>{PIECES[p.code as CodePiece]?.nom ?? p.code}</strong><div className="mini t-3">{p.nom} · {Math.round(p.taille / 1024)} Ko</div></div>
                    <span className="badge">ouvrir</span>
                  </a>
                ))}
              </div>
              <TraiterDemarche id={d.id} etat={d.etat} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
