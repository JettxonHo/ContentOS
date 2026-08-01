CREATE TABLE "workflow_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workflow_instance_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"event_type" varchar(128) NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"workflow_node_id" uuid,
	CONSTRAINT "workflow_events_instance_sequence_unique" UNIQUE("workflow_instance_id","sequence"),
	CONSTRAINT "workflow_events_sequence_check" CHECK ("workflow_events"."sequence" >= 1),
	CONSTRAINT "workflow_events_type_nonempty_check" CHECK (btrim("workflow_events"."event_type") <> '' AND char_length("workflow_events"."event_type") BETWEEN 1 AND 128),
	CONSTRAINT "workflow_events_payload_object_check" CHECK (jsonb_typeof("workflow_events"."payload") = 'object')
);
--> statement-breakpoint
CREATE TABLE "workflow_instances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"template_id" varchar(128) NOT NULL,
	"template_version" varchar(32) NOT NULL,
	"definition_sha256" char(64) NOT NULL,
	"lifecycle" varchar(16) NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workflow_instances_id_package_owner_unique" UNIQUE("id","content_package_id","owner_user_id"),
	CONSTRAINT "workflow_instances_node_binding_unique" UNIQUE("id","content_package_id","owner_user_id","template_id","template_version"),
	CONSTRAINT "workflow_instances_package_template_unique" UNIQUE("content_package_id","template_id","template_version"),
	CONSTRAINT "workflow_instances_definition_sha256_format_check" CHECK ("workflow_instances"."definition_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "workflow_instances_lifecycle_check" CHECK ("workflow_instances"."lifecycle" IN ('active', 'paused', 'completed', 'failed', 'cancelled')),
	CONSTRAINT "workflow_instances_revision_check" CHECK ("workflow_instances"."revision" >= 1)
);
--> statement-breakpoint
CREATE TABLE "workflow_nodes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workflow_instance_id" uuid NOT NULL,
	"content_package_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"template_id" varchar(128) NOT NULL,
	"template_version" varchar(32) NOT NULL,
	"template_node_key" varchar(128) NOT NULL,
	"state" varchar(32) NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workflow_nodes_id_binding_unique" UNIQUE("id","workflow_instance_id","content_package_id","owner_user_id"),
	CONSTRAINT "workflow_nodes_instance_key_unique" UNIQUE("workflow_instance_id","template_node_key"),
	CONSTRAINT "workflow_nodes_key_nonempty_check" CHECK (btrim("workflow_nodes"."template_node_key") <> '' AND char_length("workflow_nodes"."template_node_key") BETWEEN 1 AND 128),
	CONSTRAINT "workflow_nodes_state_check" CHECK ("workflow_nodes"."state" IN ('not_ready', 'ready', 'running', 'awaiting_human', 'completed', 'failed', 'skipped', 'cancelled')),
	CONSTRAINT "workflow_nodes_revision_check" CHECK ("workflow_nodes"."revision" >= 1)
);
--> statement-breakpoint
CREATE TABLE "workflow_template_edges" (
	"template_id" varchar(128) NOT NULL,
	"template_version" varchar(32) NOT NULL,
	"ordinal" integer NOT NULL,
	"from_node_key" varchar(128) NOT NULL,
	"to_node_key" varchar(128) NOT NULL,
	CONSTRAINT "workflow_template_edges_template_id_template_version_ordinal_pk" PRIMARY KEY("template_id","template_version","ordinal"),
	CONSTRAINT "workflow_template_edges_pair_unique" UNIQUE("template_id","template_version","from_node_key","to_node_key"),
	CONSTRAINT "workflow_template_edges_ordinal_check" CHECK ("workflow_template_edges"."ordinal" >= 1),
	CONSTRAINT "workflow_template_edges_not_self_check" CHECK ("workflow_template_edges"."from_node_key" <> "workflow_template_edges"."to_node_key")
);
--> statement-breakpoint
CREATE TABLE "workflow_template_nodes" (
	"template_id" varchar(128) NOT NULL,
	"template_version" varchar(32) NOT NULL,
	"node_key" varchar(128) NOT NULL,
	"ordinal" integer NOT NULL,
	"kind" varchar(16) NOT NULL,
	"requires_human_gate" boolean NOT NULL,
	CONSTRAINT "workflow_template_nodes_template_id_template_version_node_key_pk" PRIMARY KEY("template_id","template_version","node_key"),
	CONSTRAINT "workflow_template_nodes_template_ordinal_unique" UNIQUE("template_id","template_version","ordinal"),
	CONSTRAINT "workflow_template_nodes_key_nonempty_check" CHECK (btrim("workflow_template_nodes"."node_key") <> '' AND char_length("workflow_template_nodes"."node_key") BETWEEN 1 AND 128),
	CONSTRAINT "workflow_template_nodes_ordinal_check" CHECK ("workflow_template_nodes"."ordinal" >= 1),
	CONSTRAINT "workflow_template_nodes_kind_gate_check" CHECK (("workflow_template_nodes"."kind" = 'work' AND "workflow_template_nodes"."requires_human_gate" = false) OR ("workflow_template_nodes"."kind" = 'gate' AND "workflow_template_nodes"."requires_human_gate" = true))
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"template_id" varchar(128) NOT NULL,
	"template_version" varchar(32) NOT NULL,
	"definition_sha256" char(64) NOT NULL,
	"seeded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workflow_templates_template_id_template_version_pk" PRIMARY KEY("template_id","template_version"),
	CONSTRAINT "workflow_templates_id_version_hash_unique" UNIQUE("template_id","template_version","definition_sha256"),
	CONSTRAINT "workflow_templates_id_nonempty_check" CHECK (btrim("workflow_templates"."template_id") <> '' AND char_length("workflow_templates"."template_id") BETWEEN 1 AND 128),
	CONSTRAINT "workflow_templates_version_nonempty_check" CHECK (btrim("workflow_templates"."template_version") <> '' AND char_length("workflow_templates"."template_version") BETWEEN 1 AND 32),
	CONSTRAINT "workflow_templates_definition_sha256_format_check" CHECK ("workflow_templates"."definition_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_instance_owner_fk" FOREIGN KEY ("workflow_instance_id","content_package_id","owner_user_id") REFERENCES "public"."workflow_instances"("id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_node_instance_owner_fk" FOREIGN KEY ("workflow_node_id","workflow_instance_id","content_package_id","owner_user_id") REFERENCES "public"."workflow_nodes"("id","workflow_instance_id","content_package_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_package_owner_fk" FOREIGN KEY ("content_package_id","owner_user_id") REFERENCES "public"."content_packages"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_template_binding_fk" FOREIGN KEY ("template_id","template_version","definition_sha256") REFERENCES "public"."workflow_templates"("template_id","template_version","definition_sha256") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_instance_binding_fk" FOREIGN KEY ("workflow_instance_id","content_package_id","owner_user_id","template_id","template_version") REFERENCES "public"."workflow_instances"("id","content_package_id","owner_user_id","template_id","template_version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_template_node_fk" FOREIGN KEY ("template_id","template_version","template_node_key") REFERENCES "public"."workflow_template_nodes"("template_id","template_version","node_key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_template_edges" ADD CONSTRAINT "workflow_template_edges_from_node_fk" FOREIGN KEY ("template_id","template_version","from_node_key") REFERENCES "public"."workflow_template_nodes"("template_id","template_version","node_key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_template_edges" ADD CONSTRAINT "workflow_template_edges_to_node_fk" FOREIGN KEY ("template_id","template_version","to_node_key") REFERENCES "public"."workflow_template_nodes"("template_id","template_version","node_key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_template_nodes" ADD CONSTRAINT "workflow_template_nodes_template_fk" FOREIGN KEY ("template_id","template_version") REFERENCES "public"."workflow_templates"("template_id","template_version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_events_owner_instance_sequence_idx" ON "workflow_events" USING btree ("owner_user_id","workflow_instance_id","sequence");--> statement-breakpoint
CREATE INDEX "workflow_nodes_owner_instance_idx" ON "workflow_nodes" USING btree ("owner_user_id","workflow_instance_id");--> statement-breakpoint
INSERT INTO "workflow_templates" ("template_id", "template_version", "definition_sha256", "seeded_at")
VALUES ('content-package-dual-output', 'v1', '2eb436927ee3e047a1b6aec6b016d6275606c9f4de28fc1c167ac2aabb4d2a5b', TIMESTAMPTZ '2026-08-01 00:00:00+00');--> statement-breakpoint
INSERT INTO "workflow_template_nodes" ("template_id", "template_version", "node_key", "ordinal", "kind", "requires_human_gate")
VALUES
  ('content-package-dual-output', 'v1', 'source_capture', 1, 'work', false),
  ('content-package-dual-output', 'v1', 'source_review', 2, 'gate', true),
  ('content-package-dual-output', 'v1', 'research', 3, 'work', false),
  ('content-package-dual-output', 'v1', 'research_review', 4, 'gate', true),
  ('content-package-dual-output', 'v1', 'human_opinion', 5, 'work', false),
  ('content-package-dual-output', 'v1', 'human_opinion_confirmation', 6, 'gate', true),
  ('content-package-dual-output', 'v1', 'content_foundation', 7, 'work', false),
  ('content-package-dual-output', 'v1', 'blog', 8, 'work', false),
  ('content-package-dual-output', 'v1', 'blog_review', 9, 'gate', true),
  ('content-package-dual-output', 'v1', 'xiaohongshu', 10, 'work', false),
  ('content-package-dual-output', 'v1', 'xiaohongshu_review', 11, 'gate', true),
  ('content-package-dual-output', 'v1', 'design', 12, 'work', false),
  ('content-package-dual-output', 'v1', 'design_review', 13, 'gate', true),
  ('content-package-dual-output', 'v1', 'render', 14, 'work', false),
  ('content-package-dual-output', 'v1', 'final_export_eligibility', 15, 'gate', true);--> statement-breakpoint
INSERT INTO "workflow_template_edges" ("template_id", "template_version", "ordinal", "from_node_key", "to_node_key")
VALUES
  ('content-package-dual-output', 'v1', 1, 'source_capture', 'source_review'),
  ('content-package-dual-output', 'v1', 2, 'source_review', 'research'),
  ('content-package-dual-output', 'v1', 3, 'research', 'research_review'),
  ('content-package-dual-output', 'v1', 4, 'research_review', 'human_opinion'),
  ('content-package-dual-output', 'v1', 5, 'human_opinion', 'human_opinion_confirmation'),
  ('content-package-dual-output', 'v1', 6, 'human_opinion_confirmation', 'content_foundation'),
  ('content-package-dual-output', 'v1', 7, 'content_foundation', 'blog'),
  ('content-package-dual-output', 'v1', 8, 'blog', 'blog_review'),
  ('content-package-dual-output', 'v1', 9, 'content_foundation', 'xiaohongshu'),
  ('content-package-dual-output', 'v1', 10, 'xiaohongshu', 'xiaohongshu_review'),
  ('content-package-dual-output', 'v1', 11, 'xiaohongshu_review', 'design'),
  ('content-package-dual-output', 'v1', 12, 'design', 'design_review'),
  ('content-package-dual-output', 'v1', 13, 'design_review', 'render'),
  ('content-package-dual-output', 'v1', 14, 'blog_review', 'final_export_eligibility'),
  ('content-package-dual-output', 'v1', 15, 'render', 'final_export_eligibility');--> statement-breakpoint
CREATE FUNCTION "workflow_catalog_rows_are_immutable"() RETURNS trigger
LANGUAGE plpgsql
AS $workflow_catalog_rows_are_immutable$
BEGIN
  RAISE EXCEPTION 'Workflow catalog rows are immutable'
    USING ERRCODE = 'restrict_violation', CONSTRAINT = 'workflow_catalog_immutable';
  RETURN NULL;
END;
$workflow_catalog_rows_are_immutable$;--> statement-breakpoint
CREATE TRIGGER "workflow_templates_immutable_trigger"
BEFORE UPDATE OR DELETE ON "workflow_templates"
FOR EACH ROW EXECUTE FUNCTION "workflow_catalog_rows_are_immutable"();--> statement-breakpoint
CREATE TRIGGER "workflow_template_nodes_immutable_trigger"
BEFORE UPDATE OR DELETE ON "workflow_template_nodes"
FOR EACH ROW EXECUTE FUNCTION "workflow_catalog_rows_are_immutable"();--> statement-breakpoint
CREATE TRIGGER "workflow_template_edges_immutable_trigger"
BEFORE UPDATE OR DELETE ON "workflow_template_edges"
FOR EACH ROW EXECUTE FUNCTION "workflow_catalog_rows_are_immutable"();--> statement-breakpoint
CREATE FUNCTION "workflow_event_rows_are_immutable"() RETURNS trigger
LANGUAGE plpgsql
AS $workflow_event_rows_are_immutable$
BEGIN
  RAISE EXCEPTION 'Workflow event rows are immutable'
    USING ERRCODE = 'restrict_violation', CONSTRAINT = 'workflow_events_immutable';
  RETURN NULL;
END;
$workflow_event_rows_are_immutable$;--> statement-breakpoint
CREATE TRIGGER "workflow_events_immutable_trigger"
BEFORE UPDATE OR DELETE ON "workflow_events"
FOR EACH ROW EXECUTE FUNCTION "workflow_event_rows_are_immutable"();
