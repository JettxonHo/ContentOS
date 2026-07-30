CREATE TABLE "source_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"approved_version_id" uuid NOT NULL,
	"approved_by_id" uuid NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"validation_summary" varchar(200) NOT NULL,
	CONSTRAINT "source_approvals_owner_approver_check" CHECK ("source_approvals"."approved_by_id" = "source_approvals"."owner_user_id"),
	CONSTRAINT "source_approvals_validation_summary_nonempty_check" CHECK (char_length("source_approvals"."validation_summary") BETWEEN 1 AND 200)
);
--> statement-breakpoint
CREATE TABLE "source_heads" (
	"source_id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"working_copy_id" uuid NOT NULL,
	"latest_version_id" uuid,
	"review_candidate_version_id" uuid,
	"approved_version_id" uuid,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_raw_snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"sha256" char(64) NOT NULL,
	"byte_size" integer NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	CONSTRAINT "source_raw_snapshots_source_unique" UNIQUE("source_id"),
	CONSTRAINT "source_raw_snapshots_id_source_unique" UNIQUE("id","source_id"),
	CONSTRAINT "source_raw_snapshots_sha256_format_check" CHECK ("source_raw_snapshots"."sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "source_raw_snapshots_byte_size_check" CHECK ("source_raw_snapshots"."byte_size" BETWEEN 1 AND 100000),
	CONSTRAINT "source_raw_snapshots_content_type_check" CHECK ("source_raw_snapshots"."content_type" = concat('text/plain', chr(59), ' charset=utf-8'))
);
--> statement-breakpoint
CREATE TABLE "source_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"parent_version_id" uuid,
	"body" jsonb NOT NULL,
	"content_hash" char(64) NOT NULL,
	"schema_version" varchar(32) NOT NULL,
	"raw_snapshot_id" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "source_versions_id_source_unique" UNIQUE("id","source_id"),
	CONSTRAINT "source_versions_version_number_check" CHECK ("source_versions"."version_number" >= 1),
	CONSTRAINT "source_versions_body_object_check" CHECK (jsonb_typeof("source_versions"."body") = 'object'),
	CONSTRAINT "source_versions_body_keys_check" CHECK ("source_versions"."body" ? 'text' AND ("source_versions"."body" - 'text') = '{}'::jsonb),
	CONSTRAINT "source_versions_body_text_type_check" CHECK (jsonb_typeof("source_versions"."body"->'text') = 'string'),
	CONSTRAINT "source_versions_body_text_check" CHECK (btrim("source_versions"."body"->>'text') <> '' AND octet_length("source_versions"."body"->>'text') BETWEEN 1 AND 100000),
	CONSTRAINT "source_versions_schema_version_check" CHECK ("source_versions"."schema_version" = 'source/normalized/v1'),
	CONSTRAINT "source_versions_content_hash_format_check" CHECK ("source_versions"."content_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "source_working_copies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"body" jsonb NOT NULL,
	"schema_version" varchar(32) NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"checkpointed_revision" integer,
	"base_version_id" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "source_working_copies_id_source_unique" UNIQUE("id","source_id"),
	CONSTRAINT "source_working_copies_revision_check" CHECK ("source_working_copies"."revision" >= 1),
	CONSTRAINT "source_working_copies_checkpoint_revision_check" CHECK ("source_working_copies"."checkpointed_revision" IS NULL OR "source_working_copies"."checkpointed_revision" BETWEEN 1 AND "source_working_copies"."revision"),
	CONSTRAINT "source_working_copies_body_object_check" CHECK (jsonb_typeof("source_working_copies"."body") = 'object'),
	CONSTRAINT "source_working_copies_body_keys_check" CHECK ("source_working_copies"."body" ? 'text' AND ("source_working_copies"."body" - 'text') = '{}'::jsonb),
	CONSTRAINT "source_working_copies_body_text_type_check" CHECK (jsonb_typeof("source_working_copies"."body"->'text') = 'string'),
	CONSTRAINT "source_working_copies_body_text_check" CHECK (btrim("source_working_copies"."body"->>'text') <> '' AND octet_length("source_working_copies"."body"->>'text') BETWEEN 1 AND 100000),
	CONSTRAINT "source_working_copies_schema_version_check" CHECK ("source_working_copies"."schema_version" = 'source/normalized/v1')
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"source_type" varchar(32) NOT NULL,
	"role" varchar(16) NOT NULL,
	"label" varchar(200),
	"capture_type" varchar(32) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sources_id_owner_unique" UNIQUE("id","owner_user_id"),
	CONSTRAINT "sources_source_type_check" CHECK ("sources"."source_type" IN ('pasted_text')),
	CONSTRAINT "sources_role_check" CHECK ("sources"."role" IN ('primary', 'supporting')),
	CONSTRAINT "sources_capture_type_check" CHECK ("sources"."capture_type" IN ('pasted_text')),
	CONSTRAINT "sources_label_length_check" CHECK ("sources"."label" IS NULL OR char_length("sources"."label") BETWEEN 1 AND 200)
);
--> statement-breakpoint
ALTER TABLE "content_packages" ADD CONSTRAINT "content_packages_id_owner_unique" UNIQUE("id","owner_user_id");
--> statement-breakpoint
ALTER TABLE "source_approvals" ADD CONSTRAINT "source_approvals_source_owner_fk" FOREIGN KEY ("source_id","owner_user_id") REFERENCES "public"."sources"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_approvals" ADD CONSTRAINT "source_approvals_version_source_fk" FOREIGN KEY ("approved_version_id","source_id") REFERENCES "public"."source_versions"("id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_heads" ADD CONSTRAINT "source_heads_source_owner_fk" FOREIGN KEY ("source_id","owner_user_id") REFERENCES "public"."sources"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_heads" ADD CONSTRAINT "source_heads_wc_source_fk" FOREIGN KEY ("working_copy_id","source_id") REFERENCES "public"."source_working_copies"("id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_heads" ADD CONSTRAINT "source_heads_latest_version_source_fk" FOREIGN KEY ("latest_version_id","source_id") REFERENCES "public"."source_versions"("id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_heads" ADD CONSTRAINT "source_heads_review_candidate_source_fk" FOREIGN KEY ("review_candidate_version_id","source_id") REFERENCES "public"."source_versions"("id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_heads" ADD CONSTRAINT "source_heads_approved_version_source_fk" FOREIGN KEY ("approved_version_id","source_id") REFERENCES "public"."source_versions"("id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_raw_snapshots" ADD CONSTRAINT "source_raw_snapshots_source_owner_fk" FOREIGN KEY ("source_id","owner_user_id") REFERENCES "public"."sources"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_source_owner_fk" FOREIGN KEY ("source_id","owner_user_id") REFERENCES "public"."sources"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_parent_source_fk" FOREIGN KEY ("parent_version_id","source_id") REFERENCES "public"."source_versions"("id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_snapshot_source_fk" FOREIGN KEY ("raw_snapshot_id","source_id") REFERENCES "public"."source_raw_snapshots"("id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_working_copies" ADD CONSTRAINT "source_working_copies_source_owner_fk" FOREIGN KEY ("source_id","owner_user_id") REFERENCES "public"."sources"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_working_copies" ADD CONSTRAINT "source_working_copies_base_version_source_fk" FOREIGN KEY ("base_version_id","source_id") REFERENCES "public"."source_versions"("id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "source_approvals_source_version_unique_idx" ON "source_approvals" USING btree ("source_id","approved_version_id");--> statement-breakpoint
CREATE INDEX "source_approvals_source_idx" ON "source_approvals" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_approvals_owner_idx" ON "source_approvals" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "source_heads_owner_idx" ON "source_heads" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "source_raw_snapshots_storage_key_unique" ON "source_raw_snapshots" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "source_raw_snapshots_source_idx" ON "source_raw_snapshots" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_raw_snapshots_owner_idx" ON "source_raw_snapshots" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "source_versions_source_number_unique_idx" ON "source_versions" USING btree ("source_id","version_number");--> statement-breakpoint
CREATE INDEX "source_versions_source_idx" ON "source_versions" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_versions_owner_idx" ON "source_versions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "source_working_copies_source_unique_idx" ON "source_working_copies" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_working_copies_owner_idx" ON "source_working_copies" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "sources_owner_package_created_idx" ON "sources" USING btree ("owner_user_id","content_package_id","created_at","id");--> statement-breakpoint
CREATE INDEX "sources_package_idx" ON "sources" USING btree ("content_package_id");
