CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app" text NOT NULL,
	"type" text NOT NULL,
	"famille_id" text NOT NULL,
	"periode" text,
	"donnees" jsonb NOT NULL,
	"pdf_base64" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
