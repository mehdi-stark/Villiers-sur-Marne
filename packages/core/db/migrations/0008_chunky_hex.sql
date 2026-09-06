CREATE TABLE "enfants_demo" (
	"id" text PRIMARY KEY NOT NULL,
	"famille_id" text NOT NULL,
	"prenom" text NOT NULL,
	"naissance" text NOT NULL,
	"ecole" text NOT NULL,
	"classe" text NOT NULL,
	"detache_le" timestamp with time zone,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"acteur" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "enfants_demo_famille_idx" ON "enfants_demo" USING btree ("famille_id");