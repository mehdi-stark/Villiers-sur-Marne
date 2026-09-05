import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { demarchesDe, piecesDe } from "@ville/core/demarches";
import { ETATS, taille, TYPES, type Etat } from "@ville/core/demarches-definitions";
import { familleCourante } from "@/lib/session";
import { EtatVide, IlluFacture } from "@ville/ui";

export const metadata: Metadata = { title: "Démarches" };
export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });

export default async function Demarches() {
  const f = await familleCourante();
  if (!f) redirect("/connexion");
  const liste = await demarchesDe(f.famille.id);
  const pieces = await Promise.all(liste.map((d) => piecesDe(d.id)));
  return (
    <>
      <div className="page-tete">
        <div><span className="salut">{f.famille.nom}</span><h1>Mes démarches</h1><p className="petit t-2">Inscription, quotient familial, coordonnées — avec leurs pièces et leur avancement.</p></div>
        <Link className="bouton" data-variant="primaire" href="/demarches/nouvelle">Nouvelle démarche</Link>
      </div>
      {liste.length === 0 ? (
        <EtatVide illustration={<IlluFacture />} titre="Aucune démarche en cours" enfants={<>Commencez par l'inscription périscolaire ou le calcul du quotient familial — c'est lui qui détermine votre tarif. L'Espace Accueil et Facturation répond au {f.commune.telephoneAccueil}.</>} />
      ) : (
        <div className="pile">
          {liste.map((d, i) => {
            const e = ETATS[d.etat as Etat];
            return (
              <section key={d.id} className="carte pile">
                <div className="rangee" style={{ justifyContent: "space-between" }}>
                  <strong>{TYPES[d.type as keyof typeof TYPES]?.nom ?? d.type}</strong>
                  <span className="badge" data-tone={e.tone}>{e.libelle}</span>
                </div>
                <p className="petit t-2">{e.quoi}</p>
                {d.motif && <div className="bandeau" data-tone={d.etat === "refusee" ? "danger" : "accent"}><div><strong>Message de l'accueil</strong><div className="mini">{d.motif}</div></div></div>}
                <div className="backlog-meta">
                  <span><b>Envoyée</b>{fmt.format(d.creeLe)}</span>
                  <span><b>Mise à jour</b>{fmt.format(d.majLe)}</span>
                  <span><b>Pièces</b>{pieces[i]!.length}</span>
                </div>
                <details><summary>Pièces jointes</summary>
                  <div className="pile" style={{ marginTop: 8 }}>
                    {pieces[i]!.map((p) => <a key={p.id} className="ligne" style={{ gridTemplateColumns: "1fr auto" }} href={`/api/pieces/${p.id}`} target="_blank" rel="noopener"><span>{p.nom}</span><span className="mini t-3">{taille(p.taille)}</span></a>)}
                  </div>
                </details>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
