import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BasculeTheme } from "@ville/ui/theme";
import { ActiverNotifications } from "@ville/core/ui/push";
import { surDonneesFictives } from "@ville/core/demonstration";
import { agentCourant } from "@/lib/session";
import { BoutonDemo } from "@/components/bouton-demo";

export const metadata: Metadata = { title: "Réglages" };
export const dynamic = "force-dynamic";

export default async function Reglages() {
  const a = await agentCourant();
  if (!a) redirect("/connexion");
  return (
    <>
      <div className="page-tete"><div><h1>Réglages</h1><p className="petit t-2">Apparence, notifications, et le jeu de démonstration.</p></div></div>
      <section className="carte pile"><h2>Apparence</h2><p className="petit t-2">Clair, sombre, ou selon le système.</p><BasculeTheme /></section>
      <section className="carte pile"><h2>Notifications</h2><p className="petit t-2">Les démarches déposées et les pannes critiques — rien d'autre.</p><ActiverNotifications texte="Activer les notifications sur cet appareil" /></section>
      {surDonneesFictives() && (
        <section className="carte pile">
          <h2>Démonstration</h2>
          <p className="petit t-2">Remet le jeu fictif à zéro : trois démarches en attente et les pointages du jour. À faire entre deux rendez-vous.</p>
          <BoutonDemo />
        </section>
      )}
    </>
  );
}
