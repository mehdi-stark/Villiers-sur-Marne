// PWA Back-office agents — push uniquement, AUCUN cache (un cockpit n'affiche jamais un chiffre périmé).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  let d = { titre: "Agents", corps: "", url: "/" };
  try { d = { ...d, ...e.data.json() }; } catch { /* payload vide */ }
  e.waitUntil(self.registration.showNotification(d.titre, { body: d.corps, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: d.url }, tag: d.tag || "agents" }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data || {}).url || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
    for (const f of fenetres) { if ("focus" in f) { f.navigate(url); return f.focus(); } }
    return self.clients.openWindow(url);
  }));
});
