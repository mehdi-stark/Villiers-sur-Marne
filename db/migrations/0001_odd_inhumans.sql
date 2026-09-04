CREATE TABLE "parametres" (
	"code" text PRIMARY KEY NOT NULL,
	"valeur" jsonb NOT NULL,
	"description" text,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_abonnements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"agent" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"dernier_envoi_le" timestamp with time zone,
	CONSTRAINT "push_abonnements_endpoint_unique" UNIQUE("endpoint")
);
