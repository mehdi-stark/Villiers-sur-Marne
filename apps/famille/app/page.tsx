import { Clock, Info } from "lucide-react";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { lundiDe, semaineDe } from "@/lib/semaine";
import { euros, tarif, trancheDe } from "@ville/core/donnees/regles";
import { Creneau } from "@/components/creneau";
import { Cascade, EtatVide, IlluCalendrier } from "@ville/ui";
import { SemaineType } from "@/components/semaine-type";

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
          <span className="salut">Bonjour, {f.famille.nom}</span>
          <h1>Ma semaine</h1>
          <p className="petit t-2">Du {fmtSemaine.format(lundi)} au {fmtSemaine.format(vendredi)} · tranche {tranche}{f.famille.quotientFamilial === null ? " (quotient non calculé)" : ""}</p>
        </div>
        <div className="rangee">
          <a className="bouton bouton-sm" href={`/?s=${prec}`} aria-label="Semaine précédente">← Précédente</a>
          <a className="bouton bouton-sm" href={`/?s=${suiv}`} aria-label="Semaine suivante">Suivante →</a>
        </div>
      </div>
      {(() => { const total = semaines.reduce((s, x) => s + x.jours.reduce((a, j) => a + j.creneaux.filter((c) => c.etat === "reservee" || c.etat === "presence").reduce((b, c) => b + tarif(c.activite, tranche), 0), 0), 0); const nb = semaines.reduce((s, x) => s + x.jours.reduce((a, j) => a + j.creneaux.filter((c) => c.etat === "reservee" || c.etat === "presence").length, 0), 0); return (
        <div className="carte carte-accent resume-semaine">
          <span className="petit t-2">Cette semaine, pour {enfants.length} enfant{enfants.length > 1 ? "s" : ""}</span>
          <strong>{nb} créneau{nb > 1 ? "x" : ""} réservé{nb > 1 ? "s" : ""} · {euros(total)}</strong>
          <span className="petit t-2">Facturé à terme échu, payable par PayFIP.</span>
        </div>
      ); })()}
      <div className="legende" aria-hidden><span style={{ "--x": "var(--accent-soft)" } as React.CSSProperties}>Réservé</span><span style={{ "--x": "var(--chaud-soft)" } as React.CSSProperties}>Repas libre</span><span style={{ "--x": "var(--loisir-soft)" } as React.CSSProperties}>Loisirs libre</span><span style={{ "--x": "var(--ok-soft)" } as React.CSSProperties}>Présent</span></div>
      <ActiverFaceId cle="famille-passkey" />
      <SemaineType />

      {verdictCantine && (
        <div className="bandeau" data-tone={verdictCantine.possible ? "accent" : "warn"} role="status">
          {verdictCantine.possible ? <Clock size={16} aria-hidden /> : <Info size={16} aria-hidden />}
          <div><strong>Repas de cette semaine : {verdictCantine.possible ? "encore modifiables" : "délai dépassé"}</strong><div className="mini t-2">{verdictCantine.libelle}</div></div>
        </div>
      )}

      {enfants.length === 0 ? (
        <EtatVide illustration={<IlluCalendrier />} titre="Aucun enfant sur ce dossier" enfants={<>L'Espace Accueil et Facturation peut rattacher vos enfants au {f.commune.telephoneAccueil}.</>} />
      ) : (
        <Cascade className="semaine">
          {semaines.map(({ enfant, jours }) => (
            <section key={enfant.id} className="carte enfant-carte" aria-label={`Semaine de ${enfant.prenom}`}>
              <div className="enfant-tete">
                <span className="avatar" aria-hidden>{enfant.prenom.slice(0, 1)}</span>
                <div style={{ minWidth: 0 }}><strong>{enfant.prenom}</strong><div className="mini t-3">{enfant.ecole} · {enfant.classe}</div></div>
              </div>
              <div className="jours">
                {jours.map((j) => {
                  const d = new Date(`${j.date}T12:00:00Z`);
                  return (
                    <div key={j.date} className="jour" data-aujourdhui={j.date === new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(maintenant) || undefined}>
                      <div className="jour-nom">{fmtJour.format(d)}</div>
                      <div className="jour-num">{d.getUTCDate()}</div>
                      {j.creneaux.length === 0 ? <div className="creneau" data-etat="ferme">pas d'accueil</div> : j.creneaux.map((c) => (
                        <Creneau key={c.activite.id} enfantId={enfant.id} activiteId={c.activite.id} date={j.date} etat={c.etat === "ferme" ? "libre" : c.etat} type={c.activite.type === "cantine" ? "repas" : c.activite.type === "accueil_matin" ? "matin" : c.activite.type === "accueil_soir" ? "soir" : c.activite.type === "etude" ? "étude" : "loisirs"} tarif={euros(tarif(c.activite, tranche))} possible={c.verdict.possible} verdict={c.verdict.libelle} reservable={c.activite.prevenance.joursAvant > 0} />
                      ))}
                    </div>
                  );
                })}
              </div>
              <p className="mini t-3">Un tap réserve ou annule tant que le délai court ; hors délai le créneau est grisé et dit jusqu'à quand c'était possible. Matin, soir et étude sont sans réservation.</p>
            </section>
          ))}
        </Cascade>
      )}
    </>
  );
}
