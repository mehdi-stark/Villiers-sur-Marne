import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { familleCourante } from "@/lib/session";
import { trancheDe } from "@ville/core/donnees/regles";
import { ActiverNotifications } from "@ville/core/ui/push";
import { BasculeTheme } from "@ville/ui/theme";
import { Retour } from "@/components/retour";

export const metadata: Metadata = { title: "Réglages" };
export const dynamic = "force-dynamic";

export default async function Reglages() {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const tranche = trancheDe(f.famille.quotientFamilial, f.famille.exterieur);
  return (
    <>
      <Retour vers="/" libelle="Ma semaine" />
      <div className="page-tete"><div><span className="salut">{f.famille.nom}</span><h1>Réglages</h1><p className="petit t-2">Votre dossier, vos notifications, l'apparence de l'application.</p></div></div>

      <section className="carte pile">
        <h2>Mon dossier</h2>
        <div className="backlog-meta">
          <span><b>Compte</b>{f.email}</span>
          <span><b>Commune</b>{f.commune.nom}</span>
          <span><b>Quotient familial</b>{f.famille.quotientFamilial ?? "non calculé"}</span>
          <span><b>Tranche</b>{tranche}{f.famille.exterieur ? " (extérieurs)" : ""}</span>
        </div>
        {f.famille.quotientFamilial === null && (
          <div className="bandeau" data-tone="warn"><div><strong>Sans quotient calculé, la tranche 9 s'applique</strong><div className="mini t-2">C'est le tarif maximal, sans rétroactivité. <Link href="/demarches/nouvelle?type=quotient_familial">Faire calculer mon quotient</Link>.</div></div></div>
        )}
        <Link className="bouton" href="/demarches/nouvelle?type=coordonnees">Changer mes coordonnées</Link>
      </section>

      <section className="carte pile">
        <h2>Notifications</h2>
        <p className="petit t-2">Un rappel par semaine, seulement s'il reste des créneaux à réserver — et une notification quand une démarche avance. Rien d'autre.</p>
        <ActiverNotifications texte="Activer les notifications sur cet appareil" />
      </section>

      <section className="carte pile">
        <h2>Apparence</h2>
        <p className="petit t-2">Clair, sombre, ou selon les réglages de votre téléphone.</p>
        <BasculeTheme />
      </section>

      <section className="carte pile">
        <h2>Aide</h2>
        <p className="petit t-2">Espace Accueil et Facturation — Parc de la Mairie, rue de l'Hôtel de Ville. Téléphone : <a href={`tel:${f.commune.telephoneAccueil.replace(/\s/g, "")}`}>{f.commune.telephoneAccueil}</a>.</p>
      </section>
    </>
  );
}
