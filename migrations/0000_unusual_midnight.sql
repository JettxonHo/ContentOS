CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"credential_hash" char(64) NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "auth_sessions_credential_hash_unique" UNIQUE("credential_hash")
);
--> statement-breakpoint
CREATE INDEX "auth_sessions_owner_user_id_idx" ON "auth_sessions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions" USING btree ("expires_at");