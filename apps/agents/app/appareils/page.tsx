import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { journalAcces, passkeysDe } from "@ville/core/passkeys";
import { ListeAppareils } from "@ville/core/ui/passkeys";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Appareils" };
export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });
const LIB: Record<string, string> = { connexion: "Connexion", otp_envoye: "Code envoyé", otp_refuse: "Code refusé", envoi_echec: "Envoi du code en échec", passkey_activee: "Face ID activé", passkey_revoquee: "Appareil révoqué" };

export default async function Appareils() {
  const s = await auth.verifierSession((await cookies()).get(auth.COOKIE)?.value);
  if (!s) redirect("/connexion");
  const [appareils, journal] = await Promise.all([passkeysDe(auth.app, s.email), journalAcces(auth.app, s.email)]);
  return (
    <>
      <div className="page-tete"><div><h1>Appareils de confiance</h1><p className="muted">{s.email} · Face ID / Touch ID par appareil, révocable ici. Le code par e-mail reste toujours possible.</p></div></div>
      <ListeAppareils appareils={appareils.map((a) => ({ id: a.id, appareil: a.appareil, creeLe: a.creeLe.toISOString(), dernierUsageLe: a.dernierUsageLe?.toISOString() ?? null }))} />
      <section className="carte pile">
        <h2>Journal des accès</h2>
        {journal.length === 0 ? <p className="muted">Aucun événement.</p> : (
          <div className="file">{journal.map((j) => <div key={j.id} className="file-ligne"><div><strong>{LIB[j.evenement] ?? j.evenement}</strong><div className="tiny">{(j.detail as { via?: string; appareil?: string; cause?: string } | null)?.via ?? ""} {(j.detail as { appareil?: string } | null)?.appareil ?? ""} {(j.detail as { cause?: string } | null)?.cause ?? ""}</div></div><span className="tiny">{fmt.format(j.creeLe)} (Paris)</span></div>)}</div>
        )}
      </section>
    </>
  );
}
