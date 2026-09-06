import { routeSante, variable } from "@ville/core/sante";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = routeSante("cockpit", () => [
  variable("DATABASE_URL", "Base Neon « ville »"),
  variable("AUTH_SECRET", "Signature des sessions et des empreintes OTP"),
  variable("ADMIN_EMAILS", "Liste blanche des e-mails autorisés"),
  variable("RESEND_API_KEY", "Envoi des codes OTP"),
  variable("AGENT_SECRET", "Autorise POST /api/agent (pnpm notifier)", false),
  variable("SANTE_SECRET", "Protège ce rapport"),
  variable("MAQUETTES_URL", "Lien du canvas de maquettes", false),
  variable("LANCEUR_SECRET", "« Prévenir l'agent maintenant »", false),
  variable("PUSH_CONTACT", "Contact VAPID", false),
  variable("EMAIL_FROM", "Expéditeur des e-mails", false),
  variable("SOURCE_DONNEES", "Source de l'adaptateur (fictif par défaut)", false),
]);
