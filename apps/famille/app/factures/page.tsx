import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { calculerFacture } from "@ville/core/donnees/facturation";
import { euros } from "@ville/core/donnees/regles";
import { payfipDisponible, refdetPour, urlPayfip } from "@ville/core/paiement/payfip";
import { EtatVide, IlluFacture } from "@ville/ui";
import { BoutonAttestation } from "@/components/attestation";

export const metadata: Metadata = { title: "Factures" };
export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
const MOTIF: Record<string, string> = { presence: "présence", absence_facturee: "réservé non consommé", non_reserve: "non réservé (×2)" };

export default async function Factures() {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const [factures, enfants, activites] = await Promise.all([f.source.factures(f.famille.id), f.source.enfants(f.famille.id), f.source.activites()]);
  const nom = (id: string) => enfants.find((e) => e.id === id)?.prenom ?? id;
  const lib = (id: string) => activites.find((a) => a.id === id)?.libelle ?? id;
  const periode = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date()).slice(0, 7);
  const reservations = (await Promise.all(enfants.map((e) => f.source.reservations(e.id, `${periode}-01`, `${periode}-31`)))).flat();
  const enCours = calculerFacture({ famille: f.famille, enfants, activites, reservations, periode });
  const payfip = payfipDisponible();
  return (
    <>
      <div className="page-tete"><div><span className="salut">{f.famille.nom}</span><h1>Factures</h1><p className="petit t-2">Le détail par enfant et par jour, le paiement PayFIP (Trésor public), l'attestation.</p></div></div>

      <section className="carte facture" aria-label="Facture en préparation">
        <div className="facture-tete">
          <div><strong>En préparation — {periode}</strong><div className="mini t-3">Calculée depuis les pointages, mise à jour à chaque présence · tranche {enCours.tranche}</div></div>
          <div style={{ textAlign: "right" }}><div className="facture-montant">{euros(enCours.total)}</div><span className="badge" data-tone="info">estimation</span></div>
        </div>
        {enCours.lignes.length === 0 ? <p className="petit t-2">Aucune présence pointée ce mois-ci pour l'instant.</p> : (
          <details><summary>{enCours.lignes.length} présence{enCours.lignes.length > 1 ? "s" : ""}{enCours.forfaits.length ? ` · ${enCours.forfaits.length} forfait${enCours.forfaits.length > 1 ? "s" : ""}` : ""}</summary>
            <div className="tableau-defile" style={{ marginTop: 8 }}><table style={{ minWidth: 460 }}><thead><tr><th>Date</th><th>Enfant</th><th>Prestation</th><th>Motif</th><th>Montant</th></tr></thead><tbody>
              {enCours.lignes.map((l, i) => <tr key={i}><td>{l.date}</td><td>{nom(l.enfantId)}</td><td>{lib(l.activiteId)}</td><td>{MOTIF[l.motif]}</td><td>{euros(l.montant)}</td></tr>)}
              {enCours.forfaits.map((x, i) => <tr key={`f${i}`}><td>—</td><td>{nom(x.enfantId)}</td><td>{lib(x.activiteId)}</td><td>forfait ({x.frequentations} fréquentations, remplace {euros(x.remplace)})</td><td>{euros(x.montant)}</td></tr>)}
            </tbody></table></div>
          </details>
        )}
      </section>

      {factures.length === 0 ? (
        <EtatVide illustration={<IlluFacture />} titre="Aucune facture émise" enfants="Les factures sont émises à terme échu, après le mois de consommation. Vous serez prévenu ici et par notification." />
      ) : factures.map((fa) => {
        const parEnfant = new Map<string, number>();
        for (const l of fa.lignes) parEnfant.set(l.enfantId, (parEnfant.get(l.enfantId) ?? 0) + l.montant);
        const lien = fa.etat === "a_payer" ? urlPayfip({ refdet: refdetPour(fa.id), montantCentimes: fa.montant, email: f.email, objet: `Périscolaire ${fa.periode} — ${f.commune.nom}`, urlRetour: `${process.env.FAMILLE_URL ?? ""}/factures` }) : null;
        return (
          <section key={fa.id} className="carte facture">
            <div className="facture-tete">
              <div><strong>Période {fa.periode}</strong><div className="mini t-3">Échéance le {fmt.format(new Date(fa.echeance))}</div></div>
              <div style={{ textAlign: "right" }}><div className="facture-montant">{euros(fa.montant)}</div><span className="badge" data-tone={fa.etat === "payee" ? "ok" : "warn"}>{fa.etat === "payee" ? "Payée" : "À payer"}</span></div>
            </div>
            <div className="backlog-meta">{[...parEnfant].map(([e, m]) => <span key={e}><b>{nom(e)}</b>{euros(m)}</span>)}</div>
            <details><summary>{fa.lignes.length} lignes</summary>
              <div className="tableau-defile" style={{ marginTop: 8 }}><table style={{ minWidth: 420 }}><thead><tr><th>Date</th><th>Enfant</th><th>Prestation</th><th>Montant</th></tr></thead><tbody>
                {fa.lignes.map((l, i) => <tr key={i}><td>{l.date}</td><td>{nom(l.enfantId)}</td><td>{lib(l.activiteId)}</td><td>{euros(l.montant)}</td></tr>)}
              </tbody></table></div>
            </details>
            {fa.etat === "a_payer" && (lien?.ok ? (
              <a className="bouton bouton-lg bouton-pleine" data-variant="primaire" href={lien.url} target="_blank" rel="noopener">Payer {euros(fa.montant)} avec PayFIP{lien.saisie === "T" ? " (test DGFiP)" : ""}</a>
            ) : (
              <div className="bandeau" data-tone="warn"><div><strong>Paiement PayFIP pas encore ouvert</strong><div className="mini t-2">{payfip.ok ? lien && !lien.ok ? lien.cause : "" : payfip.cause}</div></div></div>
            ))}
            <BoutonAttestation factureId={fa.id} />
            <p className="mini t-3">Le paiement passe par PayFIP (Trésor public) : aucun autre moyen n'est légal pour une régie.</p>
          </section>
        );
      })}
    </>
  );
}
