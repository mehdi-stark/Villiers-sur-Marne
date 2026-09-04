CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"statut" text NOT NULL,
	"debut_le" timestamp with time zone DEFAULT now() NOT NULL,
	"fin_le" timestamp with time zone,
	"duree_ms" integer,
	"resultat" jsonb,
	"erreur" text
);
--> statement-breakpoint
ALTER TABLE "push_abonnements" ADD COLUMN "app" text DEFAULT 'cockpit' NOT NULL;--> statement-breakpoint
CREATE INDEX "runs_code_idx" ON "runs" USING btree ("code","debut_le");