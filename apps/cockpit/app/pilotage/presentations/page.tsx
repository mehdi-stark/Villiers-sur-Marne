import type { Metadata } from "next";
import { Eye } from "lucide-react";
import { presentations } from "@ville/core/demo-seed";
import { EtatVide, IlluFile } from "@ville/ui";

export const metadata: Metadata = { title: "Présentations" };
export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Paris" });
const APP: Record<string, string> = { famille: "Portail famille", agents: "Back-office agents" };

/** Qui a ouvert un lien de présentation, et quand — pour relancer à bon escient. */
export default async function Presentations() {
  const lignes = await presentations(40).catch(() => []);
  const parJour = new Map<string, typeof lignes>();
  for (const l of lignes) {
    const j = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(l.creeLe);
    parJour.set(j, [...(parJour.get(j) ?? []), l]);
  }
  return (
    <>
      <div className="page-tete">
        <div><h1>Présentations</h1><p className="muted">Chaque ouverture d'un lien de démonstration, avec son application et son appareil. C'est ce qui dit si un rendez-vous a été préparé.</p></div>
        <span className="badge" data-tone={lignes.length ? "accent" : undefined}>{lignes.length} ouverture{lignes.length > 1 ? "s" : ""}</span>
      </div>
      {lignes.length === 0 ? (
        <EtatVide illustration={<IlluFile />} titre="Aucun lien de présentation ouvert" enfants="Fabriquez-en un avec « node scripts/lien-presentation.mjs » depuis apps/famille, puis envoyez-le. Chaque ouverture apparaîtra ici." />
      ) : (
        [...parJour].map(([jour, lot]) => (
          <section key={jour} className="carte pile">
            <h2>{fmt.format(new Date(`${jour}T12:00:00Z`)).replace(/ à .*/, "")}</h2>
            <div className="pile" style={{ gap: 6 }}>
              {lot.map((l) => {
                const d = (l.detail ?? {}) as { agent?: string };
                const mobile = /iPhone|Android|iPad/i.test(d.agent ?? "");
                return (
                  <div key={l.id} className="ligne" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                    <span className="icone-ronde" aria-hidden><Eye size={16} /></span>
                    <div><strong>{APP[l.app] ?? l.app}</strong><div className="tiny">{mobile ? "sur téléphone" : "sur ordinateur"} · {(d.agent ?? "appareil inconnu").slice(0, 60)}</div></div>
                    <span className="tiny">{new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Europe/Paris" }).format(l.creeLe)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
      <p className="tiny">Les liens expirent au bout de 2 h et n'ouvrent que des données fictives. Aucune donnée personnelle n'est collectée ici : seuls l'application, l'heure et le type d'appareil.</p>
    </>
  );
}
