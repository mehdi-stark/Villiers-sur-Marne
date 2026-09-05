"use client";

import { Bell, BellRing, Share, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function b64ToU8(b64: string) {
  const brut = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(brut, (c) => c.charCodeAt(0));
}

/** Enregistre le service worker (push seulement), propose l'installation sur mobile
 *  hors mode installé, et l'activation des notifications. Refus mémorisés par appareil. */
export function Pwa() {
  const chemin = usePathname();
  const [installe, setInstalle] = useState(true);
  const [ios, setIos] = useState(false);
  const [bandeau, setBandeau] = useState(false);
  const [notif, setNotif] = useState<"indispo" | "off" | "on" | "refus">("indispo");

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    setInstalle(standalone);
    setIos(/iPhone|iPad/i.test(navigator.userAgent));
    let ferme = false;
    try { ferme = localStorage.getItem("ville-pwa-bandeau") === "ferme"; } catch { /* stockage indisponible */ }
    setBandeau(mobile && !standalone && !ferme);
    if ("PushManager" in window && "Notification" in window) {
      setNotif(Notification.permission === "granted" ? "on" : Notification.permission === "denied" ? "refus" : "off");
    }
  }, []);

  // Badge de l'icône PWA = décisions ouvertes (setAppBadge : Chrome/Android, iOS ≥ 16.4 installé).
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    fetch("/api/decisions").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      const n = navigator as Navigator & { setAppBadge: (n?: number) => Promise<void>; clearAppBadge: () => Promise<void> };
      (d.ouvertes > 0 ? n.setAppBadge(d.ouvertes) : n.clearAppBadge()).catch(() => {});
    }).catch(() => {});
  }, [chemin]);

  const fermer = () => { setBandeau(false); try { localStorage.setItem("ville-pwa-bandeau", "ferme"); } catch { /* plein */ } };

  const activer = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      if ((await Notification.requestPermission()) !== "granted") { setNotif("refus"); return; }
      const { publicKey } = await (await fetch("/api/push")).json();
      const existante = await reg.pushManager.getSubscription();
      const sub = existante ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(publicKey) }));
      const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      setNotif(r.ok ? "on" : "off");
    } catch { setNotif("off"); }
  };

  // Le service worker et le badge vivent partout ; l'interface (bandeau, notifications) ne vit que sur l'accueil.
  if (chemin !== "/") return null;
  return (
    <>
      {bandeau && (
        <div className="bandeau" data-tone="accent" role="status">
          <Share size={16} aria-hidden />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>Installe le cockpit sur ton écran d'accueil</strong>
            <div className="tiny">{ios ? "Safari : bouton Partager → « Sur l'écran d'accueil ». " : "Menu du navigateur → « Installer l'application ». "}C'est en mode installé que les notifications existent.</div>
          </div>
          <button className="bouton-icone" onClick={fermer} aria-label="Fermer ce message" style={{ width: 32, height: 32 }}><X size={15} /></button>
        </div>
      )}
      {notif === "off" && (installe || !ios) && (
        <button className="bouton bouton-sm" data-variant="discret" onClick={activer} style={{ justifySelf: "start" }}>
          <Bell size={14} aria-hidden /> Être notifié quand une décision m'attend
        </button>
      )}
      {notif === "on" && <span className="tiny" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><BellRing size={12} aria-hidden /> Notifications actives sur cet appareil</span>}
      
    </>
  );
}
