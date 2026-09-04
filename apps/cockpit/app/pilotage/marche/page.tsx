import type { Metadata } from "next";
import { Decision, type PriseClient } from "@/components/decision";
import { Document } from "@/components/document";
import { decisionsPrises } from "@/lib/decisions";
import { lireDoc } from "@/lib/docs";
import { analyse, MARGE_CONFORT_PCT, noteEffective } from "@/lib/marche";

export const metadata: Metadata = { title: "Analyse de marché" };
export const dynamic = "force-dynamic";

const OPTIONS = ["Parer la faille : je porte l'interop (contact Infocom'94 / mairie)", "Démonstrateur sans vente, risque assumé", "NO-GO accepté : on s'arrête"] as const;
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default async function PageMarche() {
  const a = analyse();
  const md = await lireDoc("ANALYSE_MARCHE.md");
  const prises = await decisionsPrises("marche");
  const p = prises.get("marche:verdict");
  const prise: PriseClient | null = p ? { choix: p.choix, note: p.note, acteur: p.acteur, trancheLe: p.trancheLe.toISOString(), reporteLe: p.reporteLe?.toISOString() ?? null } : null;
  const tone = a.final === "GO" ? "ok" : a.final === "GO conditionnel" ? "warn" : "danger";

  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Analyse de marché</h1>
          <p className="muted">Demande mesurée, prix réels des marchés publics, P&L par code. Le verdict vient du calcul, pas de l'avis.</p>
        </div>
        <span className="badge" data-tone={tone}>{a.final} · {a.score}/100</span>
      </div>

      <section className="carte pile">
        <div className="rangee" style={{ justifyContent: "space-between" }}>
          <h2>Verdict calculé</h2>
          <span className="tiny">calibration {a.calibration} · GO ≥ {a.seuils.go} · conditionnel ≥ {a.seuils.conditionnel}</span>
        </div>
        <div className="tuiles">
          <div className="tuile"><span className="muted">Score</span><span className="tuile-chiffre">{a.score}<span className="muted" style={{ fontSize: 14 }}>/100</span></span><span className="tiny">verdict brut : {a.brut}</span></div>
          <div className="tuile"><span className="muted">Après contre-analyse</span><span className="tuile-chiffre" style={{ fontSize: 20 }}>{a.final}</span><span className="tiny">{a.degrade ? "dégradé d'un cran : une faille haute n'est pas parée" : "aucune faille haute non parée"}</span></div>
          <div className="tuile"><span className="muted">Marge nette / commune / an</span><span className="tuile-chiffre">{a.pnl.margePct} %</span><span className="tiny">{eur.format(a.pnl.margeNette)} sur {eur.format(a.pnl.chiffre)} HT · confort ≥ {MARGE_CONFORT_PCT} %</span></div>
        </div>
        <div>
          <h3 style={{ marginBottom: 6 }}>Conditions pour rejouer le calcul</h3>
          <ol style={{ paddingLeft: 20, display: "grid", gap: 4 }}>{a.conditions.map((c) => <li key={c}>{c}</li>)}</ol>
        </div>
      </section>

      <Decision sujet="marche" cle="marche:verdict" titre={`Verdict ${a.final} (${a.score}/100) — que fait-on ?`} texte="La faille haute est l'absence d'API ou d'export Agora+ : sans interopérabilité écrite dans un pilote, le produit reste un démonstrateur. La parer remonte le verdict à GO conditionnel sans changer les notes." options={OPTIONS} recommandation={OPTIONS[0]} prise={prise} />

      <section className="carte pile">
        <h2>Grille pondérée — chaque note porte sa preuve, sinon plafond 3</h2>
        <div className="doc"><div className="tableau-defile"><table style={{ minWidth: 820 }}>
          <thead><tr><th>Dimension</th><th>Poids</th><th>Note</th><th>Preuve</th><th>Faille</th></tr></thead>
          <tbody>{a.grille.map((g) => (
            <tr key={g.cle}><td><strong>{g.dimension}</strong><div className="tiny">{g.source}</div></td><td>{g.poids}</td><td>{noteEffective(g)}{!g.preuve && <span className="badge" data-tone="warn" style={{ marginLeft: 6 }}>plafonnée</span>}</td><td>{g.preuve ?? "aucune preuve mesurée"}</td><td>{g.faille}</td></tr>
          ))}</tbody>
        </table></div></div>
      </section>

      <section className="carte pile">
        <h2>P&L par commune et par an (code : pnlCommuneAn)</h2>
        <div className="backlog-meta">
          <span><b>Prix HT</b>{eur.format(a.pnl.chiffre)} (médiane annualisée DECP)</span>
          {Object.entries(a.pnl.couts).map(([k, v]) => <span key={k}><b>{k}</b>{eur.format(v)}</span>)}
          <span><b>Marge nette</b>{eur.format(a.pnl.margeNette)} · {a.pnl.margePct} %</span>
        </div>
        <p className="tiny">Prix et durée mesurés (45 marchés) ; hébergement, support et développement sont des HYPOTHÈSES notées dans le code, à remplacer par les coûts réels du pilote.</p>
      </section>

      <section className="carte pile">
        <h2>Contre-analyse adversariale</h2>
        {a.failles.map((f) => (
          <div key={f.titre} className="backlog-ligne">
            <div className="rangee"><strong>{f.titre}</strong><span className="badge" data-tone={f.gravite === "haute" ? (f.paree ? "ok" : "danger") : "warn"}>{f.gravite}{f.paree ? " · parée" : ""}</span></div>
            <p className="muted">{f.detail}</p>
            <p className="tiny"><b>Parade</b> — {f.parade}</p>
          </div>
        ))}
      </section>

      <section className="pile">
        <h2>Le dossier</h2>
        <Document md={md} replie titre="Lire l'analyse complète (docs/planning/ANALYSE_MARCHE.md)" />
      </section>
    </>
  );
}
