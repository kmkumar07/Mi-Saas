import { Module } from '@nestjs/common';
import { TenantActivationController } from '../controllers/tenant-activation.controller';
import { ActivateTenantPlanUseCase } from '../../application/use-cases/tenant-activation/activate-tenant-plan.use-case';
import { CreateAdminRoleWithPermissionsUseCase } from '../../application/use-cases/tenant-activation/create-admin-role-with-permissions.use-case';
import { SyncProductAccessUseCase } from '../../application/use-cases/tenant-activation/sync-product-access.use-case';
import { GetOrganizationAdminUseCase } from '../../application/use-cases/tenant-activation/get-organization-admin.use-case';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [TenantActivationController],
    providers: [
        ActivateTenantPlanUseCase,
        CreateAdminRoleWithPermissionsUseCase,
        SyncProductAccessUseCase,
        GetOrganizationAdminUseCase,
    ],
    exports: [ActivateTenantPlanUseCase],
})
export class TenantActivationModule { }

