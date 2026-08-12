CREATE TABLE "xiaohongshu_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"artifact_id" uuid NOT NULL,
	"approved_version_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"validation_summary" jsonb NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "xiaohongshu_approvals_artifact_version_unique" UNIQUE("artifact_id","approved_version_id"),
	CONSTRAINT "xiaohongshu_approvals_summary_check" CHECK (jsonb_typeof("xiaohongshu_approvals"."validation_summary") = 'object')
);
--> statement-breakpoint
CREATE TABLE "xiaohongshu_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"provider_alias" varchar(100) NOT NULL,
	"raw_output" text NOT NULL,
	"artifact_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "xiaohongshu_runs_request_owner_unique" UNIQUE("request_id","owner_user_id"),
	CONSTRAINT "xiaohongshu_runs_raw_output_check" CHECK (octet_length("xiaohongshu_runs"."raw_output") BETWEEN 0 AND 1000000)
);
--> statement-breakpoint
CREATE TABLE "xiaohongshu_states" (
	"artifact_id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"working_copy_id" uuid NOT NULL,
	"body" jsonb NOT NULL,
	"plan" jsonb NOT NULL,
	"revision" integer NOT NULL,
	"checkpointed_revision" integer,
	"latest_version_id" uuid NOT NULL,
	"approved_version_id" uuid,
	"approval_validation_summary" jsonb,
	"research_version_id" uuid NOT NULL,
	"opinion_version_id" uuid,
	"content_mode" varchar(32) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "xiaohongshu_states_package_unique" UNIQUE("content_package_id"),
	CONSTRAINT "xiaohongshu_states_artifact_package_owner_unique" UNIQUE("artifact_id","content_package_id","owner_user_id"),
	CONSTRAINT "xiaohongshu_states_revision_check" CHECK ("xiaohongshu_states"."revision" >= 1),
	CONSTRAINT "xiaohongshu_states_mode_check" CHECK ("xiaohongshu_states"."content_mode" IN ('creator_led', 'research_based'))
);
--> statement-breakpoint
CREATE TABLE "xiaohongshu_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"artifact_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"body" jsonb NOT NULL,
	"plan" jsonb NOT NULL,
	"research_version_id" uuid NOT NULL,
	"opinion_version_id" uuid,
	"content_mode" varchar(32) NOT NULL,
	"origin" varchar(32) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "xiaohongshu_versions_artifact_number_unique" UNIQUE("artifact_id","version_number"),
	CONSTRAINT "xiaohongshu_versions_number_check" CHECK ("xiaohongshu_versions"."version_number" >= 1),
	CONSTRAINT "xiaohongshu_versions_mode_check" CHECK ("xiaohongshu_versions"."content_mode" IN ('creator_led', 'research_based')),
	CONSTRAINT "xiaohongshu_versions_origin_check" CHECK ("xiaohongshu_versions"."origin" IN ('generated', 'user_checkpoint'))
);
--> statement-breakpoint
ALTER TABLE "xiaohongshu_approvals" ADD CONSTRAINT "xiaohongshu_approvals_version_fk" FOREIGN KEY ("approved_version_id") REFERENCES "public"."xiaohongshu_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xiaohongshu_runs" ADD CONSTRAINT "xiaohongshu_runs_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xiaohongshu_states" ADD CONSTRAINT "xiaohongshu_states_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xiaohongshu_states" ADD CONSTRAINT "xiaohongshu_states_research_version_fk" FOREIGN KEY ("research_version_id") REFERENCES "public"."research_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xiaohongshu_states" ADD CONSTRAINT "xiaohongshu_states_opinion_version_fk" FOREIGN KEY ("opinion_version_id") REFERENCES "public"."opinion_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xiaohongshu_versions" ADD CONSTRAINT "xiaohongshu_versions_state_fk" FOREIGN KEY ("artifact_id","content_package_id","owner_user_id") REFERENCES "public"."xiaohongshu_states"("artifact_id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xiaohongshu_versions" ADD CONSTRAINT "xiaohongshu_versions_research_version_fk" FOREIGN KEY ("research_version_id") REFERENCES "public"."research_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xiaohongshu_versions" ADD CONSTRAINT "xiaohongshu_versions_opinion_version_fk" FOREIGN KEY ("opinion_version_id") REFERENCES "public"."opinion_versions"("id") ON DELETE restrict ON UPDATE no action;