import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { alertesOuvertes } from "@ville/core/alertes";
import { origineBase } from "@ville/core/db";
import { compteurs, decisionsPrises } from "@/lib/decisions";
import { backlogOuvert, extraireBacklog, extraireDecisions, lireDoc } from "@/lib/docs";
import { analyse } from "@/lib/marche";

export const dynamic = "force-dynamic";

// Les 8 étapes de la trame (0 → 7) et leur état — c'est la « page pipeline »
// du projet, mise à jour à chaque maillon.
const ETAPES: { n: string; titre: string; etat: "fait" | "cours" | "attente"; detail: string }[] = [
  { n: "0", titre: "Squelette du cockpit", etat: "fait", detail: "App, jetons, responsive, OTP, décisions en base, PWA, push" },
  { n: "1", titre: "Cadrage", etat: "cours", detail: "Rédigé — 7 décisions à trancher" },
  { n: "2", titre: "Analyse de marché", etat: "cours", detail: "Verdict calculé — à trancher" },
  { n: "3", titre: "Architecture & outils", etat: "attente", detail: "Après le verdict marché" },
  { n: "4", titre: "CLAUDE.md + plan d'exécution", etat: "attente", detail: "" },
  { n: "5", titre: "Squelette complet (CI, PWA, cron, jobs, alertes)", etat: "attente", detail: "" },
  { n: "6", titre: "Premier maillon métier", etat: "attente", detail: "Testé en réel, capturé, commité" },
];

export default async function Accueil() {
  const [cadrageMd, backlogMd, prisesCadrage, prisesBacklog, prisesMarche, cpt, alertes] = await Promise.all([
    lireDoc("CADRAGE.md"),
    lireDoc("BACKLOG.md"),
    decisionsPrises("cadrage"),
    decisionsPrises("backlog"),
    decisionsPrises("marche"),
    compteurs(),
    alertesOuvertes(),
  ]);
  const marche = analyse();
  const marcheTranche = prisesMarche.has("marche:verdict");
  const dCadrage = extraireDecisions(cadrageMd);
  const dBacklog = extraireBacklog(backlogMd);
  const restCadrage = dCadrage.filter((d) => !prisesCadrage.has(d.cle)).length;
  const restBacklog = dBacklog.filter((d) => !prisesBacklog.has(d.cle) && backlogOuvert(d)).length;
  const base = origineBase();

  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Pilotage</h1>
          <p className="muted">Ville — portail famille de nouvelle génération pour Villiers-sur-Marne. Étapes 1-2/7 : cadrage et marché à trancher.</p>
        </div>
      </div>

      {alertes.map((a) => (
        <div key={a.id} className="bandeau" data-tone={a.niveau === "critique" ? "danger" : "warn"} role="alert">
          <AlertTriangle size={16} aria-hidden />
          <div>
            <strong>{a.message}</strong>
            <div className="tiny">Alerte « {a.code} » depuis le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(a.creeLe)} (Paris). Elle se ferme seule quand la cause disparaît.</div>
          </div>
        </div>
      ))}

      <div className="tuiles">
        <Link href="/pilotage/cadrage" className="tuile">
          <span className="muted">Cadrage</span>
          <span className="tuile-chiffre">{restCadrage}</span>
          <span className="tiny">{restCadrage ? "décisions à trancher" : "tout est tranché"} · {dCadrage.length - restCadrage}/{dCadrage.length} prises</span>
        </Link>
        <Link href="/pilotage/marche" className="tuile">
          <span className="muted">Marché</span>
          <span className="tuile-chiffre">{marche.score}<span className="muted" style={{ fontSize: 14 }}>/100</span></span>
          <span className="tiny">{marche.final}{marcheTranche ? " · tranché" : " · à trancher"}</span>
        </Link>
        <Link href="/pilotage/backlog" className="tuile">
          <span className="muted">Backlog</span>
          <span className="tuile-chiffre">{restBacklog}</span>
          <span className="tiny">{restBacklog ? "items à trancher" : "rien en attente"} · {dBacklog.length} au total</span>
        </Link>
        <Link href="/pilotage/decisions" className="tuile">
          <span className="muted">À reporter par l'agent</span>
          <span className="tuile-chiffre">{cpt.aReporter}</span>
          <span className="tiny">décisions prises ici, pas encore dans les documents</span>
        </Link>
      </div>

      <section className="carte">
        <h2 style={{ marginBottom: 6 }}>Où en est le projet</h2>
        <div className="etapes">
          {ETAPES.map((e) => (
            <div key={e.n} className="etape" data-etat={e.etat}>
              <span className="etape-num">{e.n}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{e.titre}</div>
                {e.detail && <div className="muted">{e.detail}</div>}
              </div>
              <span className="badge" data-tone={e.etat === "fait" ? "ok" : e.etat === "cours" ? "accent" : undefined}>
                {e.etat === "fait" ? "Fait" : e.etat === "cours" ? "En cours" : "À venir"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="tiny">Base {base.hebergeur}{base.region ? ` · ${base.region}` : ""} — une base par projet. Heures affichées en heure de Paris.</p>
    </>
  );
}
