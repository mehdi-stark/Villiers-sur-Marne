CREATE TABLE "defis_webauthn" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app" text NOT NULL,
	"email" text,
	"type" text NOT NULL,
	"defi" text NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app" text NOT NULL,
	"email" text NOT NULL,
	"credential_id" text NOT NULL,
	"cle_publique" text NOT NULL,
	"compteur" integer DEFAULT 0 NOT NULL,
	"transports" jsonb,
	"appareil" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"dernier_usage_le" timestamp with time zone,
	"revoque_le" timestamp with time zone,
	CONSTRAINT "passkeys_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE INDEX "passkeys_app_email_idx" ON "passkeys" USING btree ("app","email");