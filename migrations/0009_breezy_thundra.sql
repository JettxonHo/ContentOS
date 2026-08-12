CREATE TABLE "research_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"research_id" uuid NOT NULL,
	"approved_version_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"approved_by_id" uuid NOT NULL,
	"validation_summary" jsonb NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "research_approvals_research_version_unique" UNIQUE("research_id","approved_version_id"),
	CONSTRAINT "research_approvals_owner_check" CHECK ("research_approvals"."approved_by_id" = "research_approvals"."owner_user_id"),
	CONSTRAINT "research_approvals_validation_summary_check" CHECK (jsonb_typeof("research_approvals"."validation_summary") = 'object')
);
--> statement-breakpoint
CREATE TABLE "research_artifacts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "research_artifacts_package_unique" UNIQUE("content_package_id"),
	CONSTRAINT "research_artifacts_id_package_owner_unique" UNIQUE("id","content_package_id","owner_user_id")
);
--> statement-breakpoint
CREATE TABLE "research_heads" (
	"research_id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"working_copy_id" uuid NOT NULL,
	"latest_version_id" uuid NOT NULL,
	"review_candidate_version_id" uuid NOT NULL,
	"approved_version_id" uuid,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"provider_alias" varchar(100) NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"raw_output" text NOT NULL,
	"state" varchar(16) NOT NULL,
	"safe_error_code" varchar(64),
	"research_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "research_runs_request_owner_unique" UNIQUE("request_id","owner_user_id"),
	CONSTRAINT "research_runs_state_check" CHECK ("research_runs"."state" IN ('succeeded', 'failed')),
	CONSTRAINT "research_runs_provider_alias_check" CHECK (char_length("research_runs"."provider_alias") BETWEEN 1 AND 100),
	CONSTRAINT "research_runs_raw_output_check" CHECK (octet_length("research_runs"."raw_output") BETWEEN 0 AND 1000000),
	CONSTRAINT "research_runs_state_fields_check" CHECK (("research_runs"."state" = 'succeeded' AND "research_runs"."safe_error_code" IS NULL AND "research_runs"."research_id" IS NOT NULL) OR ("research_runs"."state" = 'failed' AND "research_runs"."safe_error_code" IS NOT NULL AND "research_runs"."research_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "research_version_sources" (
	"research_version_id" uuid NOT NULL,
	"research_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"source_version_id" uuid NOT NULL,
	"role" varchar(16) NOT NULL,
	"label" varchar(200),
	"ordinal" integer NOT NULL,
	CONSTRAINT "research_version_sources_research_version_id_source_id_pk" PRIMARY KEY("research_version_id","source_id"),
	CONSTRAINT "research_version_sources_version_ordinal_unique" UNIQUE("research_version_id","ordinal"),
	CONSTRAINT "research_version_sources_role_check" CHECK ("research_version_sources"."role" IN ('primary', 'supporting')),
	CONSTRAINT "research_version_sources_ordinal_check" CHECK ("research_version_sources"."ordinal" BETWEEN 1 AND 6)
);
--> statement-breakpoint
CREATE TABLE "research_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"research_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"parent_version_id" uuid,
	"body" jsonb NOT NULL,
	"content_hash" char(64) NOT NULL,
	"schema_version" varchar(32) NOT NULL,
	"origin" varchar(32) NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "research_versions_id_research_unique" UNIQUE("id","research_id"),
	CONSTRAINT "research_versions_id_research_package_owner_unique" UNIQUE("id","research_id","content_package_id","owner_user_id"),
	CONSTRAINT "research_versions_research_number_unique" UNIQUE("research_id","version_number"),
	CONSTRAINT "research_versions_number_check" CHECK ("research_versions"."version_number" >= 1),
	CONSTRAINT "research_versions_body_check" CHECK (jsonb_typeof("research_versions"."body") = 'object'),
	CONSTRAINT "research_versions_hash_check" CHECK ("research_versions"."content_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "research_versions_schema_check" CHECK ("research_versions"."schema_version" = 'research/v1'),
	CONSTRAINT "research_versions_origin_check" CHECK ("research_versions"."origin" IN ('generated', 'user_checkpoint'))
);
--> statement-breakpoint
CREATE TABLE "research_working_copies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"research_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"body" jsonb NOT NULL,
	"schema_version" varchar(32) NOT NULL,
	"revision" integer NOT NULL,
	"checkpointed_revision" integer,
	"base_version_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "research_working_copies_research_unique" UNIQUE("research_id"),
	CONSTRAINT "research_working_copies_id_research_unique" UNIQUE("id","research_id"),
	CONSTRAINT "research_working_copies_revision_check" CHECK ("research_working_copies"."revision" >= 1),
	CONSTRAINT "research_working_copies_checkpoint_check" CHECK ("research_working_copies"."checkpointed_revision" IS NULL OR "research_working_copies"."checkpointed_revision" BETWEEN 1 AND "research_working_copies"."revision"),
	CONSTRAINT "research_working_copies_body_check" CHECK (jsonb_typeof("research_working_copies"."body") = 'object'),
	CONSTRAINT "research_working_copies_schema_check" CHECK ("research_working_copies"."schema_version" = 'research/v1')
);
--> statement-breakpoint
ALTER TABLE "research_approvals" ADD CONSTRAINT "research_approvals_artifact_package_owner_fk" FOREIGN KEY ("research_id","content_package_id","owner_user_id") REFERENCES "public"."research_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_approvals" ADD CONSTRAINT "research_approvals_version_research_fk" FOREIGN KEY ("approved_version_id","research_id") REFERENCES "public"."research_versions"("id","research_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_artifacts" ADD CONSTRAINT "research_artifacts_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_heads" ADD CONSTRAINT "research_heads_artifact_package_owner_fk" FOREIGN KEY ("research_id","content_package_id","owner_user_id") REFERENCES "public"."research_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_heads" ADD CONSTRAINT "research_heads_working_copy_fk" FOREIGN KEY ("working_copy_id","research_id") REFERENCES "public"."research_working_copies"("id","research_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_heads" ADD CONSTRAINT "research_heads_latest_version_fk" FOREIGN KEY ("latest_version_id","research_id") REFERENCES "public"."research_versions"("id","research_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_heads" ADD CONSTRAINT "research_heads_review_version_fk" FOREIGN KEY ("review_candidate_version_id","research_id") REFERENCES "public"."research_versions"("id","research_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_heads" ADD CONSTRAINT "research_heads_approved_version_fk" FOREIGN KEY ("approved_version_id","research_id") REFERENCES "public"."research_versions"("id","research_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_artifact_package_owner_fk" FOREIGN KEY ("research_id","content_package_id","owner_user_id") REFERENCES "public"."research_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_version_sources" ADD CONSTRAINT "research_version_sources_research_version_fk" FOREIGN KEY ("research_version_id","research_id") REFERENCES "public"."research_versions"("id","research_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_version_sources" ADD CONSTRAINT "research_version_sources_source_version_fk" FOREIGN KEY ("source_version_id","source_id") REFERENCES "public"."source_versions"("id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_versions" ADD CONSTRAINT "research_versions_artifact_package_owner_fk" FOREIGN KEY ("research_id","content_package_id","owner_user_id") REFERENCES "public"."research_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_versions" ADD CONSTRAINT "research_versions_parent_research_fk" FOREIGN KEY ("parent_version_id","research_id") REFERENCES "public"."research_versions"("id","research_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_working_copies" ADD CONSTRAINT "research_working_copies_artifact_package_owner_fk" FOREIGN KEY ("research_id","content_package_id","owner_user_id") REFERENCES "public"."research_artifacts"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_working_copies" ADD CONSTRAINT "research_working_copies_base_version_fk" FOREIGN KEY ("base_version_id","research_id") REFERENCES "public"."research_versions"("id","research_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "research_artifacts_owner_idx" ON "research_artifacts" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "research_runs_owner_package_idx" ON "research_runs" USING btree ("owner_user_id","content_package_id","created_at");--> statement-breakpoint
CREATE INDEX "research_versions_owner_package_idx" ON "research_versions" USING btree ("owner_user_id","content_package_id");
