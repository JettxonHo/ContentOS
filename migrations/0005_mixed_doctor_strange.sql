CREATE TABLE "url_capture_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_reference_id" uuid NOT NULL,
	"workflow_instance_id" uuid NOT NULL,
	"workflow_node_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"expected_package_revision" integer NOT NULL,
	"command_kind" varchar(64) NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"request_fingerprint" char(64) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "url_capture_requests_id_package_owner_unique" UNIQUE("id","content_package_id","owner_user_id"),
	CONSTRAINT "url_capture_requests_source_reference_unique" UNIQUE("source_reference_id"),
	CONSTRAINT "url_capture_requests_node_unique" UNIQUE("workflow_node_id"),
	CONSTRAINT "url_capture_requests_owner_package_kind_key_unique" UNIQUE("owner_user_id","content_package_id","command_kind","idempotency_key"),
	CONSTRAINT "url_capture_requests_expected_revision_check" CHECK ("url_capture_requests"."expected_package_revision" >= 1),
	CONSTRAINT "url_capture_requests_command_kind_check" CHECK ("url_capture_requests"."command_kind" = 'url_capture_request'),
	CONSTRAINT "url_capture_requests_idempotency_key_check" CHECK ("url_capture_requests"."idempotency_key" ~ '^[A-Za-z0-9_-]{16,128}$'),
	CONSTRAINT "url_capture_requests_fingerprint_check" CHECK ("url_capture_requests"."request_fingerprint" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "url_source_references" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"role" varchar(16) NOT NULL,
	"submitted_url" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "url_source_references_id_package_owner_unique" UNIQUE("id","content_package_id","owner_user_id"),
	CONSTRAINT "url_source_references_role_check" CHECK ("url_source_references"."role" IN ('primary', 'supporting')),
	CONSTRAINT "url_source_references_submitted_url_check" CHECK (btrim("url_source_references"."submitted_url") = "url_source_references"."submitted_url" AND octet_length("url_source_references"."submitted_url") BETWEEN 1 AND 2048 AND "url_source_references"."submitted_url" !~ '[[:cntrl:]]')
);
--> statement-breakpoint
CREATE TABLE "workflow_outbox_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"task_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"category" varchar(32) NOT NULL,
	"envelope_version" varchar(32) NOT NULL,
	"payload" jsonb NOT NULL,
	"state" varchar(16) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workflow_outbox_records_id_task_owner_unique" UNIQUE("id","task_id","owner_user_id"),
	CONSTRAINT "workflow_outbox_records_task_unique" UNIQUE("task_id"),
	CONSTRAINT "workflow_outbox_records_category_check" CHECK ("workflow_outbox_records"."category" = 'fetcher'),
	CONSTRAINT "workflow_outbox_records_envelope_version_check" CHECK ("workflow_outbox_records"."envelope_version" = 'fetcher-task/v1'),
	CONSTRAINT "workflow_outbox_records_state_check" CHECK ("workflow_outbox_records"."state" = 'pending'),
	CONSTRAINT "workflow_outbox_records_payload_object_check" CHECK (jsonb_typeof("workflow_outbox_records"."payload") = 'object'),
	CONSTRAINT "workflow_outbox_records_payload_shape_check" CHECK ("workflow_outbox_records"."payload" ?& ARRAY['taskId', 'taskKind', 'envelopeVersion'] AND ("workflow_outbox_records"."payload" - 'taskId' - 'taskKind' - 'envelopeVersion') = '{}'::jsonb AND jsonb_typeof("workflow_outbox_records"."payload"->'taskId') = 'string' AND "workflow_outbox_records"."payload"->>'taskKind' = 'url_capture' AND "workflow_outbox_records"."payload"->>'envelopeVersion' = 'fetcher-task/v1')
);
--> statement-breakpoint
CREATE TABLE "workflow_tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workflow_instance_id" uuid NOT NULL,
	"workflow_node_id" uuid NOT NULL,
	"url_capture_request_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"kind" varchar(32) NOT NULL,
	"state" varchar(16) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workflow_tasks_id_package_owner_unique" UNIQUE("id","content_package_id","owner_user_id"),
	CONSTRAINT "workflow_tasks_request_unique" UNIQUE("url_capture_request_id"),
	CONSTRAINT "workflow_tasks_kind_check" CHECK ("workflow_tasks"."kind" = 'url_capture'),
	CONSTRAINT "workflow_tasks_state_check" CHECK ("workflow_tasks"."state" = 'queued')
);
--> statement-breakpoint
ALTER TABLE "url_capture_requests" ADD CONSTRAINT "url_capture_requests_source_reference_binding_fk" FOREIGN KEY ("source_reference_id","content_package_id","owner_user_id") REFERENCES "public"."url_source_references"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "url_capture_requests" ADD CONSTRAINT "url_capture_requests_instance_binding_fk" FOREIGN KEY ("workflow_instance_id","content_package_id","owner_user_id") REFERENCES "public"."workflow_instances"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "url_capture_requests" ADD CONSTRAINT "url_capture_requests_node_binding_fk" FOREIGN KEY ("workflow_node_id","workflow_instance_id","content_package_id","owner_user_id") REFERENCES "public"."workflow_nodes"("id","workflow_instance_id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "url_source_references" ADD CONSTRAINT "url_source_references_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD CONSTRAINT "workflow_outbox_records_task_binding_fk" FOREIGN KEY ("task_id","content_package_id","owner_user_id") REFERENCES "public"."workflow_tasks"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_instance_binding_fk" FOREIGN KEY ("workflow_instance_id","content_package_id","owner_user_id") REFERENCES "public"."workflow_instances"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_node_binding_fk" FOREIGN KEY ("workflow_node_id","workflow_instance_id","content_package_id","owner_user_id") REFERENCES "public"."workflow_nodes"("id","workflow_instance_id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_request_binding_fk" FOREIGN KEY ("url_capture_request_id","content_package_id","owner_user_id") REFERENCES "public"."url_capture_requests"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "url_capture_requests_owner_package_created_idx" ON "url_capture_requests" USING btree ("owner_user_id","content_package_id","created_at","id");--> statement-breakpoint
CREATE INDEX "url_source_references_owner_package_created_idx" ON "url_source_references" USING btree ("owner_user_id","content_package_id","created_at","id");--> statement-breakpoint
CREATE INDEX "workflow_outbox_records_pending_idx" ON "workflow_outbox_records" USING btree ("state","created_at","id");--> statement-breakpoint
CREATE INDEX "workflow_tasks_owner_package_state_idx" ON "workflow_tasks" USING btree ("owner_user_id","content_package_id","state");