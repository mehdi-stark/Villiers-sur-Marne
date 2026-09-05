"use client";

import { useEffect, useState } from "react";

function b64ToU8(b64: string) {
  const brut = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(brut, (c) => c.charCodeAt(0));
}

/** Activation des notifications, partagée par les trois apps : le service worker est
 *  enregistré par la coquille ; ici on demande l'autorisation et on enregistre l'appareil. */
export function ActiverNotifications({ texte = "Être prévenu des créneaux encore réservables", muetSiRefus = false }: { texte?: string; muetSiRefus?: boolean }) {
  const [etat, setEtat] = useState<"indispo" | "off" | "on" | "refus">("indispo");
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    setEtat(Notification.permission === "granted" ? "on" : Notification.permission === "denied" ? "refus" : "off");
  }, []);
  if (etat === "indispo" || etat === "on") return null;
  const activer = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      if ((await Notification.requestPermission()) !== "granted") { setEtat("refus"); return; }
      const { publicKey } = await (await fetch("/api/push")).json();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(publicKey) }));
      const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      setEtat(r.ok ? "on" : "off");
    } catch { setEtat("off"); }
  };
  if (etat === "refus") return muetSiRefus ? null : <p className="mini t-3">Notifications refusées — réautorisez-les dans les réglages du navigateur.</p>;
  return <button type="button" className="bouton bouton-sm" data-variant="discret" onClick={activer} style={{ justifySelf: "start" }}>{texte}</button>;
}
