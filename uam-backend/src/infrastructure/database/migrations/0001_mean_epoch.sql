ALTER TABLE "uam"."service_user_invlovemnet_roles" RENAME TO "roles";--> statement-breakpoint
ALTER TABLE "uam"."roles" DROP CONSTRAINT "service_user_invlovemnet_roles_tenant_id_role_code_unique";--> statement-breakpoint
ALTER TABLE "uam"."product_invlovemnet_roles" DROP CONSTRAINT "product_invlovemnet_roles_role_id_service_user_invlovemnet_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "uam"."role_permissions" DROP CONSTRAINT "role_permissions_role_id_service_user_invlovemnet_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "uam"."user_roles" DROP CONSTRAINT "user_roles_role_id_service_user_invlovemnet_roles_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."product_invlovemnet_roles" ADD CONSTRAINT "product_invlovemnet_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "uam"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "uam"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uam"."user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "uam"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "uam"."roles" ADD CONSTRAINT "roles_tenant_id_role_code_unique" UNIQUE("tenant_id","role_code");