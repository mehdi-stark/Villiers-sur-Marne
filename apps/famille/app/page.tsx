import { Clock, Info } from "lucide-react";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { joursDe, lundiDe, servicesDe } from "@/lib/semaine";
import { euros, tarif, trancheDe } from "@ville/core/donnees/regles";
import { reservable } from "@ville/core/donnees/services";
import { ActiverFaceId } from "@ville/core/ui/passkeys";
import { ActiverNotifications } from "@ville/core/ui/push";
import { Cascade, EtatVide, IlluCalendrier } from "@ville/ui";
import { LigneService } from "@/components/ligne-service";
import { SemaineType } from "@/components/semaine-type";

export const dynamic = "force-dynamic";
const fmtJour = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "Europe/Paris" });
const fmtSemaine = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

export default async function MaSemaine({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const { s } = await searchParams;
  const maintenant = new Date();
  const aujourdhui = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(maintenant);
  const lundi = lundiDe(s ? new Date(`${s}T00:00:00Z`) : new Date(maintenant.getTime() + 7 * 86_400_000));
  const jours = joursDe(lundi);
  const vendredi = new Date(lundi.getTime() + 4 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [enfants, activites] = await Promise.all([f.source.enfants(f.famille.id), f.source.activites()]);
  const tranche = trancheDe(f.famille.quotientFamilial, f.famille.exterieur);
  const semaines = await Promise.all(enfants.map(async (e) => ({ enfant: e, lignes: servicesDe(e, activites, await f.source.reservations(e.id, iso(lundi), iso(vendredi)), lundi, maintenant) })));
  const prec = iso(new Date(lundi.getTime() - 7 * 86_400_000)), suiv = iso(new Date(lundi.getTime() + 7 * 86_400_000));

  // Récapitulatif PAR SERVICE : ce que le parent veut savoir en 2 secondes.
  const parService = new Map<string, { nom: string; nb: number; montant: number }>();
  for (const { lignes } of semaines) for (const l of lignes) {
    if (!l.reservable || l.reserves === 0) continue;
    const c = parService.get(l.service.nomGroupe) ?? { nom: l.service.nomGroupe, nb: 0, montant: 0 };
    c.nb += l.reserves;
    c.montant += l.formules.reduce((s, f) => s + f.reserves * tarif(f.activite, tranche), 0);
    parService.set(l.service.nomGroupe, c);
  }
  const total = [...parService.values()].reduce((s, x) => s + x.montant, 0);
  const cantine = activites.find((a) => a.type === "cantine");
  const verdictCantine = cantine ? semaines[0]?.lignes.find((l) => l.groupe === "cantine")?.formules[0]?.cellules.find((c) => c.etat !== "non_servi") : undefined;

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

      <div className="carte carte-accent resume-semaine">
        <span className="petit t-2">Cette semaine, pour {enfants.length} enfant{enfants.length > 1 ? "s" : ""}</span>
        {parService.size === 0 ? (
          <strong>Rien de réservé pour l'instant</strong>
        ) : (
          <>
            <strong>{euros(total)} de services réservés</strong>
            <div className="resume-services">
              {[...parService.values()].map((x) => <span key={x.nom} className="resume-service"><b>{x.nb}</b> × {x.nom}</span>)}
            </div>
          </>
        )}
        <span className="petit t-2">Facturé à terme échu, payable par PayFIP. Les services « inscrit à l'année » sont facturés à la fréquentation réelle.</span>
      </div>

      <ActiverFaceId cle="famille-passkey" />
      <ActiverNotifications texte="Me rappeler les créneaux encore réservables" />
      <SemaineType />

      {verdictCantine && (
        <div className="bandeau" data-tone={verdictCantine.possible ? "accent" : "warn"} role="status">
          {verdictCantine.possible ? <Clock size={16} aria-hidden /> : <Info size={16} aria-hidden />}
          <div><strong>Pause méridienne : {verdictCantine.possible ? "encore modifiable" : "délai dépassé"}</strong><div className="mini t-2">{verdictCantine.verdict}</div></div>
        </div>
      )}

      {enfants.length === 0 ? (
        <EtatVide illustration={<IlluCalendrier />} titre="Aucun enfant sur ce dossier" enfants={<>L'Espace Accueil et Facturation peut rattacher vos enfants au {f.commune.telephoneAccueil}.</>} />
      ) : (
        <Cascade className="semaine">
          {semaines.map(({ enfant, lignes }) => (
            <section key={enfant.id} className="carte enfant-carte" aria-label={`Semaine de ${enfant.prenom}`}>
              <div className="enfant-tete">
                <span className="avatar" aria-hidden>{enfant.prenom.slice(0, 1)}</span>
                <div style={{ minWidth: 0 }}><strong>{enfant.prenom}</strong><div className="mini t-3">{enfant.ecole} · {enfant.classe}</div></div>
              </div>
              <div className="entete-jours" aria-hidden>
                {jours.map((j) => {
                  const d = new Date(`${j.date}T12:00:00Z`);
                  return <div key={j.date} className="entete-jour" data-aujourdhui={j.date === aujourdhui || undefined}><span>{fmtJour.format(d).replace(".", "")}</span><b>{d.getUTCDate()}</b></div>;
                })}
              </div>
              <div className="services">
                {lignes.filter((l) => l.reservable).map((l) => (
                  <LigneService key={l.groupe} enfantId={enfant.id} nom={l.service.nomGroupe} icone={l.service.icone} ton={l.service.ton} reservable reserves={l.reserves}
                    formules={l.formules.map((x) => ({ activiteId: x.activite.id, libelle: x.libelle, horaires: x.activite.horaires, tarif: euros(tarif(x.activite, tranche)), cellules: x.cellules, reserves: x.reserves }))} />
                ))}
                {lignes.some((l) => !l.reservable) && (
                  <details className="service-annuels">
                    <summary>{lignes.filter((l) => !l.reservable).length} services sans réservation (inscription à l'année)</summary>
                    <div className="pile" style={{ marginTop: 10 }}>
                      {lignes.filter((l) => !l.reservable).map((l) => (
                        <LigneService key={l.groupe} enfantId={enfant.id} nom={l.service.nomGroupe} icone={l.service.icone} ton={l.service.ton} reservable={false} reserves={l.reserves}
                          formules={l.formules.map((x) => ({ activiteId: x.activite.id, libelle: x.libelle, horaires: x.activite.horaires, tarif: euros(tarif(x.activite, tranche)), cellules: x.cellules, reserves: x.reserves }))} />
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </section>
          ))}
        </Cascade>
      )}
      <p className="mini t-3">Un tap sur un jour réserve ou annule, tant que le délai de prévenance court. Hors délai, la case est grisée et dit jusqu'à quand c'était possible.</p>
    </>
  );
}
