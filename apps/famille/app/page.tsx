import { Clock, Info, Palette, Sunrise, Sunset, Utensils } from "lucide-react";
import { teinteEnfant } from "@ville/ui/teintes";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { joursDe, lundiDe, servicesDe } from "@/lib/semaine";
import { euros, tarif, trancheDe } from "@ville/core/donnees/regles";
import { dansLaPlage, grouperParMoment, plageHoraire } from "@ville/core/donnees/services";
import { ActiverFaceId } from "@ville/core/ui/passkeys";
import { ActiverNotifications } from "@ville/core/ui/push";
import { Cascade, EtatVide, IlluCalendrier } from "@ville/ui";
import { LigneService } from "@/components/ligne-service";
import { SemaineParJour } from "@/components/semaine-jours";
import { SemaineType } from "@/components/semaine-type";
import { NavPeriode, SelecteurVue } from "@/components/selecteur-vue";
import { SelecteurEnfant } from "@/components/selecteur-enfant";
import Link from "next/link";

export const dynamic = "force-dynamic";
const fmtJour = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "Europe/Paris" });
const fmtSemaine = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
const ICONE_MOMENT = { sunrise: Sunrise, utensils: Utensils, sunset: Sunset, palette: Palette, book: Sunset } as const;

export default async function MaSemaine({ searchParams }: { searchParams: Promise<{ s?: string; e?: string }> }) {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const { s, e: enfantChoisi } = await searchParams;
  const maintenant = new Date();
  const aujourdhui = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(maintenant);
  const lundi = lundiDe(s ? new Date(`${s}T00:00:00Z`) : new Date(maintenant.getTime() + 7 * 86_400_000));
  const jours = joursDe(lundi);
  const vendredi = new Date(lundi.getTime() + 4 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [enfants, activites] = await Promise.all([f.source.enfants(f.famille.id), f.source.activites()]);
  const tranche = trancheDe(f.famille.quotientFamilial, f.famille.exterieur);
  const choisi = enfants.some((e) => e.id === enfantChoisi) ? enfantChoisi! : null;
  const affiches = choisi ? enfants.filter((e) => e.id === choisi) : enfants;
  const semaines = await Promise.all(affiches.map(async (e) => ({ enfant: e, lignes: servicesDe(e, activites, await f.source.reservations(e.id, iso(lundi), iso(vendredi)), lundi, maintenant) })));
  const prec = iso(new Date(lundi.getTime() - 7 * 86_400_000)), suiv = iso(new Date(lundi.getTime() + 7 * 86_400_000));

  // Semaine passée : tout y est figé. On le DIT au lieu de laisser taper des boutons morts.
  const semainePassee = iso(vendredi) < aujourdhui;
  // Le moment en cours ne se marque que si la semaine affichée contient aujourd'hui.
  const partsHeure = new Intl.DateTimeFormat("fr-FR", { hour: "numeric", minute: "numeric", hour12: false, timeZone: "Europe/Paris" }).formatToParts(maintenant);
  const minutesParis = Number(partsHeure.find((x) => x.type === "hour")?.value) * 60 + Number(partsHeure.find((x) => x.type === "minute")?.value);
  const semaineCourante = jours.some((j) => j.date === aujourdhui);

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
        <NavPeriode precedent={`/?s=${prec}${choisi ? `&e=${choisi}` : ""}`} suivant={`/?s=${suiv}${choisi ? `&e=${choisi}` : ""}`} titre={fmtSemaine.format(lundi).replace(/ \d{4}$/, "")}
          libellePrecedent="Semaine précédente" libelleSuivant="Semaine suivante" />
      </div>

      <div className="carte carte-haut carte-accent resume-semaine">
        <span className="petit t-2">Cette semaine, pour {affiches.length === enfants.length ? `${enfants.length} enfant${enfants.length > 1 ? "s" : ""}` : affiches[0]!.prenom}</span>
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

      <SelecteurVue vue="semaine" jour={jours.some((j) => j.date === aujourdhui) ? aujourdhui : jours[0]!.date} semaine={iso(lundi)} mois={iso(lundi).slice(0, 7)} enfant={choisi} />
      <SelecteurEnfant enfants={enfants.map((e) => ({ id: e.id, prenom: e.prenom, classe: e.classe }))} choisi={choisi}
        href={(id) => `/?s=${iso(lundi)}${id ? `&e=${id}` : ""}`} />
      <div className="pile" style={{ gap: 8 }}>
        <ActiverFaceId cle="famille-passkey" />
        <SemaineType />
      </div>

      {semainePassee && (
        <div className="bandeau" role="status">
          <Info size={16} aria-hidden />
          <div><strong>Semaine passée — lecture seule</strong><div className="mini t-2">Rien n'y est modifiable. <Link href="/">Revenir à la semaine en cours</Link>.</div></div>
        </div>
      )}

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
            <section key={enfant.id} className="carte enfant-carte" data-enfant={teinteEnfant(enfant.id)} aria-label={`Semaine de ${enfant.prenom}`}>
              <div className="enfant-tete">
                <span className="avatar" data-enfant={teinteEnfant(enfant.id)} aria-hidden>{enfant.prenom.slice(0, 1)}</span>
                <div style={{ minWidth: 0 }}><strong>{enfant.prenom}</strong><div className="mini t-3">{enfant.ecole} · {enfant.classe}</div></div>
              </div>
              <div className="entete-jours v-large">
                {jours.map((j) => {
                  const d = new Date(`${j.date}T12:00:00Z`);
                  return (
                    <Link key={j.date} href={`/jour?d=${j.date}${choisi ? `&e=${choisi}` : ""}`} className="entete-jour" data-aujourdhui={j.date === aujourdhui || undefined}
                      aria-label={`Voir la journée du ${new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(d)}`}>
                      <span>{fmtJour.format(d).replace(".", "")}</span><b>{d.getUTCDate()}</b>
                      {j.date === aujourdhui && <em>aujourd&apos;hui</em>}
                    </Link>
                  );
                })}
              </div>
              <div className="services v-large">
                {grouperParMoment(lignes, (l) => l.service.moment).map(({ moment, lignes: ls }) => {
                  const IconeMoment = ICONE_MOMENT[moment.icone];
                  const plage = plageHoraire(ls.flatMap((l) => l.formules.map((x) => x.activite.horaires)));
                  const enCoursMaintenant = semaineCourante && dansLaPlage(plage, minutesParis);
                  return (
                    <div key={moment.cle} className="moment" data-ton={moment.ton} data-maintenant={enCoursMaintenant || undefined}>
                      <div className="moment-tete">
                        <span className="moment-icone" aria-hidden><IconeMoment size={15} /></span>
                        <div className="moment-titre"><b>{moment.titre}</b> <span className="mini t-3">{moment.quand}</span></div>
                        {enCoursMaintenant && <span className="moment-maintenant">en ce moment</span>}
                        {plage && <span className="moment-plage mini t-3">{plage}</span>}
                      </div>
                      {ls.map((l) => (
                        <LigneService key={l.groupe} enfantId={enfant.id} nom={l.service.nomGroupe} icone={l.service.icone} ton={l.service.ton} reservable={l.reservable} reserves={l.reserves}
                          formules={l.formules.map((x) => ({ activiteId: x.activite.id, libelle: x.libelle, horaires: x.activite.horaires, tarif: euros(tarif(x.activite, tranche)), cellules: x.cellules, reserves: x.reserves }))} />
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Sur un téléphone, la même semaine se lit PAR JOUR : le jour est écrit,
                  l'action est nommée (« Réserver » / « Annuler »), rien n'est à deviner. */}
              <div className="v-etroit">
                <SemaineParJour enfantId={enfant.id} jours={jours}
                  services={lignes.map((l) => ({
                    groupe: l.groupe, nom: l.service.nomGroupe, icone: l.service.icone, ton: l.service.ton, reservable: l.reservable,
                    formules: l.formules.map((x) => ({ activiteId: x.activite.id, libelle: x.libelle, horaires: x.activite.horaires, tarif: euros(tarif(x.activite, tranche)), cellules: x.cellules, reserves: x.reserves })),
                  }))} />
              </div>
            </section>
          ))}
        </Cascade>
      )}
      <p className="mini t-3">Un tap sur un jour réserve ou annule, tant que le délai de prévenance court. Hors délai, la case est grisée et dit jusqu'à quand c'était possible.</p>
      <div className="rangee"><Link className="bouton" href="/activites">Voir tous les tarifs</Link><Link className="bouton" data-variant="discret" href="/factures">Mes factures</Link><Link className="bouton" data-variant="discret" href="/demarches">Mes démarches</Link></div>
    </>
  );
}
