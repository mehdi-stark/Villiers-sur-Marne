CREATE TABLE "demarches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"famille_id" text NOT NULL,
	"email" text NOT NULL,
	"type" text NOT NULL,
	"etat" text DEFAULT 'deposee' NOT NULL,
	"donnees" jsonb NOT NULL,
	"motif" text,
	"agent" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_demarches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demarche_id" uuid NOT NULL,
	"avant" text,
	"apres" text NOT NULL,
	"acteur" text NOT NULL,
	"app" text NOT NULL,
	"motif" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demarche_id" uuid NOT NULL,
	"code" text NOT NULL,
	"nom" text NOT NULL,
	"mime" text NOT NULL,
	"taille" integer NOT NULL,
	"contenu_base64" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pieces" ADD CONSTRAINT "pieces_demarche_id_demarches_id_fk" FOREIGN KEY ("demarche_id") REFERENCES "public"."demarches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demarches_etat_idx" ON "demarches" USING btree ("etat","cree_le");--> statement-breakpoint
CREATE INDEX "demarches_famille_idx" ON "demarches" USING btree ("famille_id");