ALTER TABLE "workflow_outbox_records" DROP CONSTRAINT "workflow_outbox_records_state_check";--> statement-breakpoint
DROP INDEX "workflow_outbox_records_pending_idx";--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD COLUMN "delivery_generation" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD COLUMN "dispatch_attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD COLUMN "dispatch_lease_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD COLUMN "last_dispatch_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD COLUMN "dispatched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "workflow_outbox_records" SET "updated_at" = "created_at";--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "workflow_outbox_records_dispatch_eligibility_idx" ON "workflow_outbox_records" USING btree ("state","dispatch_lease_expires_at","created_at","id");--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD CONSTRAINT "workflow_outbox_records_delivery_generation_check" CHECK ("workflow_outbox_records"."delivery_generation" >= 1);--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD CONSTRAINT "workflow_outbox_records_dispatch_attempt_count_check" CHECK ("workflow_outbox_records"."dispatch_attempt_count" >= 0);--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD CONSTRAINT "workflow_outbox_records_dispatch_lease_check" CHECK (("workflow_outbox_records"."state" = 'dispatching' AND "workflow_outbox_records"."dispatch_lease_expires_at" IS NOT NULL) OR ("workflow_outbox_records"."state" <> 'dispatching' AND "workflow_outbox_records"."dispatch_lease_expires_at" IS NULL));--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD CONSTRAINT "workflow_outbox_records_acknowledgement_state_check" CHECK (("workflow_outbox_records"."state" = 'dispatched' AND "workflow_outbox_records"."last_dispatch_at" IS NOT NULL AND "workflow_outbox_records"."dispatched_at" IS NOT NULL) OR ("workflow_outbox_records"."state" <> 'dispatched' AND "workflow_outbox_records"."last_dispatch_at" IS NULL AND "workflow_outbox_records"."dispatched_at" IS NULL));--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD CONSTRAINT "workflow_outbox_records_acknowledgement_timestamp_check" CHECK (("workflow_outbox_records"."last_dispatch_at" IS NULL AND "workflow_outbox_records"."dispatched_at" IS NULL) OR ("workflow_outbox_records"."last_dispatch_at" IS NOT NULL AND "workflow_outbox_records"."dispatched_at" IS NOT NULL AND "workflow_outbox_records"."last_dispatch_at" = "workflow_outbox_records"."dispatched_at" AND "workflow_outbox_records"."last_dispatch_at" >= "workflow_outbox_records"."created_at"));--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD CONSTRAINT "workflow_outbox_records_updated_at_check" CHECK ("workflow_outbox_records"."updated_at" >= "workflow_outbox_records"."created_at");--> statement-breakpoint
ALTER TABLE "workflow_outbox_records" ADD CONSTRAINT "workflow_outbox_records_state_check" CHECK ("workflow_outbox_records"."state" IN ('pending', 'dispatching', 'dispatched'));
