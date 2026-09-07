/* GARDE D'ENTRÉE — protéger la base AVANT de l'interroger.
 *
 * Le contrôle « cet e-mail a-t-il le droit d'entrer ? » existait déjà avant tout envoi :
 * on n'envoie jamais un code à un inconnu. Mais il coûtait une REQUÊTE BASE par tentative,
 * y compris pour une adresse inventée — donc un script qui martèle `/api/auth` faisait
 * payer la base à chaque coup. Ici, rien ne touche la base tant que la tentative n'a pas
 * passé trois filtres qui tiennent en mémoire :
 *   1. le format de l'adresse (aucune E/S) ;
 *   2. un quota par IP puis par adresse (compteur en mémoire, fenêtre glissante) ;
 *   3. un cache court des réponses d'autorisation, positives ET négatives.
 *
 * HONNÊTETÉ SUR LA PORTÉE : cette mémoire est celle d'UNE instance serverless. Elle
 * absorbe les rafales (le cas réel : un script, un scanner, une boucle) mais ne remplace
 * pas un quota distribué. Le comptage en base des envois réels (5/h par adresse) reste
 * le filet de sécurité, et il n'est atteint que par des tentatives déjà filtrées.
 *
 * ET SURTOUT : la réponse ne dit JAMAIS si l'adresse existe — même corps, même code, et
 * un délai plancher pour que la latence ne devienne pas l'oracle que le corps refuse d'être. */

type Fenetre = { debut: number; compte: number };

const compteurs = new Map<string, Fenetre>();
const cacheAutorisation = new Map<string, { valeur: boolean; expireLe: number }>();
let dernierMenage = 0;

/** Ménage amorti : on ne balaie qu'une fois par minute, sur le chemin d'une tentative. */
function menage(maintenant: number): void {
  if (maintenant - dernierMenage < 60_000) return;
  dernierMenage = maintenant;
  for (const [cle, f] of compteurs) if (maintenant - f.debut > 3600_000) compteurs.delete(cle);
  for (const [cle, c] of cacheAutorisation) if (c.expireLe < maintenant) cacheAutorisation.delete(cle);
}

/** Compteur à fenêtre glissante grossière : une fenêtre par clé, remise à zéro à l'échéance. */
export function quota(cle: string, max: number, fenetreMs: number, maintenant = Date.now()): { ok: boolean; reste: number; dansMs: number } {
  menage(maintenant);
  const f = compteurs.get(cle);
  if (!f || maintenant - f.debut >= fenetreMs) {
    compteurs.set(cle, { debut: maintenant, compte: 1 });
    return { ok: true, reste: max - 1, dansMs: fenetreMs };
  }
  f.compte++;
  return { ok: f.compte <= max, reste: Math.max(0, max - f.compte), dansMs: fenetreMs - (maintenant - f.debut) };
}

/** L'IP de l'appelant derrière un proxy (Vercel). Sans en-tête fiable, on regroupe tout
 *  sous « inconnue » — c'est volontaire : mieux vaut un seau commun que pas de seau. */
export function ipDe(req: { headers: { get(nom: string): string | null } }): string {
  const brut = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";
  return (brut.split(",")[0] ?? "").trim() || "inconnue";
}

export const FORMAT_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Autorisation MISE EN CACHE, positive comme négative : une rafale sur la même adresse
 *  ne coûte qu'une seule lecture. TTL court, pour qu'un compte créé soit vite reconnu. */
export async function autoriseCache(app: string, email: string, verifier: (e: string) => boolean | Promise<boolean>, ttlMs = 60_000): Promise<boolean> {
  const maintenant = Date.now();
  const cle = `${app}|${email}`;
  const c = cacheAutorisation.get(cle);
  if (c && c.expireLe > maintenant) return c.valeur;
  const valeur = await verifier(email);
  cacheAutorisation.set(cle, { valeur, expireLe: maintenant + ttlMs });
  return valeur;
}

export type Verdict =
  | { passe: true; email: string; reste: number }
  | { passe: false; motif: "format" | "quota_ip" | "quota_email" | "inconnu"; attendreMs: number; reste: number };

/* `reste` = demandes encore possibles pour CETTE adresse dans l'heure. On peut l'annoncer
 * à l'utilisateur sans rien trahir : ce quota est compté AVANT de savoir si l'adresse
 * est connue, donc il vaut pareil pour une adresse rattachée à un dossier et pour une
 * adresse inventée. C'est ce qui évite qu'un parent se bloque tout seul en cliquant. */

export type ReglesGarde = { parIp: { max: number; fenetreMs: number }; parEmail: { max: number; fenetreMs: number } };

/** Les valeurs par défaut : un humain qui se trompe passe, un script s'arrête.
 *  10 tentatives par IP en 10 min ; 5 par adresse en 1 h (le quota d'envoi de la ville). */
export const REGLES: ReglesGarde = { parIp: { max: 10, fenetreMs: 10 * 60_000 }, parEmail: { max: 5, fenetreMs: 3600_000 } };

/** Le portier : dans l'ordre du moins cher au plus cher. La base n'est atteinte qu'en
 *  dernier, et seulement si tout le reste a passé. */
export async function garderDemandeOtp(p: {
  app: string;
  email: string;
  ip: string;
  autorise: (email: string) => boolean | Promise<boolean>;
  regles?: ReglesGarde;
}): Promise<Verdict> {
  const regles = p.regles ?? REGLES;
  const email = p.email.trim().toLowerCase().slice(0, 120);
  if (!FORMAT_EMAIL.test(email)) return { passe: false, motif: "format", attendreMs: 0, reste: 0 };

  const parIp = quota(`ip|${p.app}|${p.ip}`, regles.parIp.max, regles.parIp.fenetreMs);
  if (!parIp.ok) return { passe: false, motif: "quota_ip", attendreMs: parIp.dansMs, reste: 0 };

  const parEmail = quota(`email|${p.app}|${email}`, regles.parEmail.max, regles.parEmail.fenetreMs);
  if (!parEmail.ok) return { passe: false, motif: "quota_email", attendreMs: parEmail.dansMs, reste: 0 };

  if (!(await autoriseCache(p.app, email, p.autorise))) return { passe: false, motif: "inconnu", attendreMs: 0, reste: parEmail.reste };
  return { passe: true, email, reste: parEmail.reste };
}

/** Délai plancher : sans lui, « adresse inconnue » (réponse immédiate) et « code envoyé »
 *  (insertion + appel au fournisseur d'e-mail) se distinguent à la montre. */
export async function repondreEnAuMoins<T>(debut: number, plancherMs: number, valeur: T): Promise<T> {
  const reste = plancherMs - (Date.now() - debut);
  if (reste > 0) await new Promise((r) => setTimeout(r, reste));
  return valeur;
}

/** Remise à zéro — pour les tests uniquement. */
export function reinitialiserGarde(): void {
  compteurs.clear();
  cacheAutorisation.clear();
  dernierMenage = 0;
}

/** Faut-il ALERTER pour ce martèlement ? Une alerte est une écriture en base : on n'en
 *  pose qu'une par fenêtre et par application, sinon l'attaque paierait sa propre trace. */
export function alerterMartelement(app: string, fenetreMs = 15 * 60_000): boolean {
  return quota(`alerte|martelement|${app}`, 1, fenetreMs).ok;
}
