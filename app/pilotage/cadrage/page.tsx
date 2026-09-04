import type { Metadata } from "next";
import { Decision, type PriseClient } from "@/components/decision";
import { Document } from "@/components/document";
import { decisionsPrises } from "@/lib/decisions";
import { extraireDecisions, lireDoc } from "@/lib/docs";

export const metadata: Metadata = { title: "Cadrage" };
export const dynamic = "force-dynamic";

export default async function PageCadrage() {
  const md = await lireDoc("CADRAGE.md");
  const decisions = extraireDecisions(md);
  const prises = await decisionsPrises("cadrage");
  const restantes = decisions.filter((d) => !prises.has(d.cle)).length;
  const vers = (c: string): PriseClient | null => {
    const p = prises.get(c);
    return p ? { choix: p.choix, note: p.note, acteur: p.acteur, trancheLe: p.trancheLe.toISOString(), reporteLe: p.reporteLe?.toISOString() ?? null } : null;
  };

  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Cadrage</h1>
          <p className="muted">Le besoin, les personas, le périmètre — et les décisions qui t'attendent.</p>
        </div>
        <span className="badge" data-tone={restantes ? "warn" : "ok"}>
          {restantes ? `${restantes} décision${restantes > 1 ? "s" : ""} à trancher` : "Tout est tranché"}
        </span>
      </div>

      <section className="pile" aria-labelledby="decisions">
        <h2 id="decisions">Décisions à valider</h2>
        {decisions.length === 0 ? (
          <div className="carte vide">
            <strong>Aucune décision extraite</strong>
            <span>Le §7 de CADRAGE.md ne contient pas d'item numéroté — l'agent doit y écrire les points à trancher.</span>
          </div>
        ) : (
          decisions.map((d) => (
            <Decision key={d.cle} sujet="cadrage" cle={d.cle} numero={d.numero} titre={d.titre} texte={d.texte} options={d.options} recommandation={d.recommandation} prise={vers(d.cle)} />
          ))
        )}
      </section>

      <section className="pile">
        <h2>Le document</h2>
        <Document md={md} replie titre="Lire le cadrage complet (docs/planning/CADRAGE.md)" />
      </section>
    </>
  );
}
