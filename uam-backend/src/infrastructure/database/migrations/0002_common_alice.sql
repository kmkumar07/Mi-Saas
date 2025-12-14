DO $$ BEGIN
 CREATE TYPE "authentication_provider" AS ENUM('local', 'azure_ad', 'google', 'cognito');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."authentication_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"provider" "authentication_provider" NOT NULL,
	"provider_account_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"external_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "authentication_accounts_identity_id_provider_provider_account_id_unique" UNIQUE("identity_id","provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "identities_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."member_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_member_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"product_id" uuid,
	"assigned_by" uuid,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_roles_organization_member_id_role_id_unique" UNIQUE("organization_member_id","role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."organization_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_member_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_admins_organization_member_id_unique" UNIQUE("organization_member_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_identity_id_tenant_id_unique" UNIQUE("identity_id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uam"."product_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_member_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_access_grants_organization_member_id_product_id_unique" UNIQUE("organization_member_id","product_id")
);
--> statement-breakpoint
DROP TABLE "uam"."product_invlovemnet_roles";--> statement-breakpoint
DROP TABLE "uam"."user_roles";--> statement-breakpoint
ALTER TABLE "uam"."audit_logs" RENAME COLUMN "user_id" TO "organization_member_id";--> statement-breakpoint
ALTER TABLE "uam"."oauth_tokens" RENAME COLUMN "user_id" TO "organization_member_id";--> statement-breakpoint
ALTER TABLE "uam"."audit_logs" DROP CONSTRAINT "audit_logs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "uam"."employee_invitations" DROP CONSTRAINT "employee_invitations_invited_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "uam"."oauth_tokens" DROP CONSTRAINT "oauth_tokens_user_id_users_id_fk";
--> statement-breakpoint
-- Clear invalid foreign key references before adding new constraints (greenfield reset)
UPDATE "uam"."employee_invitations" SET "invited_by" = NULL WHERE "invited_by" IS NOT NULL;
--> statement-breakpoint
UPDATE "uam"."audit_logs" SET "organization_member_id" = NULL WHERE "organization_member_id" IS NOT NULL;
--> statement-breakpoint
DELETE FROM "uam"."oauth_tokens";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_audit_logs_user";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_oauth_tokens_user";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_accounts_identity" ON "uam"."authentication_accounts" ("identity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_accounts_email" ON "uam"."authentication_accounts" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_accounts_provider" ON "uam"."authentication_accounts" ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_identities_email" ON "uam"."identities" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_roles_member" ON "uam"."member_roles" ("organization_member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_roles_role" ON "uam"."member_roles" ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_roles_product" ON "uam"."member_roles" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_admins_tenant" ON "uam"."organization_admins" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_admins_member" ON "uam"."organization_admins" ("organization_member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_identity" ON "uam"."organization_members" ("identity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_tenant" ON "uam"."organization_members" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_access_member" ON "uam"."product_access_grants" ("organization_member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_access_product" ON "uam"."product_access_grants" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_access_tenant" ON "uam"."product_access_grants" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_member" ON "uam"."audit_logs" ("organization_member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_oauth_tokens_member" ON "uam"."oauth_tokens" ("organization_member_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."audit_logs" ADD CONSTRAINT "audit_logs_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "uam"."organization_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."employee_invitations" ADD CONSTRAINT "employee_invitations_invited_by_organization_members_id_fk" FOREIGN KEY ("invited_by") REFERENCES "uam"."organization_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."oauth_tokens" ADD CONSTRAINT "oauth_tokens_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "uam"."organization_members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."authentication_accounts" ADD CONSTRAINT "authentication_accounts_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "uam"."identities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."member_roles" ADD CONSTRAINT "member_roles_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "uam"."organization_members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."member_roles" ADD CONSTRAINT "member_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "uam"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."member_roles" ADD CONSTRAINT "member_roles_assigned_by_organization_members_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "uam"."organization_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."organization_admins" ADD CONSTRAINT "organization_admins_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "uam"."organization_members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."organization_admins" ADD CONSTRAINT "organization_admins_granted_by_organization_members_id_fk" FOREIGN KEY ("granted_by") REFERENCES "uam"."organization_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."organization_members" ADD CONSTRAINT "organization_members_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "uam"."identities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."product_access_grants" ADD CONSTRAINT "product_access_grants_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "uam"."organization_members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."product_access_grants" ADD CONSTRAINT "product_access_grants_granted_by_organization_members_id_fk" FOREIGN KEY ("granted_by") REFERENCES "uam"."organization_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
