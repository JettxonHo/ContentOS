CREATE TABLE "url_capture_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"task_id" uuid NOT NULL,
	"url_capture_request_id" uuid NOT NULL,
	"source_reference_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"claim_hash" char(64) NOT NULL,
	"result_version" varchar(32) NOT NULL,
	"submitted_payload_sha256" char(64) NOT NULL,
	"submitted_outcome" varchar(16) NOT NULL,
	"submitted_category" varchar(32),
	"recorded_outcome" varchar(16) NOT NULL,
	"recorded_category" varchar(32),
	"safe_code" varchar(32),
	"source_id" uuid,
	"snapshot_id" uuid,
	"success_evidence" jsonb,
	"accepted_at" timestamp with time zone NOT NULL,
	CONSTRAINT "url_capture_results_task_unique" UNIQUE("task_id"),
	CONSTRAINT "url_capture_results_id_task_owner_unique" UNIQUE("id","task_id","owner_user_id"),
	CONSTRAINT "url_capture_results_attempt_number_check" CHECK ("url_capture_results"."attempt_number" >= 1),
	CONSTRAINT "url_capture_results_claim_hash_format_check" CHECK ("url_capture_results"."claim_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "url_capture_results_result_version_check" CHECK ("url_capture_results"."result_version" = 'fetcher-result/v1'),
	CONSTRAINT "url_capture_results_payload_sha256_format_check" CHECK ("url_capture_results"."submitted_payload_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "url_capture_results_submitted_outcome_check" CHECK ("url_capture_results"."submitted_outcome" IN ('succeeded', 'failed')),
	CONSTRAINT "url_capture_results_recorded_outcome_check" CHECK ("url_capture_results"."recorded_outcome" IN ('succeeded', 'failed')),
	CONSTRAINT "url_capture_results_submitted_category_check" CHECK ("url_capture_results"."submitted_category" IS NULL OR "url_capture_results"."submitted_category" IN ('fetch_failed', 'validation_blocked', 'unsupported_content', 'too_large', 'timeout', 'redirect_blocked', 'extraction_failed')),
	CONSTRAINT "url_capture_results_recorded_category_check" CHECK ("url_capture_results"."recorded_category" IS NULL OR "url_capture_results"."recorded_category" IN ('fetch_failed', 'validation_blocked', 'unsupported_content', 'too_large', 'timeout', 'redirect_blocked', 'extraction_failed', 'package_archived', 'source_role_limit', 'object_integrity_failed')),
	CONSTRAINT "url_capture_results_safe_code_check" CHECK ("url_capture_results"."safe_code" IS NULL OR "url_capture_results"."safe_code" IN ('FETCH_FAILED', 'VALIDATION_BLOCKED', 'UNSUPPORTED_CONTENT', 'TOO_LARGE', 'TIMEOUT', 'REDIRECT_BLOCKED', 'EXTRACTION_FAILED', 'PACKAGE_ARCHIVED', 'SOURCE_ROLE_LIMIT', 'OBJECT_INTEGRITY_FAILED')),
	CONSTRAINT "url_capture_results_submitted_classification_check" CHECK (("url_capture_results"."submitted_outcome" = 'succeeded' AND "url_capture_results"."submitted_category" IS NULL AND "url_capture_results"."success_evidence" IS NOT NULL) OR ("url_capture_results"."submitted_outcome" = 'failed' AND "url_capture_results"."submitted_category" IS NOT NULL AND "url_capture_results"."success_evidence" IS NULL)),
	CONSTRAINT "url_capture_results_recorded_classification_check" CHECK (("url_capture_results"."recorded_outcome" = 'succeeded' AND "url_capture_results"."recorded_category" IS NULL AND "url_capture_results"."safe_code" IS NULL AND "url_capture_results"."source_id" IS NOT NULL AND "url_capture_results"."snapshot_id" IS NOT NULL) OR ("url_capture_results"."recorded_outcome" = 'failed' AND "url_capture_results"."recorded_category" IS NOT NULL AND "url_capture_results"."safe_code" IS NOT NULL AND "url_capture_results"."source_id" IS NULL AND "url_capture_results"."snapshot_id" IS NULL)),
	CONSTRAINT "url_capture_results_success_requires_success_submission_check" CHECK ("url_capture_results"."recorded_outcome" = 'failed' OR "url_capture_results"."submitted_outcome" = 'succeeded'),
	CONSTRAINT "url_capture_results_source_binding_check" CHECK ("url_capture_results"."source_id" IS NULL OR "url_capture_results"."source_id" = "url_capture_results"."source_reference_id"),
	CONSTRAINT "url_capture_results_evidence_object_check" CHECK ("url_capture_results"."success_evidence" IS NULL OR jsonb_typeof("url_capture_results"."success_evidence") = 'object'),
	CONSTRAINT "url_capture_results_evidence_shape_check" CHECK ("url_capture_results"."success_evidence" IS NULL OR ("url_capture_results"."success_evidence" ?& ARRAY['snapshot', 'capture', 'candidate'] AND ("url_capture_results"."success_evidence" - 'snapshot' - 'capture' - 'candidate') = '{}'::jsonb AND jsonb_typeof("url_capture_results"."success_evidence"->'snapshot') = 'object' AND ("url_capture_results"."success_evidence"->'snapshot') ?& ARRAY['snapshotId', 'storageKey', 'sha256', 'byteSize', 'contentType', 'contentEncoding'] AND ((("url_capture_results"."success_evidence"->'snapshot') - 'snapshotId') - 'storageKey' - 'sha256' - 'byteSize' - 'contentType' - 'contentEncoding') = '{}'::jsonb AND jsonb_typeof("url_capture_results"."success_evidence"->'capture') = 'object' AND ("url_capture_results"."success_evidence"->'capture') ?& ARRAY['finalUrl', 'redirects', 'responseStatus', 'encodedByteSize', 'decodedByteSize'] AND ((("url_capture_results"."success_evidence"->'capture') - 'finalUrl') - 'redirects' - 'responseStatus' - 'encodedByteSize' - 'decodedByteSize') = '{}'::jsonb AND jsonb_typeof("url_capture_results"."success_evidence"->'candidate') = 'object' AND ("url_capture_results"."success_evidence"->'candidate') ?& ARRAY['schemaVersion', 'text'] AND ((("url_capture_results"."success_evidence"->'candidate') - 'schemaVersion') - 'text') = '{}'::jsonb))
);
--> statement-breakpoint
ALTER TABLE "source_raw_snapshots" DROP CONSTRAINT "source_raw_snapshots_byte_size_check";--> statement-breakpoint
ALTER TABLE "source_raw_snapshots" DROP CONSTRAINT "source_raw_snapshots_content_type_check";--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_source_type_check";--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_capture_type_check";--> statement-breakpoint
ALTER TABLE "workflow_tasks" DROP CONSTRAINT "workflow_tasks_state_check";--> statement-breakpoint
ALTER TABLE "workflow_tasks" DROP CONSTRAINT "workflow_tasks_lease_state_check";--> statement-breakpoint
ALTER TABLE "url_capture_results" ADD CONSTRAINT "url_capture_results_task_binding_fk" FOREIGN KEY ("task_id","content_package_id","owner_user_id") REFERENCES "public"."workflow_tasks"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "url_capture_results" ADD CONSTRAINT "url_capture_results_request_binding_fk" FOREIGN KEY ("url_capture_request_id","content_package_id","owner_user_id") REFERENCES "public"."url_capture_requests"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "url_capture_results" ADD CONSTRAINT "url_capture_results_reference_binding_fk" FOREIGN KEY ("source_reference_id","content_package_id","owner_user_id") REFERENCES "public"."url_source_references"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "url_capture_results" ADD CONSTRAINT "url_capture_results_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "url_capture_results_owner_package_idx" ON "url_capture_results" USING btree ("owner_user_id","content_package_id");--> statement-breakpoint
ALTER TABLE "source_raw_snapshots" ADD CONSTRAINT "source_raw_snapshots_byte_size_check" CHECK ("source_raw_snapshots"."byte_size" BETWEEN 1 AND 2097152);--> statement-breakpoint
ALTER TABLE "source_raw_snapshots" ADD CONSTRAINT "source_raw_snapshots_content_type_check" CHECK ("source_raw_snapshots"."content_type" IN ('text/html', 'text/plain', 'text/markdown', concat('text/plain', chr(59), ' charset=utf-8'), concat('text/markdown', chr(59), ' charset=utf-8')));--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_source_type_check" CHECK ("sources"."source_type" IN ('pasted_text', 'uploaded_text', 'public_url'));--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_capture_type_check" CHECK ("sources"."capture_type" IN ('pasted_text', 'uploaded_text', 'public_url'));--> statement-breakpoint
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_state_check" CHECK ("workflow_tasks"."state" IN ('queued', 'leased', 'succeeded', 'failed'));--> statement-breakpoint
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_lease_state_check" CHECK (("workflow_tasks"."state" = 'queued' AND "workflow_tasks"."claim_hash" IS NULL AND "workflow_tasks"."claimed_by" IS NULL AND "workflow_tasks"."lease_started_at" IS NULL AND "workflow_tasks"."lease_expires_at" IS NULL AND "workflow_tasks"."lease_heartbeat_at" IS NULL) OR ("workflow_tasks"."state" = 'leased' AND "workflow_tasks"."claim_attempt_number" >= 1 AND "workflow_tasks"."claim_hash" IS NOT NULL AND "workflow_tasks"."claimed_by" = 'fetcher' AND "workflow_tasks"."lease_started_at" IS NOT NULL AND "workflow_tasks"."lease_expires_at" IS NOT NULL AND "workflow_tasks"."lease_heartbeat_at" IS NOT NULL AND "workflow_tasks"."lease_started_at" <= "workflow_tasks"."lease_heartbeat_at" AND "workflow_tasks"."lease_heartbeat_at" < "workflow_tasks"."lease_expires_at") OR ("workflow_tasks"."state" IN ('succeeded', 'failed') AND "workflow_tasks"."claim_attempt_number" >= 1 AND "workflow_tasks"."claim_hash" IS NULL AND "workflow_tasks"."claimed_by" IS NULL AND "workflow_tasks"."lease_started_at" IS NULL AND "workflow_tasks"."lease_expires_at" IS NULL AND "workflow_tasks"."lease_heartbeat_at" IS NULL));