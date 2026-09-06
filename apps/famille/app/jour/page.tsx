import type { Metadata } from "next";
import { teinteEnfant } from "@ville/ui/teintes";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { decalerJour, jourEnfant, libelleJour } from "@/lib/jour";
import { lundiDe } from "@/lib/semaine";
import { euros, tarif, trancheDe } from "@ville/core/donnees/regles";
import { Cascade, EtatVide, IlluCalendrier } from "@ville/ui";
import { Journee } from "@/components/journee";
import { NavPeriode, SelecteurVue } from "@/components/selecteur-vue";
import { SelecteurEnfant } from "@/components/selecteur-enfant";

export const metadata: Metadata = { title: "Ma journée" };
export const dynamic = "force-dynamic";

/** LA VUE LA PLUS SIMPLE : une journée, du matin au soir, pour chaque enfant. */
export default async function PageJour({ searchParams }: { searchParams: Promise<{ d?: string; e?: string }> }) {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const maintenant = new Date();
  const aujourdhui = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(maintenant);
  const { d, e: enfantChoisi } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d ?? "") ? d! : aujourdhui;
  const { titre, relatif } = libelleJour(date, aujourdhui);
  const [enfants, activites] = await Promise.all([f.source.enfants(f.famille.id), f.source.activites()]);
  const tranche = trancheDe(f.famille.quotientFamilial, f.famille.exterieur);
  const tarifs = Object.fromEntries(activites.map((a) => [a.id, euros(tarif(a, tranche))]));
  const choisi = enfants.some((e) => e.id === enfantChoisi) ? enfantChoisi! : null;
  const affiches = choisi ? enfants.filter((e) => e.id === choisi) : enfants;
  const journees = await Promise.all(affiches.map(async (e) => ({ enfant: e, moments: jourEnfant(e, activites, await f.source.reservations(e.id, date, date), date, maintenant) })));
  const lundi = lundiDe(new Date(`${date}T00:00:00Z`)).toISOString().slice(0, 10);
  const reserves = journees.reduce((s, j) => s + j.moments.reduce((a, m) => a + m.services.filter((x) => x.etat === "reservee" || x.etat === "presence").length, 0), 0);
  const passe = date < aujourdhui;
  // Journée sans accueil (week-end, vacances) : on ne laisse pas l'écran vide, on donne
  // la prochaine journée qui en a une — c'est la seule chose que le parent veut alors.
  const vide = journees.every((j) => j.moments.length === 0);
  let prochaine: string | null = null;
  if (vide && enfants.length > 0) {
    for (let i = 1; i <= 10 && !prochaine; i++) {
      const d = decalerJour(date, i);
      if (affiches.some((e) => jourEnfant(e, activites, [], d, maintenant).length > 0)) prochaine = d;
    }
  }

  return (
    <>
      <div className="page-tete">
        <div>
          <span className="salut">{relatif ?? "Journée"}</span>
          <h1 className="capitale">{titre}</h1>
          <p className="petit t-2">{reserves === 0 ? "Rien de réservé ce jour" : `${reserves} service${reserves > 1 ? "s" : ""} réservé${reserves > 1 ? "s" : ""}`} · tranche {tranche}</p>
        </div>
        <NavPeriode precedent={`/jour?d=${decalerJour(date, -1)}${choisi ? `&e=${choisi}` : ""}`} suivant={`/jour?d=${decalerJour(date, 1)}${choisi ? `&e=${choisi}` : ""}`}
          titre={relatif ?? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}
          libellePrecedent="Jour précédent" libelleSuivant="Jour suivant" />
      </div>

      <SelecteurVue vue="jour" jour={date} semaine={lundi} mois={date.slice(0, 7)} enfant={choisi} />
      <SelecteurEnfant enfants={enfants.map((e) => ({ id: e.id, prenom: e.prenom, classe: e.classe }))} choisi={choisi}
        href={(id) => `/jour?d=${date}${id ? `&e=${id}` : ""}`} />

      {prochaine && (
        <div className="bandeau" data-tone="accent" role="status">
          <div>
            <strong>Pas d&apos;accueil ce jour</strong>
            <div className="mini t-2">Prochaine journée avec accueil : <a href={`/jour?d=${prochaine}`}>{libelleJour(prochaine, aujourdhui).relatif ?? libelleJour(prochaine, aujourdhui).titre}</a>.</div>
          </div>
        </div>
      )}

      {passe && <div className="bandeau" role="status"><div><strong>Journée passée — lecture seule</strong><div className="mini t-2">Rien n'y est modifiable.</div></div></div>}

      {enfants.length === 0 ? (
        <EtatVide illustration={<IlluCalendrier />} titre="Aucun enfant sur ce dossier" enfants={<>L'Espace Accueil et Facturation peut rattacher vos enfants au {f.commune.telephoneAccueil}.</>} />
      ) : (
        <Cascade className="pile">
          {journees.map(({ enfant, moments }) => (
            <section key={enfant.id} className="carte pile" data-enfant={teinteEnfant(enfant.id)} aria-label={`Journée de ${enfant.prenom}`}>
              <div className="enfant-tete">
                <span className="avatar" data-enfant={teinteEnfant(enfant.id)} aria-hidden>{enfant.prenom.slice(0, 1)}</span>
                <div><strong>{enfant.prenom}</strong><div className="mini t-3">{enfant.ecole} · {enfant.classe}</div></div>
              </div>
              {moments.length === 0
                ? <p className="mini t-2">Pas d'accueil ce jour : ni école, ni centre de loisirs.</p>
                : <Journee enfantId={enfant.id} date={date} moments={moments} tarifs={tarifs} />}
            </section>
          ))}
        </Cascade>
      )}
    </>
  );
}
