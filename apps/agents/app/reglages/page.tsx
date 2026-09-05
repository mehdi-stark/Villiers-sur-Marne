import type { Metadata } from "next";
import { BasculeTheme } from "@ville/ui/theme";
import { ActiverNotifications } from "@ville/core/ui/push";

export const metadata: Metadata = { title: "Réglages" };
export const dynamic = "force-dynamic";

export default function Reglages() {
  return (
    <>
      <div className="page-tete"><div><h1>Réglages</h1><p className="muted">Apparence et notifications de cet appareil.</p></div></div>
      <section className="carte pile"><h2>Apparence</h2><p className="muted">Clair, sombre, ou selon le système.</p><BasculeTheme /></section>
      <section className="carte pile"><h2>Notifications</h2><p className="muted">Les décisions qui attendent et les pannes critiques — rien d'autre.</p><ActiverNotifications texte="Activer les notifications sur cet appareil" /></section>
    </>
  );
}
