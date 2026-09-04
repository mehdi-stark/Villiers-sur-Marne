import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { familleCourante } from "@/lib/session";
import { trancheDe } from "@ville/core/donnees/regles";

export const metadata: Metadata = { title: "Mes enfants" };
export const dynamic = "force-dynamic";

export default async function Enfants() {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const enfants = await f.source.enfants(f.famille.id);
  const tranche = trancheDe(f.famille.quotientFamilial, f.famille.exterieur);
  return (
    <>
      <div className="page-tete"><div><h1>Mes enfants</h1><p className="muted">{f.famille.nom} · quotient familial {f.famille.quotientFamilial ?? "non calculé"} · tranche {tranche}</p></div></div>
      {f.famille.quotientFamilial === null && (
        <div className="bandeau" data-tone="warn"><div><strong>Quotient familial non calculé : la tranche 9 s'applique</strong><div className="tiny">Faites-le calculer à l'Espace Accueil et Facturation ({f.commune.telephoneAccueil}) — aucune rétroactivité, prise en compte le mois suivant.</div></div></div>
      )}
      <div className="semaine">
        {enfants.map((e) => (
          <section key={e.id} className="carte enfant-carte">
            <div className="enfant-tete"><span className="avatar" aria-hidden>{e.prenom.slice(0, 1)}</span><div><strong>{e.prenom}</strong><div className="tiny">né(e) le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(e.naissance))}</div></div></div>
            <div className="backlog-meta"><span><b>École</b>{e.ecole}</span><span><b>Classe</b>{e.classe}</span></div>
          </section>
        ))}
      </div>
      <p className="tiny">Dossier, pièces et démarches (inscription, changement d'école, PAI) : prochains maillons.</p>
    </>
  );
}
