CREATE TABLE "content_packages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"content_mode" varchar(32) NOT NULL,
	"requested_blog" boolean NOT NULL,
	"requested_xiaohongshu" boolean NOT NULL,
	"lifecycle" varchar(16) NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "content_packages_title_length_check" CHECK (char_length("content_packages"."title") BETWEEN 1 AND 200),
	CONSTRAINT "content_packages_description_length_check" CHECK ("content_packages"."description" IS NULL OR char_length("content_packages"."description") <= 2000),
	CONSTRAINT "content_packages_mode_check" CHECK ("content_packages"."content_mode" IN ('deferred', 'creator_led', 'research_based')),
	CONSTRAINT "content_packages_requested_output_check" CHECK ("content_packages"."requested_blog" OR "content_packages"."requested_xiaohongshu"),
	CONSTRAINT "content_packages_lifecycle_check" CHECK ("content_packages"."lifecycle" IN ('active', 'archived')),
	CONSTRAINT "content_packages_revision_check" CHECK ("content_packages"."revision" >= 1),
	CONSTRAINT "content_packages_archive_state_check" CHECK (("content_packages"."lifecycle" = 'active' AND "content_packages"."archived_at" IS NULL) OR ("content_packages"."lifecycle" = 'archived' AND "content_packages"."archived_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX "content_packages_owner_lifecycle_created_idx" ON "content_packages" USING btree ("owner_user_id","lifecycle","created_at","id");