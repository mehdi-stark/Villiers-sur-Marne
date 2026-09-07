import type { Metadata } from "next";
import { AlertTriangle, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { etatSecurite } from "@/lib/systeme";

export const metadata: Metadata = { title: "Sécurité" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });
const APPS: Record<string, string> = { cockpit: "Cockpit", famille: "Portail famille", agents: "Back-office agents" };
// Aucun code technique à l'écran : chaque événement porte une phrase (règle du projet).
const EVENEMENTS: Record<string, { libelle: string; ton?: "ok" | "warn" | "danger" }> = {
  connexion: { libelle: "connexion réussie", ton: "ok" },
  otp_envoye: { libelle: "code envoyé" },
  otp_refuse: { libelle: "code refusé", ton: "warn" },
  envoi_echec: { libelle: "envoi impossible", ton: "danger" },
  passkey_activee: { libelle: "appareil de confiance ajouté (Face ID / Touch ID)", ton: "ok" },
  passkey_revoquee: { libelle: "appareil de confiance révoqué", ton: "warn" },
  export_securite: { libelle: "export nominatif du journal", ton: "warn" },
  presentation: { libelle: "ouverture d'un lien de démonstration" },
};

/** Un événement inconnu ne s'affiche pas en `snake_case` : on le rend lisible. */
const humaniser = (code: string) => code.replace(/_/g, " ");

/** CE QUI SE PASSE À LA PORTE. Les adresses sont masquées : on regarde un COMPORTEMENT
 *  (rafales, échecs d'envoi, appareils enregistrés), pas qui se connecte. */
export default async function Securite() {
  const s = await etatSecurite();
  const total = s.parApp.reduce((a, x) => ({ connexions: a.connexions + x.connexions, envois: a.envois + x.envois, refus: a.refus + x.refus, echecs: a.echecs + x.echecs }), { connexions: 0, envois: 0, refus: 0, echecs: 0 });

  return (
    <>
      <div className="page-tete">
        <div>
          <h1>Sécurité</h1>
          <p className="muted">Sept jours à la porte : codes envoyés, refusés, connexions, appareils de confiance. Les adresses sont masquées — on regarde un comportement, pas des personnes.</p>
        </div>
        <span className="badge" data-tone={s.martelements.length ? "warn" : "ok"}>{s.martelements.length ? `${s.martelements.length} rafale(s) signalée(s)` : "aucune rafale signalée"}</span>
      </div>

      {total.echecs > 0 && (
        <div className="bandeau" data-tone="danger" role="status">
          <AlertTriangle size={16} aria-hidden />
          <div><strong>{total.echecs} envoi{total.echecs > 1 ? "s" : ""} d&apos;e-mail impossible{total.echecs > 1 ? "s" : ""}</strong><div className="mini t-2">Un code qui ne part pas est une porte fermée : vérifiez la clé Resend et l&apos;expéditeur dans la page Système.</div></div>
        </div>
      )}

      <section className="pile">
        <h2>Par application</h2>
        <div className="grille-tuiles">
          {s.parApp.length === 0 ? <p className="mini t-3">Aucune tentative de connexion sur les sept derniers jours.</p> : s.parApp.map((a) => (
            <article key={a.app} className="carte pile" style={{ gap: 8 }}>
              <strong>{APPS[a.app] ?? a.app}</strong>
              <div className="systeme-volumes">
                <div className="systeme-volume"><b>{a.connexions}</b><span>connexions</span></div>
                <div className="systeme-volume"><b>{a.envois}</b><span>codes envoyés</span></div>
                <div className="systeme-volume"><b>{a.refus}</b><span>codes refusés</span></div>
                {a.echecs > 0 && <div className="systeme-volume"><b>{a.echecs}</b><span>envois impossibles</span></div>}
              </div>
              {a.envois > 0 && (
                <p className="mini t-3">
                  {Math.round((a.connexions / a.envois) * 100)} % des codes envoyés ont abouti à une connexion.
                  {a.refus > a.connexions && " Plus de refus que de connexions : code mal saisi, expiré, ou tentative."}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      {s.martelements.length > 0 && (
        <section className="pile">
          <h2>Rafales bloquées</h2>
          <div className="carte pile">
            {s.martelements.map((m, i) => (
              <div key={i} className="ligne" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                <span className="badge" data-tone="warn">quota</span>
                <div><strong>{m.message}</strong><div className="tiny"><code>{m.code}</code></div></div>
                <span className="tiny">{fmt.format(m.creeLe)}</span>
              </div>
            ))}
            <p className="tiny">Une rafale est bloquée AVANT la base : ni e-mail ni requête ne sont dépensés. Une seule alerte est posée par quart d&apos;heure et par application — sinon l&apos;attaque paierait sa propre trace.</p>
          </div>
        </section>
      )}

      <section className="pile">
        <h2>Les 25 derniers événements</h2>
        <div className="carte pile" style={{ gap: 4 }}>
          {s.recents.length === 0 ? <p className="mini t-3">Rien à afficher.</p> : s.recents.map((r, i) => {
            const e = EVENEMENTS[r.evenement] ?? { libelle: humaniser(r.evenement) };
            return (
              <div key={i} className="ligne" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                <span className="badge" data-tone={e.ton}>{APPS[r.app] ?? r.app}</span>
                <div><strong>{e.libelle}</strong><div className="tiny">{r.email}{r.detail?.cause ? ` · ${String(r.detail.cause).slice(0, 70)}` : ""}</div></div>
                <span className="tiny">{fmt.format(r.creeLe)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pile">
        <h2>Appareils de confiance</h2>
        <div className="carte pile" style={{ gap: 4 }}>
          <div className="rangee" style={{ alignItems: "center", gap: 10 }}>
            <span className="icone-ronde" aria-hidden><KeyRound size={16} /></span>
            <div style={{ flex: "1 1 auto" }}><strong>{s.appareils.length} passkey{s.appareils.length > 1 ? "s" : ""} enregistrée{s.appareils.length > 1 ? "s" : ""}</strong><div className="mini t-3">Face ID / Touch ID. Chaque titulaire révoque les siennes depuis sa page « Appareils ».</div></div>
          </div>
          {s.appareils.map((a, i) => (
            <div key={i} className="ligne" style={{ gridTemplateColumns: "auto 1fr auto" }}>
              <span className="icone-ronde" aria-hidden><Smartphone size={15} /></span>
              <div><strong>{a.appareil ?? "appareil inconnu"}</strong><div className="tiny">{APPS[a.app] ?? a.app} · {a.email}</div></div>
              <span className="tiny">{a.dernierUsageLe ? `utilisée ${fmt.format(a.dernierUsageLe)}` : `ajoutée ${fmt.format(a.creeLe)}`}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pile">
        <h2>Export pour un audit</h2>
        <div className="carte pile">
          <p className="mini t-2">
            Une mairie demandera des preuves d&apos;accès lors d&apos;un audit ou d&apos;une demande de droit d&apos;accès.
            L&apos;export <b>masqué</b> suffit à prouver un comportement ; l&apos;export <b>nominatif</b> est réservé
            aux cas qui l&apos;exigent — il est lui-même journalisé, avec la date et le demandeur.
          </p>
          <div className="rangee">
            <a className="bouton bouton-sm" href="/api/securite/export?jours=30">Export 30 jours (masqué)</a>
            <a className="bouton bouton-sm" data-variant="discret" href="/api/securite/export?jours=90">90 jours (masqué)</a>
            <a className="bouton bouton-sm" data-variant="danger" href="/api/securite/export?jours=30&complet=1">30 jours nominatif — tracé</a>
          </div>
          <p className="tiny">CSV point-virgule, horodatage Europe/Paris, 5 000 lignes au plus. Rien ne sort sans session du cockpit.</p>
        </div>
      </section>

      <div className="carte pile">
        <div className="rangee" style={{ alignItems: "center", gap: 10 }}>
          <span className="icone-ronde" aria-hidden><ShieldCheck size={16} /></span>
          <div><strong>Ce qui protège la porte</strong></div>
        </div>
        <ul className="vitrine-liste">
          <li>Un code ne part JAMAIS vers une adresse qui n&apos;est pas rattachée à un dossier (ou à la liste blanche, pour le cockpit et les agents).</li>
          <li>Avant même cette vérification : format de l&apos;adresse, quota par IP (10 / 10 min), quota par adresse (5 / h), autorisation en cache — la base n&apos;est atteinte qu&apos;après.</li>
          <li>La réponse est identique pour une adresse connue ou non, y compris en temps (délai plancher de 350 ms) : la latence ne dit pas ce que le corps tait.</li>
          <li>20 essais de code par IP en 10 minutes, puis refus d&apos;office.</li>
          <li>Code haché (jamais stocké en clair), 10 minutes, 5 essais ; sessions signées, propres à chaque application.</li>
        </ul>
        <p className="mini t-3">Détail et limites assumées : <code>docs/planning/AUDIT_PROD.md</code>, section « Garde d&apos;entrée de la connexion ».</p>
      </div>
    </>
  );
}
