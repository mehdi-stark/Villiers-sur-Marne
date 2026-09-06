import { routeSante, variable } from "@ville/core/sante";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = routeSante("famille", () => [
  variable("DATABASE_URL", "Base Neon « ville »"),
  variable("FAMILLE_AUTH_SECRET", "Secret de session PROPRE au portail"),
  variable("RESEND_API_KEY", "Codes OTP et e-mail « nouvel appareil »"),
  variable("SANTE_SECRET", "Protège ce rapport"),
  variable("CRON_SECRET", "Rappel hebdomadaire (ordonnanceur Vercel)"),
  variable("DEMO_SECRET", "Liens de présentation bornés (2 h)", false),
  variable("PAYFIP_NUMCLI", "Numéro client de la régie (DGFiP) — différé, mode MVP", false),
  variable("AGENTS_URL", "Porte « côté agents » de la vitrine", false),
  variable("FAMILLE_URL", "URL publique (retour PayFIP)", false),
  variable("COMMUNE_ID", "Thème et coordonnées de la commune", false),
  variable("SOURCE_DONNEES", "Source de l'adaptateur (fictif par défaut)", false),
]);
