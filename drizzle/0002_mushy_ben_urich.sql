ALTER TABLE "plans" ADD COLUMN "stage" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "input" jsonb;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "started_at" timestamp with time zone;