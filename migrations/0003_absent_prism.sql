ALTER TABLE "source_raw_snapshots" DROP CONSTRAINT "source_raw_snapshots_content_type_check";--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_source_type_check";--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_capture_type_check";--> statement-breakpoint
ALTER TABLE "source_raw_snapshots" ADD CONSTRAINT "source_raw_snapshots_content_type_check" CHECK ("source_raw_snapshots"."content_type" IN (concat('text/plain', chr(59), ' charset=utf-8'), concat('text/markdown', chr(59), ' charset=utf-8')));--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_source_type_check" CHECK ("sources"."source_type" IN ('pasted_text', 'uploaded_text'));--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_capture_type_check" CHECK ("sources"."capture_type" IN ('pasted_text', 'uploaded_text'));