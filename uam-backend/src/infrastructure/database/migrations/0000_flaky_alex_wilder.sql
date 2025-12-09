CREATE SCHEMA "uam";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "account_type" AS ENUM('individual', 'company');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "auth_provider" AS ENUM('local', 'azure_ad');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"tenant_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid,
	"ip_address" "inet",
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."employee_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"invited_by" uuid,
	"invitation_token" varchar(255) NOT NULL,
	"role_ids" uuid[] NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_invitations_invitation_token_unique" UNIQUE("invitation_token"),
	CONSTRAINT "employee_invitations_tenant_id_email_status_unique" UNIQUE("tenant_id","email","status")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."oauth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_type" varchar(20) DEFAULT 'Bearer' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"refresh_expires_at" timestamp,
	"scope" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "oauth_tokens_access_token_unique" UNIQUE("access_token"),
	CONSTRAINT "oauth_tokens_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"role_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"can_read" boolean DEFAULT false NOT NULL,
	"can_write" boolean DEFAULT false NOT NULL,
	"can_execute" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_tenant_id_role_id_feature_id_unique" UNIQUE("tenant_id","role_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."system_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"role_code" varchar(50) NOT NULL,
	"role_name" varchar(100) NOT NULL,
	"description" text,
	"is_system_role" boolean DEFAULT true NOT NULL,
	"hierarchy_level" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_roles_tenant_id_role_code_unique" UNIQUE("tenant_id","role_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_unique" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"auth_provider" "auth_provider" DEFAULT 'local' NOT NULL,
	"external_id" varchar(255),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"is_active" boolean DEFAULT false NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"account_type" "account_type" DEFAULT 'individual',
	"organization_id" uuid,
	"is_company_owner" boolean DEFAULT false NOT NULL,
	"is_synced_from_ad" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp,
	"email_domain" varchar(255),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_tenant_id_email_unique" UNIQUE("tenant_id","email")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user" ON "uam"."audit_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant" ON "uam"."audit_logs" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "uam"."audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created" ON "uam"."audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitations_tenant" ON "uam"."employee_invitations" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitations_token" ON "uam"."employee_invitations" ("invitation_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitations_status" ON "uam"."employee_invitations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_oauth_tokens_user" ON "uam"."oauth_tokens" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_oauth_tokens_access" ON "uam"."oauth_tokens" ("access_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_oauth_tokens_refresh" ON "uam"."oauth_tokens" ("refresh_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_role_permissions_tenant" ON "uam"."role_permissions" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_role_permissions_role" ON "uam"."role_permissions" ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_role_permissions_feature" ON "uam"."role_permissions" ("feature_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_system_roles_tenant" ON "uam"."system_roles" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_system_roles_code" ON "uam"."system_roles" ("role_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_roles_user" ON "uam"."user_roles" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_roles_role" ON "uam"."user_roles" ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_tenant" ON "uam"."users" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "uam"."users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_email_domain" ON "uam"."users" ("email_domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_auth_provider" ON "uam"."users" ("auth_provider");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "uam"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."employee_invitations" ADD CONSTRAINT "employee_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "uam"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."oauth_tokens" ADD CONSTRAINT "oauth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "uam"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_system_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "uam"."system_roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "uam"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."user_roles" ADD CONSTRAINT "user_roles_role_id_system_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "uam"."system_roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "uam"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
