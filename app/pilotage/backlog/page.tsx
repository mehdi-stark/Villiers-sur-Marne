import type { Metadata } from "next";
import { Decision, type PriseClient } from "@/components/decision";
import { decisionsPrises } from "@/lib/decisions";
import { backlogOuvert, extraireBacklog, lireDoc, OPTIONS_BACKLOG } from "@/lib/docs";

export const metadata: Metadata = { title: "Backlog" };
export const dynamic = "force-dynamic";

export default async function PageBacklog() {
  const md = await lireDoc("BACKLOG.md");
  const lignes = extraireBacklog(md);
  const prises = await decisionsPrises("backlog");
  const restantes = lignes.filter((l) => !prises.has(l.cle) && backlogOuvert(l)).length;
  const vers = (c: string): PriseClient | null => {
    const p = prises.get(c);
    return p ? { choix: p.choix, note: p.note, acteur: p.acteur, trancheLe: p.trancheLe.toISOString(), reporteLe: p.reporteLe?.toISOString() ?? null } : null;
  };

  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Backlog</h1>
          <p className="muted">Priorisé par ce que chaque item débloque, jamais par facilité. Go, plus tard (avec condition), ou non.</p>
        </div>
        <span className="badge" data-tone={restantes ? "warn" : "ok"}>
          {restantes ? `${restantes} à trancher` : "Tout est tranché"}
        </span>
      </div>

      {lignes.length === 0 ? (
        <div className="carte vide">
          <strong>Backlog vide</strong>
          <span>Rien en attente : les propositions non retenues et les items reportés arriveront ici avec leur décision.</span>
        </div>
      ) : (
        <section className="pile">
          {lignes.map((l) => (
            <Decision
              key={l.cle}
              sujet="backlog"
              cle={l.cle}
              titre={l.item}
              options={OPTIONS_BACKLOG}
              prise={vers(l.cle)}
              meta={
                <div className="backlog-meta" style={{ marginTop: 6 }}>
                  <span><b>Débloque</b>{l.debloque}</span>
                  <span><b>Taille</b>{l.taille}</span>
                  <span><b>Doc</b>{l.decisionDoc}</span>
                </div>
              }
            />
          ))}
        </section>
      )}
    </>
  );
}
