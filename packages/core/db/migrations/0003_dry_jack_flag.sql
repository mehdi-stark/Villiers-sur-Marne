CREATE TABLE "journal_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enfant_id" text NOT NULL,
	"activite_id" text NOT NULL,
	"date" text NOT NULL,
	"avant" text,
	"apres" text NOT NULL,
	"acteur" text NOT NULL,
	"app" text NOT NULL,
	"motif" text,
	"accepte" integer DEFAULT 1 NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations_demo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enfant_id" text NOT NULL,
	"activite_id" text NOT NULL,
	"date" text NOT NULL,
	"etat" text NOT NULL,
	"acteur" text NOT NULL,
	"app" text NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_demo_cle" ON "reservations_demo" USING btree ("enfant_id","activite_id","date");