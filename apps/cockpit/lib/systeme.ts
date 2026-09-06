import { sql } from "drizzle-orm";
import { db, schema } from "@ville/core/db";
import { dernierRun } from "@ville/core/runs";
import type { RapportSante } from "@ville/core/sante";

/* CE QU'IL FAUT POUR REPRENDRE LE PROJET DANS UN MOIS (demande Mehdi, 06/09/2026).
 * Tout ce que cette page affiche est LU À L'EXÉCUTION — jamais recopié à la main : une
 * fiche d'exploitation écrite à la main ment au bout de trois semaines. */

export type Application = {
  cle: "cockpit" | "famille" | "agents";
  nom: string;
  role: string;
  url: string;
  projetVercel: string;
  port: number;
  chemins: { libelle: string; chemin: string }[];
};

export const APPLICATIONS: Application[] = [
  {
    cle: "cockpit", nom: "Cockpit", role: "Pilotage : décisions, cadrage, marché, backlog, données, présentations.",
    url: "https://villiers-sur-marne.vercel.app", projetVercel: "mehdi-starks-projects/villiers-sur-marne", port: 3000,
    chemins: [{ libelle: "Décisions", chemin: "/pilotage/decisions" }, { libelle: "Données et tarifs", chemin: "/pilotage/donnees" }],
  },
  {
    cle: "famille", nom: "Portail famille", role: "PWA des parents : semaine, calendrier, factures, démarches, activités.",
    url: "https://villiers-famille.vercel.app", projetVercel: "mehdi-starks-projects/villiers-famille", port: 3001,
    chemins: [{ libelle: "Vitrine publique", chemin: "/decouvrir" }, { libelle: "Dossier PDF", chemin: "/decouvrir/dossier.pdf" }],
  },
  {
    cle: "agents", nom: "Back-office agents", role: "PWA des agents : file du jour, pointage, démarches à valider, familles.",
    url: "https://villiers-agents.vercel.app", projetVercel: "mehdi-starks-projects/villiers-agents", port: 3002,
    chemins: [{ libelle: "Réglages (réinitialiser la démo)", chemin: "/reglages" }],
  },
];

export type EtatApp = Application & {
  enLigne: boolean;
  codeHttp: number | null;
  latenceMs: number | null;
  sante: RapportSante | null;
  santeErreur: string | null;
};

async function interroger(url: string, options: RequestInit & { timeoutMs?: number }): Promise<{ res: Response | null; ms: number; erreur: string | null }> {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), options.timeoutMs ?? 6000);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal, cache: "no-store" });
    return { res, ms: Date.now() - t0, erreur: null };
  } catch (e) {
    return { res: null, ms: Date.now() - t0, erreur: e instanceof Error && e.name === "AbortError" ? "délai dépassé" : "injoignable" };
  } finally {
    clearTimeout(minuteur);
  }
}

/** Ping + rapport détaillé de chaque application. Le ping ne demande AUCUN secret ;
 *  le détail (variables posées, commit déployé) exige `SANTE_SECRET`. */
export async function etatApplications(): Promise<EtatApp[]> {
  const secret = process.env.SANTE_SECRET;
  return Promise.all(APPLICATIONS.map(async (a) => {
    const [ping, sante] = await Promise.all([
      interroger(`${a.url}/connexion`, { headers: { accept: "text/html" }, method: "GET" }),
      secret ? interroger(`${a.url}/api/sante`, { headers: { "x-sante-secret": secret } }) : Promise.resolve({ res: null, ms: 0, erreur: "SANTE_SECRET absent du cockpit" }),
    ]);
    let rapport: RapportSante | null = null;
    let santeErreur: string | null = sante.erreur;
    if (sante.res) {
      if (sante.res.ok) rapport = (await sante.res.json()) as RapportSante;
      else santeErreur = sante.res.status === 401 ? "secret refusé (SANTE_SECRET différent sur cette app)" : `rapport indisponible (${sante.res.status})`;
    }
    return { ...a, enLigne: ping.res?.status === 200, codeHttp: ping.res?.status ?? null, latenceMs: ping.res ? ping.ms : null, sante: rapport, santeErreur };
  }));
}

export type EtatBase = { tables: number; migrations: number; derniereMigration: string | null; volumes: { table: string; lignes: number }[] };

/** La base dit elle-même où elle en est : nombre de tables, migrations appliquées, volumétrie. */
export async function etatBase(): Promise<EtatBase> {
  const [tables, migrations, volumes] = await Promise.all([
    db.execute<{ n: number }>(sql`select count(*)::int as n from information_schema.tables where table_schema = 'public'`),
    db.execute<{ n: number; dernier: string | null }>(sql`select count(*)::int as n, to_char(to_timestamp(max(created_at)/1000) at time zone 'Europe/Paris', 'DD/MM/YYYY HH24:MI') as dernier from drizzle.__drizzle_migrations`).then((r) => [...r]).catch(() => [] as { n: number; dernier: string | null }[]),
    db.execute<{ table: string; lignes: number }>(sql`
      select 'décisions' as table, count(*)::int as lignes from decisions
      union all select 'comptes familles', count(*)::int from comptes_familles
      union all select 'réservations', count(*)::int from reservations_demo
      union all select 'démarches', count(*)::int from demarches
      union all select 'appareils (passkeys)', count(*)::int from passkeys
      union all select 'abonnements push', count(*)::int from push_abonnements`),
  ]);
  // Le driver postgres.js rend un TABLEAU, pas un objet { rows } (piège connu du projet).
  const m = migrations[0] ?? { n: 0, dernier: null };
  return { tables: [...tables][0]?.n ?? 0, migrations: m.n, derniereMigration: m.dernier, volumes: [...volumes] };
}

export type EtatAutomatismes = {
  cron: { code: string; role: string; cadence: string; ordonnanceur: string; dernier: { statut: string; debutLe: Date; dureeMs: number | null; resultat: Record<string, unknown> | null; erreur: string | null } | null };
  alertesOuvertes: { niveau: string; code: string; message: string; creeLe: Date }[];
  pushParApp: { app: string; abonnements: number }[];
};

export async function etatAutomatismes(): Promise<EtatAutomatismes> {
  const [run, alertes, push] = await Promise.all([
    dernierRun("rappel_reservations"),
    db.select().from(schema.alertes).where(sql`resolue_le is null`).orderBy(sql`cree_le desc`).limit(5),
    db.execute<{ app: string; abonnements: number }>(sql`select app, count(*)::int as abonnements from push_abonnements group by app order by app`),
  ]);
  return {
    cron: {
      code: "rappel_reservations",
      role: "Rappel hebdomadaire « créneaux encore réservables » — un push par famille, jamais un par créneau.",
      cadence: "vendredi, fenêtre 17 h – 19 h Europe/Paris",
      ordonnanceur: "Vercel (apps/famille/vercel.json — deux entrées UTC, Paris changeant d'heure)",
      dernier: run ? { statut: run.statut, debutLe: run.debutLe, dureeMs: run.dureeMs, resultat: run.resultat ?? null, erreur: run.erreur ?? null } : null,
    },
    alertesOuvertes: alertes.map((a) => ({ niveau: a.niveau, code: a.code, message: a.message, creeLe: a.creeLe })),
    pushParApp: [...push],
  };
}

/** Les comptes qui portent le projet : sans eux, on ne reprend rien. */
export const COMPTES = [
  { service: "GitHub", quoi: "mehdi-stark/Villiers-sur-Marne", ou: "https://github.com/mehdi-stark/Villiers-sur-Marne", note: "SSH du Mac authentifié comme mehdi-stark. L'app GitHub de Vercel n'est pas installée : le déploiement se fait à la main (`pnpm deployer <app>`)." },
  { service: "Vercel", quoi: "compte mehdi-stark, 3 projets", ou: "https://vercel.com/mehdi-starks-projects", note: "Jeton VERCEL_ACCESS_TOKEN dans apps/cockpit/.env.local. Celui du 04/09/2026 a été affiché en clair par la CLI : à révoquer." },
  { service: "Neon", quoi: "projet « ville » (eu-central-1), une base par projet", ou: "https://console.neon.tech", note: "Clé API dans ~/.config/trames/neon.env ; URI régénérable par `creer-base-neon.sh ville` (idempotent)." },
  { service: "Resend", quoi: "clé dédiée au projet, domaine vérifié croscel.com", ou: "https://resend.com/api-keys", note: "Expéditeur provisoire contact@croscel.com jusqu'à un domaine du projet." },
  { service: "PayFIP (DGFiP)", quoi: "numéro client de la régie — PAS demandé", ou: null, note: "Différé par Mehdi : mode MVP. Sans lui, la facture s'affiche mais ne se paie pas." },
];

export const COMMANDES = [
  { commande: "pnpm decisions", role: "Relever les décisions tranchées depuis le cockpit — À FAIRE AU DÉBUT DE CHAQUE SESSION." },
  { commande: "pnpm dev", role: "Les trois apps en local (3000 cockpit, 3001 famille, 3002 agents)." },
  { commande: "pnpm typecheck · pnpm build", role: "Ce qui doit passer avant tout commit." },
  { commande: "pnpm deployer <cockpit|famille|agents>", role: "Déploiement d'UNE app depuis la racine (Root Directory oblige)." },
  { commande: "pnpm db:generate · pnpm db:migrate", role: "Migrations GÉNÉRÉES — jamais écrites à la main." },
  { commande: "pnpm --filter @ville/core test", role: "Tests unitaires du cœur (règles, facturation, marché, démo)." },
  { commande: "cd apps/famille && node scripts/lien-presentation.mjs", role: "Deux liens de démonstration signés, valables 2 h." },
  { commande: "cd apps/<app> && pnpm capturer --forger mehdi.stark@gmail.com [--dark]", role: "Captures 1440 et 390 avec détection de débordement." },
];
