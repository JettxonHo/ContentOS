CREATE TABLE "blog_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"blog_id" uuid NOT NULL,
	"approved_version_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"approved_by_id" uuid NOT NULL,
	"validation_summary" jsonb NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "blog_approvals_blog_version_unique" UNIQUE("blog_id","approved_version_id"),
	CONSTRAINT "blog_approvals_owner_check" CHECK ("blog_approvals"."approved_by_id" = "blog_approvals"."owner_user_id"),
	CONSTRAINT "blog_approvals_validation_summary_check" CHECK (jsonb_typeof("blog_approvals"."validation_summary") = 'object')
);
--> statement-breakpoint
CREATE TABLE "blog_artifacts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "blog_artifacts_package_unique" UNIQUE("content_package_id"),
	CONSTRAINT "blog_artifacts_id_package_owner_unique" UNIQUE("id","content_package_id","owner_user_id")
);
--> statement-breakpoint
CREATE TABLE "blog_heads" (
	"blog_id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"working_copy_id" uuid NOT NULL,
	"latest_version_id" uuid NOT NULL,
	"review_candidate_version_id" uuid NOT NULL,
	"approved_version_id" uuid,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"provider_alias" varchar(100) NOT NULL,
	"raw_output" text NOT NULL,
	"state" varchar(16) NOT NULL,
	"safe_error_code" varchar(64),
	"blog_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "blog_runs_request_owner_unique" UNIQUE("request_id","owner_user_id"),
	CONSTRAINT "blog_runs_state_check" CHECK ("blog_runs"."state" IN ('succeeded', 'failed')),
	CONSTRAINT "blog_runs_raw_output_check" CHECK (octet_length("blog_runs"."raw_output") BETWEEN 0 AND 1000000)
);
--> statement-breakpoint
CREATE TABLE "blog_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"blog_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"parent_version_id" uuid,
	"body" jsonb NOT NULL,
	"content_hash" char(64) NOT NULL,
	"schema_version" varchar(32) NOT NULL,
	"research_version_id" uuid NOT NULL,
	"opinion_version_id" uuid,
	"content_mode" varchar(32) NOT NULL,
	"origin" varchar(32) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "blog_versions_id_blog_unique" UNIQUE("id","blog_id"),
	CONSTRAINT "blog_versions_blog_number_unique" UNIQUE("blog_id","version_number"),
	CONSTRAINT "blog_versions_number_check" CHECK ("blog_versions"."version_number" >= 1),
	CONSTRAINT "blog_versions_body_check" CHECK (jsonb_typeof("blog_versions"."body") = 'object'),
	CONSTRAINT "blog_versions_hash_check" CHECK ("blog_versions"."content_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "blog_versions_schema_check" CHECK ("blog_versions"."schema_version" = 'blog/v1'),
	CONSTRAINT "blog_versions_mode_check" CHECK ("blog_versions"."content_mode" IN ('creator_led', 'research_based')),
	CONSTRAINT "blog_versions_origin_check" CHECK ("blog_versions"."origin" IN ('generated', 'user_checkpoint'))
);
--> statement-breakpoint
CREATE TABLE "blog_working_copies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"blog_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"body" jsonb NOT NULL,
	"revision" integer NOT NULL,
	"checkpointed_revision" integer,
	"base_version_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "blog_working_copies_blog_unique" UNIQUE("blog_id"),
	CONSTRAINT "blog_working_copies_id_blog_unique" UNIQUE("id","blog_id"),
	CONSTRAINT "blog_working_copies_revision_check" CHECK ("blog_working_copies"."revision" >= 1)
);
--> statement-breakpoint
CREATE TABLE "opinion_artifacts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "opinion_artifacts_package_unique" UNIQUE("content_package_id"),
	CONSTRAINT "opinion_artifacts_id_package_owner_unique" UNIQUE("id","content_package_id","owner_user_id")
);
--> statement-breakpoint
CREATE TABLE "opinion_drafts" (
	"opinion_id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"research_version_id" uuid NOT NULL,
	"question" text NOT NULL,
	"raw_response" text NOT NULL,
	"interpretation" text NOT NULL,
	"revision" integer NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "opinion_drafts_revision_check" CHECK ("opinion_drafts"."revision" >= 1),
	CONSTRAINT "opinion_drafts_question_check" CHECK (char_length("opinion_drafts"."question") BETWEEN 1 AND 500),
	CONSTRAINT "opinion_drafts_raw_check" CHECK (octet_length("opinion_drafts"."raw_response") BETWEEN 1 AND 10000),
	CONSTRAINT "opinion_drafts_interpretation_check" CHECK (octet_length("opinion_drafts"."interpretation") BETWEEN 1 AND 10000)
);
--> statement-breakpoint
CREATE TABLE "opinion_heads" (
	"opinion_id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"confirmed_version_id" uuid,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opinion_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"opinion_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"research_version_id" uuid NOT NULL,
	"question" text NOT NULL,
	"raw_response" text NOT NULL,
	"interpretation" text NOT NULL,
	"confirmed_statement" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "opinion_versions_opinion_number_unique" UNIQUE("opinion_id","version_number"),
	CONSTRAINT "opinion_versions_id_opinion_unique" UNIQUE("id","opinion_id"),
	CONSTRAINT "opinion_versions_number_check" CHECK ("opinion_versions"."version_number" >= 1),
	CONSTRAINT "opinion_versions_statement_check" CHECK (octet_length("opinion_versions"."confirmed_statement") BETWEEN 1 AND 10000)
);
--> statement-breakpoint
ALTER TABLE "blog_approvals" ADD CONSTRAINT "blog_approvals_artifact_package_owner_fk" FOREIGN KEY ("blog_id","content_package_id","owner_user_id") REFERENCES "public"."blog_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_approvals" ADD CONSTRAINT "blog_approvals_version_blog_fk" FOREIGN KEY ("approved_version_id","blog_id") REFERENCES "public"."blog_versions"("id","blog_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_artifacts" ADD CONSTRAINT "blog_artifacts_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_heads" ADD CONSTRAINT "blog_heads_artifact_package_owner_fk" FOREIGN KEY ("blog_id","content_package_id","owner_user_id") REFERENCES "public"."blog_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_heads" ADD CONSTRAINT "blog_heads_working_copy_fk" FOREIGN KEY ("working_copy_id","blog_id") REFERENCES "public"."blog_working_copies"("id","blog_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_heads" ADD CONSTRAINT "blog_heads_latest_version_fk" FOREIGN KEY ("latest_version_id","blog_id") REFERENCES "public"."blog_versions"("id","blog_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_heads" ADD CONSTRAINT "blog_heads_review_version_fk" FOREIGN KEY ("review_candidate_version_id","blog_id") REFERENCES "public"."blog_versions"("id","blog_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_heads" ADD CONSTRAINT "blog_heads_approved_version_fk" FOREIGN KEY ("approved_version_id","blog_id") REFERENCES "public"."blog_versions"("id","blog_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_runs" ADD CONSTRAINT "blog_runs_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_runs" ADD CONSTRAINT "blog_runs_artifact_package_owner_fk" FOREIGN KEY ("blog_id","content_package_id","owner_user_id") REFERENCES "public"."blog_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_versions" ADD CONSTRAINT "blog_versions_artifact_package_owner_fk" FOREIGN KEY ("blog_id","content_package_id","owner_user_id") REFERENCES "public"."blog_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_versions" ADD CONSTRAINT "blog_versions_parent_blog_fk" FOREIGN KEY ("parent_version_id","blog_id") REFERENCES "public"."blog_versions"("id","blog_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_versions" ADD CONSTRAINT "blog_versions_research_version_fk" FOREIGN KEY ("research_version_id") REFERENCES "public"."research_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_versions" ADD CONSTRAINT "blog_versions_opinion_version_fk" FOREIGN KEY ("opinion_version_id") REFERENCES "public"."opinion_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_working_copies" ADD CONSTRAINT "blog_working_copies_artifact_package_owner_fk" FOREIGN KEY ("blog_id","content_package_id","owner_user_id") REFERENCES "public"."blog_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_working_copies" ADD CONSTRAINT "blog_working_copies_base_version_fk" FOREIGN KEY ("base_version_id","blog_id") REFERENCES "public"."blog_versions"("id","blog_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opinion_artifacts" ADD CONSTRAINT "opinion_artifacts_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opinion_drafts" ADD CONSTRAINT "opinion_drafts_artifact_package_owner_fk" FOREIGN KEY ("opinion_id","content_package_id","owner_user_id") REFERENCES "public"."opinion_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opinion_drafts" ADD CONSTRAINT "opinion_drafts_research_version_fk" FOREIGN KEY ("research_version_id") REFERENCES "public"."research_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opinion_heads" ADD CONSTRAINT "opinion_heads_artifact_package_owner_fk" FOREIGN KEY ("opinion_id","content_package_id","owner_user_id") REFERENCES "public"."opinion_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opinion_heads" ADD CONSTRAINT "opinion_heads_confirmed_version_fk" FOREIGN KEY ("confirmed_version_id","opinion_id") REFERENCES "public"."opinion_versions"("id","opinion_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opinion_versions" ADD CONSTRAINT "opinion_versions_artifact_package_owner_fk" FOREIGN KEY ("opinion_id","content_package_id","owner_user_id") REFERENCES "public"."opinion_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opinion_versions" ADD CONSTRAINT "opinion_versions_research_version_fk" FOREIGN KEY ("research_version_id") REFERENCES "public"."research_versions"("id") ON DELETE restrict ON UPDATE no action;