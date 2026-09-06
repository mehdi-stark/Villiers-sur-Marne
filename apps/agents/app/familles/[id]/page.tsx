import type { Metadata } from "next";
import { teinteEnfant } from "@ville/ui/teintes";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { agentCourant } from "@/lib/session";
import { trancheDe } from "@ville/core/donnees/regles";
import { ECOLES } from "@ville/core/donnees/fictif";
import { enfantsRattaches, journalDossier } from "@ville/core/donnees/enfants";
import { History } from "lucide-react";
import { FormulaireEnfant, LigneEnfant } from "@/components/enfants-dossier";

export const metadata: Metadata = { title: "Dossier famille" };
export const dynamic = "force-dynamic";

const fmtNaissance = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
const fmtHorodatage = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });
const age = (n: string) => Math.floor((Date.now() - new Date(`${n}T12:00:00Z`).getTime()) / (365.25 * 86_400_000));

/** LE DOSSIER : ce que l'agent ouvre au téléphone quand un parent appelle. */
export default async function Dossier({ params }: { params: Promise<{ id: string }> }) {
  const a = await agentCourant();
  if (!a) redirect("/connexion");
  const { id } = await params;
  const famille = await a.source.famille(id);
  if (!famille) notFound();
  const enfants = await a.source.enfants(id);
  // Un enfant venu de la SOURCE de la ville ne se corrige pas ici : seuls ceux qu'un
  // agent a rattachés dans cette application peuvent en être détachés.
  const rattachesIci = new Set((await enfantsRattaches(id)).map((e) => e.id));
  const journal = await journalDossier(id);
  const tranche = trancheDe(famille.quotientFamilial, famille.exterieur);

  return (
    <>
      <Link className="bouton bouton-sm" data-variant="discret" href="/familles" style={{ justifySelf: "start" }}>← Familles</Link>
      <div className="page-tete">
        <div>
          <span className="salut">Dossier famille</span>
          <h1>{famille.nom}</h1>
          <p className="petit t-2">{famille.email} · {enfants.length} enfant{enfants.length > 1 ? "s" : ""} · {famille.exterieur ? "hors commune" : "Villiers-sur-Marne"}</p>
        </div>
        <span className="badge" data-tone={famille.quotientFamilial === null ? "warn" : "accent"}>
          {famille.quotientFamilial === null ? "QF non calculé → T9" : `QF ${famille.quotientFamilial} · tranche ${tranche}`}
        </span>
      </div>

      <section className="carte pile">
        <div className="rangee" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <h2>Les enfants du dossier</h2>
          <span className="mini t-3">{enfants.length} rattaché{enfants.length > 1 ? "s" : ""}</span>
        </div>
        {enfants.length === 0 ? (
          <p className="mini t-2">Aucun enfant sur ce dossier : le parent ne verra aucun service tant qu'un enfant n'y est pas rattaché.</p>
        ) : (
          <div className="pile" style={{ gap: 6 }}>
            {enfants.map((e) => (
              <LigneEnfant key={e.id} id={e.id} familleId={id} prenom={e.prenom} teinte={teinteEnfant(e.id)}
                detail={`${fmtNaissance.format(new Date(`${e.naissance}T12:00:00Z`))} · ${age(e.naissance)} ans · ${e.ecole} · ${e.classe}`}
                rattache={rattachesIci.has(e.id)} />
            ))}
          </div>
        )}
      </section>

      <section className="carte pile">
        <h2>Rattacher un enfant</h2>
        <p className="mini t-3">
          D&apos;où vient normalement un enfant : du <b>dossier famille de la mairie</b> (inscription scolaire),
          repris par l&apos;export de la ville. Tant que cette source n&apos;est pas branchée, c&apos;est vous qui
          rattachez — le parent, lui, ne crée jamais un enfant. Chaque rattachement est tracé à votre nom.
        </p>
        <FormulaireEnfant familleId={id} ecoles={ECOLES.map((e) => e.nom)} />
      </section>

      {/* « Qui a changé l'école de mon fils ? » — la question se pose au téléphone. */}
      <section className="carte pile">
        <div className="rangee" style={{ alignItems: "center", gap: 10 }}>
          <span className="icone-ronde" aria-hidden><History size={16} /></span>
          <div style={{ flex: "1 1 auto" }}><h2 style={{ margin: 0 }}>Historique du dossier</h2><div className="mini t-3">Qui a fait quoi, et quand. Conservé même après un détachement.</div></div>
        </div>
        {journal.length === 0 ? (
          <p className="mini t-2">Aucun geste enregistré sur ce dossier depuis cette application. Les enfants venus de la source de la ville n&apos;y figurent pas.</p>
        ) : (
          <ol className="frise">
            {journal.map((l, i) => (
              <li key={i} className="frise-ligne" data-action={l.action}>
                <span className="frise-point" aria-hidden />
                <div>
                  <strong>{l.detail}</strong>
                  <div className="tiny">{fmtHorodatage.format(l.creeLe)} · {l.acteur}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
