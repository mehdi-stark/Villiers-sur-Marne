import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// ---- Pilotage : les décisions tranchées DEPUIS le cockpit -------------------
// Le document canonique (docs/planning/*.md) reste la source de vérité relue à
// froid ; cette table est le CANAL : chaque tap écrit une ligne, l'agent la relit
// au début de chaque session (`pnpm decisions`) et reporte le choix dans le doc.
export const decisions = pgTable(
  "decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sujet: text("sujet").notNull(), // "cadrage" | "backlog" | "marche" | …
    cle: text("cle").notNull(), // ex. "cadrage:1", "backlog:simulateur-qf"
    libelle: text("libelle").notNull(), // le titre lisible au moment du tap
    choix: text("choix").notNull(), // l'option choisie (texte exact du bouton)
    note: text("note"), // condition, précision, contre-proposition
    acteur: text("acteur").notNull(), // e-mail de l'opérateur
    trancheLe: timestamp("tranche_le", { withTimezone: true }).notNull().defaultNow(),
    reporteLe: timestamp("reporte_le", { withTimezone: true }), // quand l'agent l'a reporté dans le doc
  },
  (t) => [index("decisions_cle_idx").on(t.sujet, t.cle, t.trancheLe)],
);

// ---- Connexion : OTP (hash seulement), débit d'envoi, journal ---------------
export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    app: text("app").notNull().default("cockpit"), // cockpit | famille | agents — un OTP ne vaut que pour SON application
    email: text("email").notNull(),
    hash: text("hash").notNull(), // HMAC(email|code) — jamais le code
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    essais: integer("essais").notNull().default(0),
    consommeLe: timestamp("consomme_le", { withTimezone: true }),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("otp_email_idx").on(t.email, t.creeLe)],
);

export const journalConnexions = pgTable("journal_connexions", {
  id: uuid("id").primaryKey().defaultRandom(),
  app: text("app").notNull().default("cockpit"),
  email: text("email").notNull(),
  evenement: text("evenement").notNull(), // otp_envoye | otp_refuse | connexion | envoi_echec
  detail: jsonb("detail").$type<Record<string, unknown>>(),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Alertes : tout échec d'envoi sortant pose une ligne (le silence ment) ---
export const alertes = pgTable(
  "alertes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    niveau: text("niveau").notNull(), // info | warn | critique
    code: text("code").notNull(), // ex. "otp_envoi_echec"
    message: text("message").notNull(), // la CAUSE, jamais la citation d'un fournisseur (leçon 58)
    contexte: jsonb("contexte").$type<Record<string, unknown>>(),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
    resolueLe: timestamp("resolue_le", { withTimezone: true }),
  },
  // Dédup des alertes OUVERTES en code (select puis insert) : une colonne NULL
  // échappe à un index unique (CONVENTIONS_TECHNIQUES).
  (t) => [index("alertes_code_idx").on(t.code, t.resolueLe)],
);

// ---- Paramètres techniques (clés VAPID générées, etc.) — jamais de secret produit ---
export const parametres = pgTable("parametres", {
  code: text("code").primaryKey(),
  valeur: jsonb("valeur").$type<Record<string, unknown>>().notNull(),
  description: text("description"),
  majLe: timestamp("maj_le", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Push web : un abonnement par appareil, purgé quand le navigateur répond 404/410 ---
export const pushAbonnements = pgTable("push_abonnements", {
  id: uuid("id").primaryKey().defaultRandom(),
  app: text("app").notNull().default("cockpit"), // un abonnement vaut pour UNE application
  email: text("email").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  agent: text("agent"),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  dernierEnvoiLe: timestamp("dernier_envoi_le", { withTimezone: true }),
});

// ---- Portail famille : qui a le droit d'entrer, et pour quelle famille de la source ----
// Un compte = un e-mail → une famille (id de la source active) dans une commune.
// Aucun mot de passe : OTP seulement. Seed de démo : scripts/seed-familles.mjs.
export const comptesFamilles = pgTable("comptes_familles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  familleId: text("famille_id").notNull(),
  communeId: text("commune_id").notNull().default("villiers-sur-marne"),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  derniereConnexionLe: timestamp("derniere_connexion_le", { withTimezone: true }),
});

// ---- Réservations de la source FICTIVE, persistées : ce que le parent réserve d'un
// tap et ce que l'agent pointe s'écrivent ici et se relisent partout (famille, agents,
// cockpit). Une ligne par (enfant, activité, date) ; l'historique = journal_reservations.
export const reservationsDemo = pgTable(
  "reservations_demo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enfantId: text("enfant_id").notNull(),
    activiteId: text("activite_id").notNull(),
    date: text("date").notNull(), // AAAA-MM-JJ
    etat: text("etat").notNull(), // reservee | annulee | presence | absence
    acteur: text("acteur").notNull(), // e-mail (parent ou agent)
    app: text("app").notNull(), // famille | agents
    majLe: timestamp("maj_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reservations_demo_cle").on(t.enfantId, t.activiteId, t.date)],
);

export const journalReservations = pgTable("journal_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  enfantId: text("enfant_id").notNull(),
  activiteId: text("activite_id").notNull(),
  date: text("date").notNull(),
  avant: text("avant"),
  apres: text("apres").notNull(),
  acteur: text("acteur").notNull(),
  app: text("app").notNull(),
  motif: text("motif"), // ex. « délai dépassé » quand refusé
  accepte: integer("accepte").notNull().default(1), // 1 accepté · 0 refusé par le code
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Passkeys (Face ID / Touch ID) — proposées APRÈS le premier code réussi, jamais à sa place.
// Une passkey = un appareil, pour UNE application (RP ID = domaine de l'app).
export const passkeys = pgTable(
  "passkeys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    app: text("app").notNull(), // cockpit | famille | agents
    email: text("email").notNull(),
    credentialId: text("credential_id").notNull().unique(), // base64url
    clePublique: text("cle_publique").notNull(), // base64url
    compteur: integer("compteur").notNull().default(0),
    transports: jsonb("transports").$type<string[]>(),
    appareil: text("appareil"), // déduit du user-agent à l'enregistrement
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
    dernierUsageLe: timestamp("dernier_usage_le", { withTimezone: true }),
    revoqueLe: timestamp("revoque_le", { withTimezone: true }),
  },
  (t) => [index("passkeys_app_email_idx").on(t.app, t.email)],
);

// Défis WebAuthn en cours (courte durée), pour ne rien garder côté client.
export const defisWebauthn = pgTable("defis_webauthn", {
  id: uuid("id").primaryKey().defaultRandom(),
  app: text("app").notNull(),
  email: text("email"), // null pour un défi de connexion « découverte »
  type: text("type").notNull(), // enregistrement | connexion
  defi: text("defi").notNull(),
  expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Documents générés : TOUJOURS les données structurées ET le rendu figé (attestations, reçus).
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  app: text("app").notNull(),
  type: text("type").notNull(), // attestation_paiement | …
  familleId: text("famille_id").notNull(),
  periode: text("periode"),
  donnees: jsonb("donnees").$type<Record<string, unknown>>().notNull(),
  pdfBase64: text("pdf_base64").notNull(), // le rendu réellement montré (petit : quelques Ko)
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Tâches planifiées : verrou, journal, heartbeat (recette CRON_RESILIENT) --------
export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(), // rappel_reservations | …
    statut: text("statut").notNull(), // running | ok | erreur | ignore
    debutLe: timestamp("debut_le", { withTimezone: true }).notNull().defaultNow(),
    finLe: timestamp("fin_le", { withTimezone: true }),
    dureeMs: integer("duree_ms"),
    resultat: jsonb("resultat").$type<Record<string, unknown>>(),
    erreur: text("erreur"),
  },
  (t) => [index("runs_code_idx").on(t.code, t.debutLe)],
);

// ---- Démarches à pièces (inscription, quotient familial, coordonnées) ---------------
// L'état est une machine explicite ; chaque transition laisse une ligne de journal.
export const demarches = pgTable(
  "demarches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familleId: text("famille_id").notNull(),
    email: text("email").notNull(),
    type: text("type").notNull(), // inscription_periscolaire | quotient_familial | coordonnees
    etat: text("etat").notNull().default("deposee"), // deposee | en_cours | validee | refusee
    donnees: jsonb("donnees").$type<Record<string, unknown>>().notNull(),
    motif: text("motif"), // motif de refus ou note de l'agent
    agent: text("agent"),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
    majLe: timestamp("maj_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("demarches_etat_idx").on(t.etat, t.creeLe), index("demarches_famille_idx").on(t.familleId)],
);

export const pieces = pgTable("pieces", {
  id: uuid("id").primaryKey().defaultRandom(),
  demarcheId: uuid("demarche_id").notNull().references(() => demarches.id, { onDelete: "cascade" }),
  code: text("code").notNull(), // identite | domicile | caf | vaccins | imposition
  nom: text("nom").notNull(),
  mime: text("mime").notNull(),
  taille: integer("taille").notNull(),
  contenuBase64: text("contenu_base64").notNull(),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
});

export const journalDemarches = pgTable("journal_demarches", {
  id: uuid("id").primaryKey().defaultRandom(),
  demarcheId: uuid("demarche_id").notNull(),
  avant: text("avant"),
  apres: text("apres").notNull(),
  acteur: text("acteur").notNull(),
  app: text("app").notNull(),
  motif: text("motif"),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
});
