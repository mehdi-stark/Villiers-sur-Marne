import { Clock, Info } from "lucide-react";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { lundiDe, semaineDe } from "@/lib/semaine";
import { euros, tarif, trancheDe } from "@ville/core/donnees/regles";
import { Creneau } from "@/components/creneau";

import { ActiverFaceId } from "@ville/core/ui/passkeys";

export const dynamic = "force-dynamic";
const fmtJour = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "Europe/Paris" });
const fmtSemaine = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

export default async function MaSemaine({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const { s } = await searchParams;
  const maintenant = new Date();
  const lundi = lundiDe(s ? new Date(`${s}T00:00:00Z`) : new Date(maintenant.getTime() + 7 * 86_400_000));
  const vendredi = new Date(lundi.getTime() + 4 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [enfants, activites] = await Promise.all([f.source.enfants(f.famille.id), f.source.activites()]);
  const tranche = trancheDe(f.famille.quotientFamilial, f.famille.exterieur);
  const semaines = await Promise.all(enfants.map(async (e) => ({ enfant: e, jours: semaineDe(e, activites, await f.source.reservations(e.id, iso(lundi), iso(vendredi)), lundi, maintenant) })));
  const prec = iso(new Date(lundi.getTime() - 7 * 86_400_000)), suiv = iso(new Date(lundi.getTime() + 7 * 86_400_000));
  const cantine = activites.find((a) => a.type === "cantine");
  const verdictCantine = cantine ? semaines[0]?.jours[0]?.creneaux.find((c) => c.activite.id === cantine.id)?.verdict : undefined;

  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Ma semaine</h1>
          <p className="muted">Du {fmtSemaine.format(lundi)} au {fmtSemaine.format(vendredi)} · {f.famille.nom} · tranche {tranche}{f.famille.quotientFamilial === null ? " (quotient non calculé)" : ""}</p>
        </div>
        <div className="rangee">
          <a className="bouton bouton-sm" href={`/?s=${prec}`}>← Semaine précédente</a>
          <a className="bouton bouton-sm" href={`/?s=${suiv}`}>Semaine suivante →</a>
        </div>

      <ActiverFaceId cle="famille-passkey" />
      </div>

      {verdictCantine && (
        <div className="bandeau" data-tone={verdictCantine.possible ? "accent" : "warn"} role="status">
          {verdictCantine.possible ? <Clock size={16} aria-hidden /> : <Info size={16} aria-hidden />}
          <div><strong>Repas de cette semaine : {verdictCantine.possible ? "encore modifiables" : "délai dépassé"}</strong><div className="tiny">{verdictCantine.libelle}</div></div>
        </div>
      )}

      {enfants.length === 0 ? (
        <div className="carte vide"><strong>Aucun enfant sur ce dossier</strong><span>L'Espace Accueil et Facturation peut rattacher vos enfants au {f.commune.telephoneAccueil}.</span></div>
      ) : (
        <div className="semaine">
          {semaines.map(({ enfant, jours }) => (
            <section key={enfant.id} className="carte enfant-carte" aria-label={`Semaine de ${enfant.prenom}`}>
              <div className="enfant-tete">
                <span className="avatar" aria-hidden>{enfant.prenom.slice(0, 1)}</span>
                <div style={{ minWidth: 0 }}><strong>{enfant.prenom}</strong><div className="tiny">{enfant.ecole} · {enfant.classe}</div></div>
              </div>
              <div className="jours">
                {jours.map((j) => {
                  const d = new Date(`${j.date}T12:00:00Z`);
                  return (
                    <div key={j.date} className="jour">
                      <div className="jour-nom">{fmtJour.format(d)}</div>
                      <div className="jour-num">{d.getUTCDate()}</div>
                      {j.creneaux.length === 0 ? <div className="creneau" data-etat="ferme">pas d'accueil</div> : j.creneaux.map((c) => (
                        <Creneau key={c.activite.id} enfantId={enfant.id} activiteId={c.activite.id} date={j.date} etat={c.etat === "ferme" ? "libre" : c.etat} type={c.activite.type === "cantine" ? "repas" : c.activite.type === "accueil_matin" ? "matin" : c.activite.type === "accueil_soir" ? "soir" : c.activite.type === "etude" ? "étude" : "loisirs"} tarif={euros(tarif(c.activite, tranche))} possible={c.verdict.possible} verdict={c.verdict.libelle} reservable={c.activite.prevenance.joursAvant > 0} />
                      ))}
                    </div>
                  );
                })}
              </div>
              <p className="tiny">Un tap réserve ou annule tant que le délai court ; hors délai le créneau est grisé et dit jusqu'à quand c'était possible. Matin, soir et étude sont sans réservation.</p>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
