CREATE TYPE "public"."site_part_mode" AS ENUM('site', 'none', 'custom');--> statement-breakpoint
ALTER TABLE "page" ADD COLUMN "header_mode" "site_part_mode" DEFAULT 'site' NOT NULL;--> statement-breakpoint
ALTER TABLE "page" ADD COLUMN "footer_mode" "site_part_mode" DEFAULT 'site' NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;