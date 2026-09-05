import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Check, Clock, FileText, Receipt, ShieldCheck, Smartphone } from "lucide-react";
import { commune } from "@ville/core/communes";
import { ACTIVITES, ECOLES } from "@ville/core/donnees/fictif";
import { euros, tarif } from "@ville/core/donnees/regles";
import { service } from "@ville/core/donnees/services";
import { VisiteGuidee } from "@/components/visite";
import { demonstrationActive, jetonDemo } from "@ville/core/demonstration";

// PAGE PUBLIQUE de démonstration — le support de vente : ce que la commune verrait.
// Aucune donnée réelle de famille, et une mention sans ambiguïté sur son caractère non officiel.
export const metadata: Metadata = { title: "Découvrir le portail", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const c = commune(process.env.COMMUNE_ID);
const ARGUMENTS = [
  { Icone: CalendarDays, titre: "La semaine, service par service", texte: "Une ligne par service — pause méridienne, accueils, loisirs — avec son horaire, son tarif de tranche et l'état de chaque jour. Un tap réserve ou annule." },
  { Icone: Clock, titre: "Le délai, calculé et dit", texte: "« Modifiable jusqu'au lundi 23 h 59 » plutôt que « contactez les services ». Hors délai, la case est grisée et explique pourquoi." },
  { Icone: Receipt, titre: "La facture qui se comprend", texte: "Calculée depuis les pointages : présences, forfaits mensuels, réservé non consommé. Paiement PayFIP, attestation en un tap." },
  { Icone: FileText, titre: "Les démarches, pièces comprises", texte: "Inscription, quotient familial, coordonnées : les pièces se photographient, l'agent valide ou demande une correction motivée." },
  { Icone: Smartphone, titre: "Installable, notifications utiles", texte: "Le portail s'installe sur l'écran d'accueil. Un rappel par semaine s'il reste des créneaux — jamais un message par repas." },
  { Icone: ShieldCheck, titre: "Sécurité et accessibilité", texte: "Code à usage unique, Face ID en option, appareils révocables, journal des accès. Contrastes vérifiés, mobile d'abord." },
];

export default async function Decouvrir() {
  const ouvert = demonstrationActive();
  const jeton = ouvert.ok ? await jetonDemo("demo@exemple.invalid") : null;
  const agents = process.env.AGENTS_URL ?? "https://villiers-agents.vercel.app";
  const cantine = ACTIVITES.find((a) => a.type === "cantine")!;
  return (
    <div className="vitrine">
      <VisiteGuidee />
      <section className="vitrine-hero">
        <img src="/logo-villiers.svg" alt="Ville de Villiers-sur-Marne" className="vitrine-logo" />
        <h1>Le portail famille que les parents ouvrent le soir, sur leur téléphone</h1>
        <p className="vitrine-accroche">Réserver la cantine, payer, suivre un dossier : trois gestes, pas trois appels à l'accueil. Conçu sur les tarifs et les délais réels de la commune.</p>
        <div className="rangee">
          <a className="bouton bouton-lg" data-variant="primaire" href={jeton ? `/presentation?demo=${jeton}` : "/connexion"}>Ouvrir la démonstration</a>
          <a className="bouton bouton-lg" href="/decouvrir/dossier.pdf" target="_blank" rel="noopener">Le dossier (PDF, 2 pages)</a>
        </div>
        <div className="vitrine-chiffres">
          <div><b>{ECOLES.length}</b><span>écoles et leurs accueils</span></div>
          <div><b>10</b><span>tranches de quotient familial</span></div>
          <div><b>{euros(tarif(cantine, 1))} – {euros(tarif(cantine, 9))}</b><span>le repas, selon le quotient</span></div>
          <div><b>7 j</b><span>francs de délai, calculés par le code</span></div>
        </div>
      </section>

      <section className="portes">
        <h2>Trois façons de regarder</h2>
        <div className="portes-grille">
          <a className="porte" href={jeton ? `/presentation?demo=${jeton}` : "/connexion"}>
            <span className="porte-num">1</span>
            <strong>Côté parent</strong>
            <span className="petit t-2">La semaine, les factures, une démarche — sur un dossier fictif, sans code à saisir.</span>
            <span className="porte-action">Ouvrir le portail →</span>
          </a>
          <a className="porte" href={jeton ? `${agents}/presentation?demo=${jeton}` : agents} target="_blank" rel="noopener">
            <span className="porte-num">2</span>
            <strong>Côté agents</strong>
            <span className="petit t-2">La file du jour, le pointage, les démarches à valider — ce que vos équipes utiliseraient.</span>
            <span className="porte-action">Ouvrir le back-office →</span>
          </a>
          <a className="porte" href="/decouvrir/dossier.pdf" target="_blank" rel="noopener">
            <span className="porte-num">3</span>
            <strong>Le dossier</strong>
            <span className="petit t-2">Deux pages : le constat sur l'existant, ce qu'on apporte, les chiffres et le cadre.</span>
            <span className="porte-action">Ouvrir le PDF →</span>
          </a>
        </div>
        {!ouvert.ok && <p className="mini t-3">Accès direct fermé ({ouvert.cause}) — la démonstration reste accessible par code.</p>}
      </section>

      <section className="vitrine-grille">
        {ARGUMENTS.map(({ Icone, titre, texte }) => (
          <article key={titre} className="carte pile">
            <span className="icone-ronde" aria-hidden><Icone size={20} /></span>
            <h2>{titre}</h2>
            <p className="petit t-2">{texte}</p>
          </article>
        ))}
      </section>

      <section className="institutionnel pile">
        <h2 style={{ color: "#fff" }}>Ce que la commune garde</h2>
        <ul className="vitrine-liste">
          <li><Check size={16} aria-hidden /> Les tarifs, les délais et les règles de la ville — repris tels quels, sources citées.</li>
          <li><Check size={16} aria-hidden /> Le paiement par PayFIP, seul moyen légal pour une régie.</li>
          <li><Check size={16} aria-hidden /> Les données hébergées en Europe, une base par commune, aucun mot de passe stocké.</li>
          <li><Check size={16} aria-hidden /> Un back-office agents : file du jour, pointage, démarches à valider.</li>
        </ul>
      </section>

      <section className="carte pile">
        <h2>Une commune, une identité</h2>
        <p className="petit t-2">La charte se lit dans un fichier : couleurs, police, logo, coordonnées. Les treize communes d'Infocom'94 partagent le même moteur, chacune garde son image.</p>
        <div className="identites">
          <div className="identite" style={{ "--i-accent": "#4a7411", "--i-inst": "#015f89", "--i-fond": "#f4f0eb" } as React.CSSProperties}>
            <span className="identite-bandeau" />
            <strong>Villiers-sur-Marne</strong>
            <div className="identite-jetons"><span style={{ background: "#4a7411" }} /><span style={{ background: "#71b21a" }} /><span style={{ background: "#015f89" }} /><span style={{ background: "#ef984b" }} /></div>
            <span className="mini t-3">Relevé dans la charte du site officiel · police Exo</span>
          </div>
          <div className="identite" style={{ "--i-accent": "#2f5bea", "--i-inst": "#1f3a93", "--i-fond": "#f4f5f9" } as React.CSSProperties}>
            <span className="identite-bandeau" />
            <strong>Une autre commune</strong>
            <div className="identite-jetons"><span style={{ background: "#2f5bea" }} /><span style={{ background: "#6d8cff" }} /><span style={{ background: "#1f3a93" }} /><span style={{ background: "#d9772a" }} /></div>
            <span className="mini t-3">Même produit, autre charte — une entrée dans le fichier des communes</span>
          </div>
        </div>
      </section>

      <section className="carte pile">
        <h2>Les services couverts</h2>
        <div className="vitrine-services">
          {ACTIVITES.map((a) => (
            <div key={a.id} className="vitrine-service" data-ton={service(a).ton}>
              <strong>{service(a).nom}</strong>
              <span className="mini t-2">{a.horaires}</span>
              <span className="mini t-3">{a.prevenance.joursAvant ? `${a.prevenance.joursAvant} j ${a.prevenance.type} de délai` : "sans réservation"}</span>
            </div>
          ))}
        </div>
        <p className="mini t-3">Grille tarifaire 2025-2026 et délais du guide périscolaire de la ville. {c.mentionLogo}</p>
      </section>
    </div>
  );
}
