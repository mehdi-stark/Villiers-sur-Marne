import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { alertesOuvertes } from "@ville/core/alertes";
import { origineBase } from "@ville/core/db";
import { compteurs, decisionsPrises } from "@/lib/decisions";
import { backlogOuvert, extraireBacklog, extraireDecisions, lireDoc } from "@/lib/docs";
import { analyse } from "@/lib/marche";
import { etatApplications, historiqueDispo, regionLointaine } from "@/lib/systeme";

import { ActiverFaceId } from "@ville/core/ui/passkeys";
import { TuileChiffre } from "@ville/ui";

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
  // L'état du système en une ligne, sur le PREMIER écran : sans ça, il faut aller le
  // chercher. Les appels sont bornés (6 s) et le tableau de bord reste lisible s'ils
  // échouent — un pilotage ne tombe pas parce qu'une sonde ne répond pas.
  const [apps, dispo] = await Promise.all([
    etatApplications().catch(() => []),
    historiqueDispo(7).catch(() => []),
  ]);
  const enLigne = apps.filter((a) => a.enLigne).length;
  const manquantes = apps.reduce((n, a) => n + (a.sante?.manquantes.length ?? 0), 0);
  const lointaines = apps.filter((a) => regionLointaine(a.sante?.region ?? null)).length;
  const pannes = dispo.filter((d) => d.statut === "erreur").length;
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
      <ActiverFaceId cle="ville-passkey" />

      {alertes.map((a) => (
        <div key={a.id} className="bandeau" data-tone={a.niveau === "critique" ? "danger" : "warn"} role="alert">
          <AlertTriangle size={16} aria-hidden />
          <div>
            <strong>{a.message}</strong>
            <div className="tiny">Alerte « {a.code} » depuis le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(a.creeLe)} (Paris). Elle se ferme seule quand la cause disparaît.</div>
          </div>
        </div>
      ))}

      {/* Santé du système — la question « est-ce que tout tourne ? » se répond ici. */}
      <div className="sante-rapide">
        <Link className="sante-puce" href="/pilotage/systeme" data-etat={apps.length === 0 ? "inconnu" : enLigne === apps.length ? "ok" : "danger"}>
          <span className="sante-point" aria-hidden />
          <span><b>{apps.length === 0 ? "État inconnu" : `${enLigne}/${apps.length} applications en ligne`}</b><small>{apps.length === 0 ? "sondes injoignables" : apps.map((a) => a.nom.replace("Back-office ", "")).join(" · ")}</small></span>
        </Link>
        <Link className="sante-puce" href="/pilotage/systeme" data-etat={manquantes + lointaines === 0 ? "ok" : "warn"}>
          <span className="sante-point" aria-hidden />
          <span><b>{manquantes + lointaines === 0 ? "Configuration saine" : `${manquantes + lointaines} point(s) à corriger`}</b><small>{manquantes ? `${manquantes} variable(s) manquante(s)` : "variables complètes"}{lointaines ? ` · ${lointaines} app loin de la base` : ""}</small></span>
        </Link>
        <Link className="sante-puce" href="/pilotage/securite" data-etat={alertes.length === 0 && pannes === 0 ? "ok" : "warn"}>
          <span className="sante-point" aria-hidden />
          <span><b>{alertes.length === 0 ? "Aucune alerte ouverte" : `${alertes.length} alerte(s) ouverte(s)`}</b><small>{pannes === 0 ? "aucune panne sur 7 jours" : `${pannes} jour(s) avec panne sur 7`}</small></span>
        </Link>
      </div>

      <div className="tuiles">
        <TuileChiffre href="/pilotage/cadrage" libelle="Cadrage" valeur={restCadrage} tone={restCadrage ? "warn" : "ok"} detail={`${restCadrage ? "décisions à trancher" : "tout est tranché"} · ${dCadrage.length - restCadrage}/${dCadrage.length} prises`} />
        <TuileChiffre href="/pilotage/marche" libelle="Marché" valeur={marche.score} suffixe="/100" tone={marche.final === "GO" ? "ok" : marche.final === "NO-GO" ? "danger" : "warn"} detail={`${marche.final}${marcheTranche ? " · tranché" : " · à trancher"}`} />
        <TuileChiffre href="/pilotage/backlog" libelle="Backlog" valeur={restBacklog} detail={`${restBacklog ? "items à trancher" : "rien en attente"} · ${dBacklog.length} au total`} />
        <TuileChiffre href="/pilotage/decisions" libelle="À reporter par l'agent" valeur={cpt.aReporter} detail="prises ici, pas encore dans les documents" />
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
