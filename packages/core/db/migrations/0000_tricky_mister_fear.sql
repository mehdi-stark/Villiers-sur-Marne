CREATE TABLE "alertes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niveau" text NOT NULL,
	"code" text NOT NULL,
	"message" text NOT NULL,
	"contexte" jsonb,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"resolue_le" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sujet" text NOT NULL,
	"cle" text NOT NULL,
	"libelle" text NOT NULL,
	"choix" text NOT NULL,
	"note" text,
	"acteur" text NOT NULL,
	"tranche_le" timestamp with time zone DEFAULT now() NOT NULL,
	"reporte_le" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "journal_connexions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"evenement" text NOT NULL,
	"detail" jsonb,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"hash" text NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"essais" integer DEFAULT 0 NOT NULL,
	"consomme_le" timestamp with time zone,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "alertes_code_idx" ON "alertes" USING btree ("code","resolue_le");--> statement-breakpoint
CREATE INDEX "decisions_cle_idx" ON "decisions" USING btree ("sujet","cle","tranche_le");--> statement-breakpoint
CREATE INDEX "otp_email_idx" ON "otp_codes" USING btree ("email","cree_le");