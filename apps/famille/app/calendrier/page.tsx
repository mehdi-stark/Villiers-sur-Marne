import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { moisDe, moisEnfant } from "@/lib/mois";
import { euros, tarif, trancheDe } from "@ville/core/donnees/regles";
import { Calendrier } from "@/components/calendrier";
import { Cascade, EtatVide, IlluCalendrier } from "@ville/ui";

export const metadata: Metadata = { title: "Calendrier" };
export const dynamic = "force-dynamic";

export default async function PageCalendrier({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const { m } = await searchParams;
  const maintenant = new Date();
  const ancre = m ? new Date(`${m}-01T00:00:00Z`) : maintenant;
  const { debut, fin, libelle } = moisDe(ancre);
  const aujourdhui = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(maintenant);
  const [enfants, activites] = await Promise.all([f.source.enfants(f.famille.id), f.source.activites()]);
  const tranche = trancheDe(f.famille.quotientFamilial, f.famille.exterieur);
  const marge = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000).toISOString().slice(0, 10);
  const mois = await Promise.all(enfants.map(async (e) => ({ enfant: e, jours: moisEnfant(e, activites, await f.source.reservations(e.id, marge(debut, -7), marge(fin, 7)), ancre, maintenant, aujourdhui) })));
  const cle = (d: Date) => d.toISOString().slice(0, 7);
  const prec = cle(new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() - 1, 1)));
  const suiv = cle(new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + 1, 1)));
  const tarifs = Object.fromEntries(activites.map((a) => [a.id, euros(tarif(a, tranche))]));
  const reserves = mois.reduce((s, x) => s + x.jours.reduce((a, j) => a + j.services.filter((v) => v.etat === "reservee" || v.etat === "presence").length, 0), 0);

  return (
    <>
      <div className="page-tete">
        <div>
          <span className="salut">Calendrier</span>
          <h1 style={{ textTransform: "capitalize" }}>{libelle}</h1>
          <p className="petit t-2">{reserves} service{reserves > 1 ? "s" : ""} réservé{reserves > 1 ? "s" : ""} ce mois-ci · tranche {tranche}</p>
        </div>
        <div className="segmente">
          <a href={`/calendrier?m=${prec}`} aria-label="Mois précédent">←</a>
          <span data-actif style={{ textTransform: "capitalize" }}>{libelle.split(" ")[0]}</span>
          <a href={`/calendrier?m=${suiv}`} aria-label="Mois suivant">→</a>
        </div>
      </div>

      <div className="segmente" style={{ justifySelf: "start" }}>
        <Link href="/">Semaine</Link>
        <span data-actif>Mois</span>
      </div>

      {enfants.length === 0 ? (
        <EtatVide illustration={<IlluCalendrier />} titre="Aucun enfant sur ce dossier" enfants={<>L'Espace Accueil et Facturation peut rattacher vos enfants au {f.commune.telephoneAccueil}.</>} />
      ) : (
        <Cascade className="pile">
          {mois.map(({ enfant, jours }) => (
            <section key={enfant.id} className="carte pile" aria-label={`Calendrier de ${enfant.prenom}`}>
              <div className="enfant-tete">
                <span className="avatar" aria-hidden>{enfant.prenom.slice(0, 1)}</span>
                <div><strong>{enfant.prenom}</strong><div className="mini t-3">{enfant.ecole} · {enfant.classe}</div></div>
              </div>
              <Calendrier enfantId={enfant.id} prenom={enfant.prenom} jours={jours} euros={tarifs} />
            </section>
          ))}
        </Cascade>
      )}
      <p className="mini t-3">Touchez un jour pour voir ses services et réserver. Les jours sans pastille n'ont pas d'accueil.</p>
    </>
  );
}
