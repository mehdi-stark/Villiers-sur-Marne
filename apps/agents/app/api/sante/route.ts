import { routeSante, variable } from "@ville/core/sante";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = routeSante("agents", () => [
  variable("DATABASE_URL", "Base Neon « ville »"),
  variable("AGENTS_AUTH_SECRET", "Secret de session PROPRE au back-office"),
  variable("AGENT_EMAILS", "Liste blanche des agents"),
  variable("RESEND_API_KEY", "Codes OTP des agents"),
  variable("SANTE_SECRET", "Protège ce rapport"),
  variable("DEMO_SECRET", "Liens de présentation bornés (2 h)", false),
  variable("COMMUNE_ID", "Thème et coordonnées de la commune", false),
  variable("SOURCE_DONNEES", "Source de l'adaptateur (fictif par défaut)", false),
]);
