import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";
import { poserAlerte, resoudreAlerte } from "./alertes";

// Push web : clés VAPID auto-générées (table parametres), un abonnement par
// appareil, envoi best-effort, purge des abonnements morts (404/410).
const CONTACT = process.env.PUSH_CONTACT ?? "mailto:mehdi.stark@gmail.com";

export async function clesVapid(): Promise<{ publicKey: string; privateKey: string }> {
  const [l] = await db.select().from(schema.parametres).where(eq(schema.parametres.code, "vapid")).limit(1);
  const v = l?.valeur as { publicKey?: string; privateKey?: string } | undefined;
  if (v?.publicKey && v.privateKey) return { publicKey: v.publicKey, privateKey: v.privateKey };
  const cles = webpush.generateVAPIDKeys();
  await db.insert(schema.parametres).values({ code: "vapid", valeur: { ...cles }, description: "Clés VAPID du cockpit (générées automatiquement)" }).onConflictDoNothing();
  return cles;
}

export async function enregistrerAbonnement(p: { app: string; email: string; endpoint: string; p256dh: string; auth: string; agent?: string }): Promise<void> {
  await db
    .insert(schema.pushAbonnements)
    .values(p)
    .onConflictDoUpdate({ target: schema.pushAbonnements.endpoint, set: { app: p.app, email: p.email, p256dh: p.p256dh, auth: p.auth, agent: p.agent } });
}

export type Notification = { titre: string; corps: string; url?: string; tag?: string };

/** Envoie à tous les appareils inscrits. Zéro appareil = rien n'est parti : on le DIT (retour), et
 *  une alerte « info » le rappelle tant que personne n'est abonné. */
export async function envoyerPush(n: Notification, cible?: { app?: string; email?: string }): Promise<{ envoyes: number; purges: number; abonnes: number }> {
  const { and, eq } = await import("drizzle-orm");
  const conds = [cible?.app ? eq(schema.pushAbonnements.app, cible.app) : undefined, cible?.email ? eq(schema.pushAbonnements.email, cible.email) : undefined].filter(Boolean);
  const subs = conds.length ? await db.select().from(schema.pushAbonnements).where(and(...(conds as never[]))) : await db.select().from(schema.pushAbonnements);
  if (!subs.length) {
    if (cible?.email) return { envoyes: 0, purges: 0, abonnes: 0 };
    await poserAlerte("info", "push_aucun_appareil", "Aucun appareil inscrit aux notifications : active-les depuis le cockpit installé", {});
    return { envoyes: 0, purges: 0, abonnes: 0 };
  }
  await resoudreAlerte("push_aucun_appareil");
  const cles = await clesVapid();
  webpush.setVapidDetails(CONTACT, cles.publicKey, cles.privateKey);
  const payload = JSON.stringify({ titre: n.titre, corps: n.corps, url: n.url ?? "/", tag: n.tag });
  let envoyes = 0;
  const mortes: string[] = [];
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 });
      envoyes++;
      await db.update(schema.pushAbonnements).set({ dernierEnvoiLe: new Date() }).where(eq(schema.pushAbonnements.id, s.id));
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410 || code === 400) mortes.push(s.endpoint);
      else await poserAlerte("warn", "push_envoi_echec", `Un push a échoué (statut ${code ?? "réseau"})`, { endpoint: s.endpoint.slice(0, 40) });
    }
  }
  if (mortes.length) await db.delete(schema.pushAbonnements).where(inArray(schema.pushAbonnements.endpoint, mortes));
  return { envoyes, purges: mortes.length, abonnes: subs.length };
}
