import type { Metadata } from "next";
import { Document } from "@/components/document";
import { Decision, type PriseClient } from "@/components/decision";
import { decisionsPrises } from "@/lib/decisions";
import { extraireDecisions, lireDoc } from "@/lib/docs";

export const metadata: Metadata = { title: "Direction artistique" };
export const dynamic = "force-dynamic";
const MAQUETTES = process.env.MAQUETTES_URL; // lien du canvas publié (Claude Design)

export default async function PageDesign() {
  const md = await lireDoc("DIRECTION_ARTISTIQUE.md").catch(() => "");
  const decisions = extraireDecisions(md);
  const prises = await decisionsPrises("design");
  const vers = (c: string): PriseClient | null => { const p = prises.get(c); return p ? { choix: p.choix, note: p.note, acteur: p.acteur, trancheLe: p.trancheLe.toISOString(), reporteLe: p.reporteLe?.toISOString() ?? null } : null; };
  const restantes = decisions.filter((d) => !prises.has(`design:${d.numero}`)).length;
  return (
    <>
      <div className="page-tete">
        <div><h1>Direction artistique</h1><p className="muted">Références, identité extraite du site officiel, système, navigation, anti-patterns — et les maquettes à valider.</p></div>
        <span className="badge" data-tone={restantes ? "warn" : "ok"}>{restantes ? `${restantes} à trancher` : "Validée"}</span>
      </div>
      {MAQUETTES ? (
        <a className="carte" href={MAQUETTES} target="_blank" rel="noopener" style={{ display: "grid", gap: 4 }}><strong>Ouvrir les maquettes (canvas)</strong><span className="muted">Famille · Agents · Cockpit « une décision à la fois » · un croquis alternatif — à regarder sur le téléphone avant de trancher.</span></a>
      ) : (
        <div className="bandeau" data-tone="warn"><div><strong>Lien des maquettes non posé</strong><div className="tiny">Variable MAQUETTES_URL absente : l'agent la pose après publication du canvas.</div></div></div>
      )}
      <section className="pile"><h2>Décisions de design</h2>{decisions.map((d) => <Decision key={d.numero} sujet="design" cle={`design:${d.numero}`} numero={d.numero} titre={d.titre} texte={d.texte} options={d.options} recommandation={d.recommandation} prise={vers(`design:${d.numero}`)} />)}</section>
      <section className="pile"><h2>Le document</h2><Document md={md} replie titre="Lire la direction artistique complète (docs/planning/DIRECTION_ARTISTIQUE.md)" /></section>
    </>
  );
}
