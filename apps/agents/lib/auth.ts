import { creerAuth, whitelistEnv } from "@ville/core/auth";

// Identité PROPRE au back-office agents : liste blanche AGENT_EMAILS, cookie et secret distincts.
export const auth = creerAuth({ app: "agents", cookie: "agents_session", secretEnv: "AGENTS_AUTH_SECRET", autorise: whitelistEnv("AGENT_EMAILS") });
