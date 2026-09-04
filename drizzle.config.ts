import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// .env.local d'abord (jamais commité), puis .env — même ordre que Next.
config({ path: ".env.local" }); config();

// Schéma = SEULE source de vérité ; migrations GÉNÉRÉES (jamais écrites à la main).
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
});
