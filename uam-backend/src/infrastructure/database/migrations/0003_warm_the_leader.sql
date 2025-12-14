CREATE TABLE IF NOT EXISTS "uam"."oauth_authorization_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(255) NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"organization_member_id" uuid NOT NULL,
	"redirect_uri" varchar(500) NOT NULL,
	"scopes" text[] NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_authorization_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."oauth_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"client_secret_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"redirect_uris" text[] NOT NULL,
	"scopes" text[] NOT NULL,
	"grant_types" text[] NOT NULL,
	"tenant_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_oauth_auth_codes_code" ON "uam"."oauth_authorization_codes" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_oauth_auth_codes_client" ON "uam"."oauth_authorization_codes" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_oauth_auth_codes_member" ON "uam"."oauth_authorization_codes" ("organization_member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_oauth_clients_client_id" ON "uam"."oauth_clients" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_oauth_clients_tenant" ON "uam"."oauth_clients" ("tenant_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "uam"."organization_members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
