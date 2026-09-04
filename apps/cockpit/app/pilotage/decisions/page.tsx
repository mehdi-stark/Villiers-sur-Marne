import type { Metadata } from "next";
import { Decision, type PriseClient } from "@/components/decision";
import { toutesLesDecisions } from "@/lib/ouvertes";

export const metadata: Metadata = { title: "Décisions" };
export const dynamic = "force-dynamic";

const BLOCS: { rang: number; titre: string; pourquoi: string }[] = [
  { rang: 1, titre: "Cadrage", pourquoi: "bloque l'analyse de marché et l'architecture" },
  { rang: 2, titre: "Marché", pourquoi: "bloque l'architecture et tout code métier" },
  { rang: 3, titre: "Backlog", pourquoi: "ne bloque rien aujourd'hui — chaque item attend son maillon" },
];

export default async function PageDecisions() {
  const toutes = await toutesLesDecisions();
  const estOuverte = (d: (typeof toutes)[number]) => !d.prise && !d.decideeDoc;
  const ouvertes = toutes.filter(estOuverte);
  const vers = (p: Ouverte["prise"]): PriseClient | null => (p ? { choix: p.choix, note: p.note, acteur: p.acteur, trancheLe: p.trancheLe.toISOString(), reporteLe: p.reporteLe?.toISOString() ?? null } : null);
  type Ouverte = (typeof toutes)[number];

  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Décisions</h1>
          <p className="muted">Tout ce qui t'attend, au même endroit, dans l'ordre de ce que chaque décision débloque.</p>
        </div>
        <span className="badge" data-tone={ouvertes.length ? "warn" : "ok"}>{ouvertes.length ? `${ouvertes.length} à trancher` : "Rien en attente"}</span>
      </div>
      {ouvertes.length === 0 && (
        <div className="carte vide">
          <strong>Tout est tranché</strong>
          <span>L'agent relit tes décisions au début de sa prochaine session (`pnpm decisions`) et les reporte dans les documents. Les décisions prises restent consultables ci-dessous.</span>
        </div>
      )}
      {BLOCS.map((b) => {
        const lot = toutes.filter((d) => d.rang === b.rang);
        const restantes = lot.filter(estOuverte).length;
        if (!lot.length) return null;
        return (
          <section key={b.rang} className="pile">
            <div className="rangee" style={{ justifyContent: "space-between" }}>
              <h2>{b.titre} <span className="muted" style={{ fontWeight: 400 }}>— {b.pourquoi}</span></h2>
              <span className="badge" data-tone={restantes ? "warn" : "ok"}>{restantes ? `${restantes} restante${restantes > 1 ? "s" : ""}` : "tranché"}</span>
            </div>
            {lot.filter(estOuverte).map((d) => (
              <Decision key={d.cle} sujet={d.sujet} cle={d.cle} titre={d.titre} texte={d.texte} options={d.options} recommandation={d.recommandation} prise={null} />
            ))}
            {lot.some((d) => !estOuverte(d)) && (
              <details className="carte">
                <summary>{lot.filter((d) => !estOuverte(d)).length} déjà tranchée(s)</summary>
                <div className="pile" style={{ marginTop: 12 }}>
                  {lot.filter((d) => !estOuverte(d)).map((d) =>
                    d.prise ? (
                      <Decision key={d.cle} sujet={d.sujet} cle={d.cle} titre={d.titre} texte={d.texte} options={d.options} recommandation={d.recommandation} prise={vers(d.prise)} />
                    ) : (
                      <div key={d.cle} className="backlog-ligne"><strong>{d.titre}</strong><span className="muted">Décidé dans le document : {d.decideeDoc}</span></div>
                    ),
                  )}
                </div>
              </details>
            )}
          </section>
        );
      })}
    </>
  );
}
