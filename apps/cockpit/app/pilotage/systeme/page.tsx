import type { Metadata } from "next";
import { AlertTriangle, Check, Database, ExternalLink, GitBranch, Server, Terminal, X } from "lucide-react";
import { COMMANDES, COMPTES, etatApplications, etatAutomatismes, etatBase, regionLointaine } from "@/lib/systeme";

export const metadata: Metadata = { title: "Système" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });
const ilYA = (d: Date) => {
  const h = Math.round((Date.now() - d.getTime()) / 3600_000);
  return h < 1 ? "il y a moins d'une heure" : h < 48 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} jours`;
};

/** LA PAGE POUR REVENIR DANS UN MOIS : où tourne quoi, ce qui va bien, ce qui manque,
 *  et par quelle commande reprendre. Tout est lu à l'exécution — une fiche recopiée à la
 *  main ment au bout de trois semaines. */
export default async function Systeme() {
  const [apps, base, auto] = await Promise.all([
    etatApplications(),
    etatBase().catch(() => null),
    etatAutomatismes().catch(() => null),
  ]);
  const enPanne = apps.filter((a) => !a.enLigne).length;
  const manquantes = apps.flatMap((a) => (a.sante?.manquantes ?? []).map((v) => `${a.nom} : ${v}`));
  const lointaines = apps.filter((a) => regionLointaine(a.sante?.region ?? null));

  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Système</h1>
          <p className="muted">Où tourne quoi, ce qui va bien, ce qui manque, et par quelle commande reprendre. Relevé à l'instant — rien n'est recopié à la main.</p>
        </div>
        <span className="badge" data-tone={enPanne ? "danger" : "ok"}>{enPanne ? `${enPanne} application injoignable` : "3 applications en ligne"}</span>
      </div>

      {manquantes.length > 0 && (
        <div className="bandeau" data-tone="warn" role="status">
          <AlertTriangle size={16} aria-hidden />
          <div><strong>{manquantes.length} variable{manquantes.length > 1 ? "s" : ""} obligatoire{manquantes.length > 1 ? "s" : ""} absente{manquantes.length > 1 ? "s" : ""}</strong><div className="mini t-2">{manquantes.join(" · ")}</div></div>
        </div>
      )}

      {lointaines.length > 0 && (
        <div className="bandeau" data-tone="warn" role="status">
          <AlertTriangle size={16} aria-hidden />
          <div><strong>{lointaines.length} application{lointaines.length > 1 ? "s tournent" : " tourne"} loin de la base</strong><div className="mini t-2">{lointaines.map((a) => `${a.nom} (${a.sante?.region})`).join(" · ")} — la base Neon est à Francfort : chaque requête SQL traverse l'Atlantique. Posez <code>&quot;regions&quot;: [&quot;cdg1&quot;]</code> dans le <code>vercel.json</code> de l'app.</div></div>
        </div>
      )}

      {/* ---- Les trois applications ---- */}
      <section className="pile">
        <h2>Les trois applications</h2>
        <p className="mini t-3">Trois déploiements séparés, trois secrets de session. Jamais de cookie partagé entre elles.</p>
        {apps.map((a) => (
          <article key={a.cle} className="carte pile systeme-app">
            <div className="rangee" style={{ alignItems: "center", gap: 10 }}>
              <span className="icone-ronde" aria-hidden><Server size={16} /></span>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <strong>{a.nom}</strong>
                <div className="mini t-3">{a.role}</div>
              </div>
              <span className="badge" data-tone={a.enLigne ? "ok" : "danger"}>{a.enLigne ? `en ligne · ${a.latenceMs} ms` : a.codeHttp ? `HTTP ${a.codeHttp}` : "injoignable"}</span>
            </div>

            <div className="systeme-liens">
              <a className="bouton bouton-sm" href={a.url} target="_blank" rel="noreferrer">{a.url.replace("https://", "")} <ExternalLink size={13} aria-hidden /></a>
              {a.chemins.map((c) => <a key={c.chemin} className="bouton bouton-sm" data-variant="discret" href={`${a.url}${c.chemin}`} target="_blank" rel="noreferrer">{c.libelle}</a>)}
            </div>

            <dl className="systeme-faits">
              <div><dt>Projet Vercel</dt><dd>{a.projetVercel}</dd></div>
              <div><dt>En local</dt><dd>port {a.port}</dd></div>
              <div><dt>Déploiement</dt><dd>{a.sante?.version.commit ? `${a.sante.version.commit} (${a.sante.version.branche ?? "?"})` : "—"}</dd></div>
              <div><dt>Source de données</dt><dd>{a.sante ? a.sante.source : "—"}</dd></div>
              <div><dt>Région</dt><dd>{a.sante?.region ?? "—"}{regionLointaine(a.sante?.region ?? null) && " ⚠ loin de la base"}</dd></div>
            </dl>

            {a.sante ? (
              <details className="systeme-details">
                <summary>{a.sante.variables.filter((v) => v.posee).length} / {a.sante.variables.length} variables posées{a.sante.manquantes.length > 0 && ` — ${a.sante.manquantes.length} obligatoire(s) manquante(s)`}</summary>
                <div className="pile" style={{ marginTop: 10, gap: 4 }}>
                  {a.sante.variables.map((v) => (
                    <div key={v.nom} className="ligne" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                      <span className="systeme-etat" data-ok={v.posee || undefined} aria-hidden>{v.posee ? <Check size={12} /> : <X size={12} />}</span>
                      <div><code>{v.nom}</code><div className="tiny">{v.role}</div></div>
                      <span className="tiny">{v.posee ? "posée" : v.obligatoire ? "MANQUE" : "facultative"}</span>
                    </div>
                  ))}
                </div>
                <p className="tiny" style={{ marginTop: 8 }}>Aucune valeur n'est lisible ici : le rapport dit seulement si la variable existe. Il est servi par <code>/api/sante</code>, protégé par <code>SANTE_SECRET</code>.</p>
              </details>
            ) : (
              <p className="mini t-3">Rapport détaillé indisponible — {a.santeErreur}.</p>
            )}
          </article>
        ))}
      </section>

      {/* ---- La base ---- */}
      <section className="pile">
        <h2>La base de données</h2>
        {base ? (
          <div className="carte pile">
            <div className="rangee" style={{ alignItems: "center", gap: 10 }}>
              <span className="icone-ronde" aria-hidden><Database size={16} /></span>
              <div style={{ flex: "1 1 auto" }}>
                <strong>Neon — projet « ville », eu-central-1</strong>
                <div className="mini t-3">Une base par PROJET. Schéma unique dans <code>packages/core/db/schema.ts</code> ; migrations GÉNÉRÉES, jamais écrites à la main.</div>
              </div>
              <span className="badge" data-tone="ok">{base.tables} tables · {base.migrations} migrations</span>
            </div>
            {base.derniereMigration && <p className="mini t-3">Dernière migration appliquée le {base.derniereMigration}.</p>}
            <div className="systeme-volumes">
              {base.volumes.map((v) => <div key={v.table} className="systeme-volume"><b>{v.lignes}</b><span>{v.table}</span></div>)}
            </div>
          </div>
        ) : <p className="mini t-3">Base injoignable depuis le cockpit.</p>}
      </section>

      {/* ---- Automatismes ---- */}
      <section className="pile">
        <h2>Ce qui tourne tout seul</h2>
        {auto ? (
          <>
            <div className="carte pile">
              <div className="rangee" style={{ alignItems: "center", gap: 10 }}>
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <strong>Rappel hebdomadaire</strong>
                  <div className="mini t-3">{auto.cron.role}</div>
                </div>
                <span className="badge" data-tone={auto.cron.dernier?.statut === "ok" ? "ok" : auto.cron.dernier ? "warn" : undefined}>
                  {auto.cron.dernier ? auto.cron.dernier.statut : "jamais exécuté"}
                </span>
              </div>
              <dl className="systeme-faits">
                <div><dt>Cadence</dt><dd>{auto.cron.cadence}</dd></div>
                <div><dt>Ordonnanceur</dt><dd>{auto.cron.ordonnanceur}</dd></div>
                <div><dt>Dernier passage</dt><dd>{auto.cron.dernier ? `${fmt.format(auto.cron.dernier.debutLe)} (${ilYA(auto.cron.dernier.debutLe)})` : "—"}</dd></div>
                <div><dt>Résultat</dt><dd>{auto.cron.dernier?.resultat ? Object.entries(auto.cron.dernier.resultat).map(([k, v]) => `${k} : ${String(v)}`).join(" · ") : auto.cron.dernier?.erreur ?? "—"}</dd></div>
              </dl>
              <p className="tiny">Le silence est une panne : <code>?action=verifier</code> pose une alerte si la tâche se tait au-delà de deux fois sa cadence.</p>
            </div>

            <div className="carte pile">
              <strong>Notifications push</strong>
              <div className="systeme-volumes">
                {auto.pushParApp.length === 0 ? <span className="mini t-3">Aucun appareil abonné.</span> :
                  auto.pushParApp.map((p) => <div key={p.app} className="systeme-volume"><b>{p.abonnements}</b><span>{p.app}</span></div>)}
              </div>
            </div>

            <div className="carte pile">
              <strong>Alertes ouvertes</strong>
              {auto.alertesOuvertes.length === 0 ? (
                <p className="mini t-3">Aucune. Une alerte s'ouvre quand un e-mail ne part pas, qu'un cron échoue ou se tait.</p>
              ) : auto.alertesOuvertes.map((al) => (
                <div key={al.code} className="ligne" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                  <span className="badge" data-tone={al.niveau === "critique" ? "danger" : "warn"}>{al.niveau}</span>
                  <div><strong>{al.message}</strong><div className="tiny"><code>{al.code}</code></div></div>
                  <span className="tiny">{ilYA(al.creeLe)}</span>
                </div>
              ))}
            </div>
          </>
        ) : <p className="mini t-3">État des automatismes indisponible.</p>}
      </section>

      {/* ---- Comptes ---- */}
      <section className="pile">
        <h2>Les comptes qui portent le projet</h2>
        <p className="mini t-3">Sans eux, on ne reprend rien. Inventaire complet des variables : <code>docs/planning/ENV.md</code> (aucune valeur n'y figure).</p>
        <div className="carte pile">
          {COMPTES.map((c) => (
            <div key={c.service} className="ligne systeme-compte">
              <div>
                <strong>{c.service}</strong> — {c.ou ? <a href={c.ou} target="_blank" rel="noreferrer">{c.quoi}</a> : c.quoi}
                <div className="tiny">{c.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Commandes ---- */}
      <section className="pile">
        <h2>Reprendre en main</h2>
        <div className="carte pile">
          <div className="rangee" style={{ alignItems: "center", gap: 10 }}>
            <span className="icone-ronde" aria-hidden><Terminal size={16} /></span>
            <div><strong>Depuis <code>~/code/ville</code></strong><div className="mini t-3">La première commande d'une session est toujours <code>pnpm decisions</code>.</div></div>
          </div>
          {COMMANDES.map((c) => (
            <div key={c.commande} className="ligne systeme-commande">
              <code>{c.commande}</code>
              <span className="tiny">{c.role}</span>
            </div>
          ))}
          <div className="rangee">
            <a className="bouton bouton-sm" href="https://github.com/mehdi-stark/Villiers-sur-Marne" target="_blank" rel="noreferrer"><GitBranch size={14} aria-hidden /> Le dépôt</a>
            <a className="bouton bouton-sm" data-variant="discret" href="https://vercel.com/mehdi-starks-projects" target="_blank" rel="noreferrer">Vercel</a>
            <a className="bouton bouton-sm" data-variant="discret" href="https://console.neon.tech" target="_blank" rel="noreferrer">Neon</a>
          </div>
        </div>
      </section>
    </>
  );
}
