import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { euros, tarif, tarifNonReserve, trancheDe } from "@ville/core/donnees/regles";
import { grouperParService, reservable, service } from "@ville/core/donnees/services";
import { Retour } from "@/components/retour";

export const metadata: Metadata = { title: "Activités et tarifs" };
export const dynamic = "force-dynamic";

export default async function Activites() {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const activites = await f.source.activites();
  const tranche = trancheDe(f.famille.quotientFamilial, f.famille.exterieur);
  const qfCalcule = f.famille.quotientFamilial !== null;
  const groupes = grouperParService(activites);
  return (
    <>
      <Retour vers="/" libelle="Ma semaine" />
      <div className="page-tete">
        <div>
          <span className="salut">Ce à quoi vous avez droit</span>
          <h1>Activités et tarifs</h1>
          <p className="petit t-2">Vos tarifs, pour votre tranche {tranche}{qfCalcule ? ` (quotient ${f.famille.quotientFamilial})` : " — quotient non calculé, tarif maximal"}.</p>
        </div>
      </div>

      {!qfCalcule && (
        <div className="bandeau" data-tone="warn">
          <div><strong>Sans quotient calculé, c'est la tranche 9 qui s'applique</strong><div className="mini t-2">C'est le tarif le plus élevé, sans rétroactivité. <Link href="/demarches/nouvelle?type=quotient_familial">Faire calculer mon quotient</Link>.</div></div>
        </div>
      )}

      <div className="pile">
        {groupes.map((g) => {
          const a0 = g.formules[0]!;
          const res = reservable(a0);
          return (
            <section key={g.groupe} className="carte pile service" data-ton={g.service.ton}>
              <div className="service-tete">
                <div style={{ minWidth: 0 }}>
                  <div className="service-nom">{g.service.nomGroupe}</div>
                  <div className="mini t-3">{a0.horaires}{a0.public !== "tous" ? ` · ${a0.public === "maternelle" ? "maternelle" : "élémentaire"}` : ""}</div>
                </div>
                <span className="badge" data-tone={res ? "accent" : "ok"}>{res ? `${a0.prevenance.joursAvant} j ${a0.prevenance.type}` : "sans réservation"}</span>
              </div>
              <div className="tarifs-lignes">
                {g.formules.map((a) => (
                  <div key={a.id} className="tarif-ligne">
                    <span>{service(a).formule ?? "Séance"}</span>
                    <strong>{euros(tarif(a, tranche))}</strong>
                    {a.forfaitMensuel && <span className="mini t-3">forfait {euros(a.forfaitMensuel.montants[tranche - 1]!)} dès {a.forfaitMensuel.declencheA} fréquentations</span>}
                    {res && <span className="mini t-3">non réservé : {euros(tarifNonReserve(a, tranche, qfCalcule))}</span>}
                  </div>
                ))}
              </div>
              <p className="mini t-2">{res ? `À réserver au plus tard ${a0.prevenance.joursAvant} jour${a0.prevenance.joursAvant > 1 ? "s" : ""} ${a0.prevenance.type === "francs" ? (a0.prevenance.joursAvant > 1 ? "francs" : "franc") : "ouvrés"} avant, ${a0.prevenance.heureLimite === "23:59" ? "avant minuit" : `avant ${a0.prevenance.heureLimite}`}.` : "L'inscription annuelle suffit : votre enfant peut venir, vous êtes facturé à la fréquentation réelle."}</p>
            </section>
          );
        })}
      </div>

      <div className="carte pile">
        <h2>Bon à savoir</h2>
        <ul className="vitrine-liste">
          <li>Une prestation non réservée mais consommée est facturée au double du tarif de votre tranche.</li>
          <li>Un repas non réservé quand le quotient n'est pas calculé est facturé {euros(1102)}.</li>
          <li>Un repas réservé non consommé reste dû, sauf maladie justifiée, sortie scolaire ou classe de découverte.</li>
          <li>La facture arrive à terme échu, après le mois de consommation.</li>
        </ul>
        <p className="mini t-3">Grille tarifaire 2025-2026 de la ville et guide du périscolaire. Une question : {f.commune.telephoneAccueil}.</p>
      </div>
      <div className="rangee"><Link className="bouton" href="/">Réserver ma semaine</Link><Link className="bouton" data-variant="discret" href="/factures">Voir mes factures</Link></div>
    </>
  );
}
