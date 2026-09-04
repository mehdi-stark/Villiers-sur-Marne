CREATE TABLE "comptes_familles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"famille_id" text NOT NULL,
	"commune_id" text DEFAULT 'villiers-sur-marne' NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"derniere_connexion_le" timestamp with time zone,
	CONSTRAINT "comptes_familles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "journal_connexions" ADD COLUMN "app" text DEFAULT 'cockpit' NOT NULL;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD COLUMN "app" text DEFAULT 'cockpit' NOT NULL;