import type { Metadata } from "next";
import { CheckCircle2, Database, XCircle } from "lucide-react";
import { SOURCES, sourceActive } from "@ville/core/donnees";
import { ECOLES, FICTIF_STATS } from "@ville/core/donnees/fictif";
import { euros, tarif, tarifNonReserve, trancheDe, verdictDelai } from "@ville/core/donnees/regles";
import { SimulateurQF } from "@/components/simulateur-qf";

export const metadata: Metadata = { title: "Données" };
export const dynamic = "force-dynamic";

export default async function PageDonnees() {
  const active = sourceActive();
  const etats = await Promise.all(Object.values(SOURCES).map(async (s) => ({ nom: s.nom, etat: await s.disponible() })));
  const activites = await active.activites();
  const famille = await active.famille("fam-demo-1");
  const tranche = trancheDe(famille?.quotientFamilial ?? null, famille?.exterieur ?? false);
  // Réservable ou acquis : la frontière vient de la RÈGLE de la ville (jours de prévenance).
  const aReserver = activites.filter((a) => a.prevenance.joursAvant > 0);
  const annuels = activites.filter((a) => a.prevenance.joursAvant === 0);
  const decisionsParSemaine = aReserver.reduce((n, a) => n + a.joursServis.length, 0);
  const decisionsSiTout = activites.reduce((n, a) => n + a.joursServis.length, 0);
  const maintenant = new Date();
  const prochainLundi = (() => { const d = new Date(maintenant); d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7)); return d.toISOString().slice(0, 10); })();
  const prochainMercredi = (() => { const d = new Date(maintenant); d.setUTCDate(d.getUTCDate() + ((10 - d.getUTCDay()) % 7 || 7)); return d.toISOString().slice(0, 10); })();
  const cantine = activites.find((a) => a.type === "cantine")!;
  const alsh = activites.find((a) => a.type === "alsh_mercredi_journee")!;
  const fmtDate = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Données</h1>
          <p className="muted">L'adaptateur isole le front de la source : fictif aujourd'hui, export ou API Agora+ demain — sans toucher aux écrans.</p>
        </div>
        <span className="badge" data-tone="accent"><Database size={12} aria-hidden /> source active : {active.nom}</span>
      </div>

      <section className="carte pile">
        <h2>Les trois sources</h2>
        {etats.map((s) => (
          <div key={s.nom} className="rangee" style={{ alignItems: "flex-start" }}>
            {s.etat.ok ? <CheckCircle2 size={16} color="var(--ok)" aria-hidden /> : <XCircle size={16} color="var(--text-3)" aria-hidden />}
            <div style={{ minWidth: 0 }}>
              <strong>{s.nom}</strong>{s.nom === active.nom && <span className="badge" data-tone="accent" style={{ marginLeft: 8 }}>active</span>}
              <div className="muted">{s.etat.ok ? "Disponible — jeu de données du démonstrateur (familles fictives, règles et tarifs réels de Villiers)" : s.etat.cause}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="tuiles">
        <div className="tuile"><span className="muted">Écoles (réelles)</span><span className="tuile-chiffre">{FICTIF_STATS.ecoles}</span><span className="tiny">accueils périscolaires, villiers94.fr</span></div>
        <div className="tuile"><span className="muted">Activités tarifées (réelles)</span><span className="tuile-chiffre">{FICTIF_STATS.activites}</span><span className="tiny">grille 2025-2026, 10 tranches</span></div>
        <div className="tuile"><span className="muted">Familles / enfants (fictifs)</span><span className="tuile-chiffre">{FICTIF_STATS.familles} / {FICTIF_STATS.enfants}</span><span className="tiny">jamais présentés comme réels</span></div>
      </div>

      <section className="carte pile">
        <h2>Ce que le code répond — famille témoin A (QF {famille?.quotientFamilial}, tranche {tranche})</h2>
        <div className="backlog-ligne">
          <strong>{cantine.libelle} — {fmtDate.format(new Date(prochainLundi + "T12:00:00Z"))}</strong>
          <span className="muted">{verdictDelai(cantine, prochainLundi, maintenant).libelle}</span>
          <span className="tiny">Tarif tranche {tranche} : {euros(tarif(cantine, tranche))} · non réservé : {euros(tarifNonReserve(cantine, tranche, famille?.quotientFamilial !== null))} · sans QF calculé : tranche 9, repas non réservé {euros(1102)}</span>
        </div>
        <div className="backlog-ligne">
          <strong>{alsh.libelle} — {fmtDate.format(new Date(prochainMercredi + "T12:00:00Z"))}</strong>
          <span className="muted">{verdictDelai(alsh, prochainMercredi, maintenant).libelle}</span>
          <span className="tiny">Tarif tranche {tranche} : {euros(tarif(alsh, tranche))} · réservé non consommé : ×2</span>
        </div>
        <p className="tiny">Chaque règle porte sa source (PDF tarifs 01/07/2025, guide 2025-2026). Écart relevé : la page web dit « 7 jours francs » pour le mercredi, le guide dit 24 h / 48 h — à trancher avec la ville.</p>
      </section>

      <SimulateurQF activites={activites} />

      {/* CE QUI SE DÉCIDE, CE QUI EST ACQUIS — la frontière n'est pas technique : c'est
          une règle de la ville, portée par `prevenance.joursAvant`. La voir en clair permet
          de poser la bonne question au service : « voulez-vous que l'étude se réserve ? ». */}
      <section className="carte pile">
        <h2>Ce qui se réserve, ce qui est à l&apos;année</h2>
        <p className="muted">
          {aReserver.length} service{aReserver.length > 1 ? "s" : ""} demande{aReserver.length > 1 ? "nt" : ""} une réservation, {annuels.length} {annuels.length > 1 ? "sont acquis" : "est acquis"} par l&apos;inscription annuelle.
          C&apos;est une règle de la commune, pas une limite du produit : rendre un service réservable ne demande que de poser un délai de prévenance.
        </p>
        <div className="doc"><div className="tableau-defile"><table style={{ minWidth: 620 }}>
          <thead><tr><th>Service</th><th>Régime</th><th>Décisions par semaine et par enfant</th><th>Ce que ça changerait</th></tr></thead>
          <tbody>
            {[...aReserver, ...annuels].map((a) => {
              const jours = a.joursServis.length;
              const reservable = a.prevenance.joursAvant > 0;
              return (
                <tr key={a.id}>
                  <td><strong>{a.libelle}</strong><div className="tiny">{a.joursServis.map((j) => ["", "lun", "mar", "mer", "jeu", "ven"][j]).join(" · ")}</div></td>
                  <td>{reservable ? <span className="badge" data-tone="accent">à réserver · {a.prevenance.joursAvant} j {a.prevenance.type}</span> : <span className="badge" data-tone="ok">inscription annuelle</span>}</td>
                  <td>{reservable ? `${jours} par semaine` : "aucune"}</td>
                  <td className="tiny">{reservable
                    ? "Facturé à la réservation ; non consommé reste dû, non réservé facturé ×2."
                    : `Le rendre réservable ajouterait ${jours} décision(s) hebdomadaires par enfant — et permettrait de facturer à la réservation plutôt qu'à la fréquentation constatée.`}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div></div>
        <p className="tiny">
          Total actuel : <strong>{decisionsParSemaine} décision(s) par semaine et par enfant</strong>. Si TOUS les services devenaient réservables, ce serait <strong>{decisionsSiTout}</strong> —
          soit {Math.round((decisionsSiTout / Math.max(1, decisionsParSemaine)) * 10) / 10} × plus de gestes demandés aux familles. À arbitrer avec le service, pas à décider ici.
        </p>
      </section>

      <section className="carte pile">
        <h2>Grille tarifaire 2025-2026 (réelle)</h2>
        <div className="doc"><div className="tableau-defile"><table style={{ minWidth: 760 }}>
          <thead><tr><th>Activité</th><th>Horaires</th>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => <th key={t}>T{t === 10 ? "ext." : t}</th>)}<th>Prévenance</th></tr></thead>
          <tbody>{activites.map((a) => (
            <tr key={a.id}><td><strong>{a.libelle}</strong>{a.forfaitMensuel && <div className="tiny">forfait mensuel dès {a.forfaitMensuel.declencheA} fréquentation(s)</div>}</td><td>{a.horaires}</td>{a.tarifsParTranche.map((m, i) => <td key={i}>{euros(m)}</td>)}<td className="tiny">{a.prevenance.joursAvant ? `${a.prevenance.joursAvant} j ${a.prevenance.type}` : "sans réservation"}</td></tr>
          ))}</tbody>
        </table></div></div>
      </section>

      <details className="carte">
        <summary>Les {ECOLES.length} écoles et leurs accueils</summary>
        <ul style={{ marginTop: 10, paddingLeft: 18, display: "grid", gap: 4 }}>{ECOLES.map((e) => <li key={e.nom}><strong>{e.nom}</strong> <span className="muted">— {e.adresse} · {e.niveau}</span></li>)}</ul>
      </details>
    </>
  );
}
