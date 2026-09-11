CREATE TABLE "entries" (
	"date" date PRIMARY KEY NOT NULL,
	"mood" text,
	"content" jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"url" text NOT NULL,
	"entry_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "images_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_entry_date_entries_date_fk" FOREIGN KEY ("entry_date") REFERENCES "public"."entries"("date") ON DELETE set null ON UPDATE no action;