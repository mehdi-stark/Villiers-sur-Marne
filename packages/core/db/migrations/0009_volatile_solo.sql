CREATE TABLE "journal_dossiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"famille_id" text NOT NULL,
	"action" text NOT NULL,
	"cible" text,
	"detail" text NOT NULL,
	"acteur" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "journal_dossiers_famille_idx" ON "journal_dossiers" USING btree ("famille_id","cree_le");