import { creerAuth } from "@ville/core/auth";
import { db, schema } from "@ville/core/db";
import { eq } from "drizzle-orm";

// Identité PROPRE au portail famille : cookie, secret et comptes distincts du cockpit et des agents.
export const auth = creerAuth({
  app: "famille",
  cookie: "famille_session",
  secretEnv: "FAMILLE_AUTH_SECRET",
  autorise: async (email) => (await db.select({ id: schema.comptesFamilles.id }).from(schema.comptesFamilles).where(eq(schema.comptesFamilles.email, email.toLowerCase())).limit(1)).length > 0,
});

export async function compteDe(email: string) {
  const [c] = await db.select().from(schema.comptesFamilles).where(eq(schema.comptesFamilles.email, email.toLowerCase())).limit(1);
  return c ?? null;
}
