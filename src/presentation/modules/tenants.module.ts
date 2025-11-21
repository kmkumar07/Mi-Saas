import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { TENANT_REPOSITORY } from '@domain/repositories';
import { TenantRepository } from '@infrastructure/database/repositories/tenant.repository';
import { CreateTenantUseCase } from '@application/use-cases/tenants/create-tenant.use-case';
import { GetTenantUseCase } from '@application/use-cases/tenants/get-tenant.use-case';
import { TenantsController } from '@presentation/controllers/tenants.controller';

@Module({
    imports: [DatabaseModule],
    controllers: [TenantsController],
    providers: [
        {
            provide: TENANT_REPOSITORY,
            useClass: TenantRepository,
        },
        CreateTenantUseCase,
        GetTenantUseCase,
    ],
    exports: [TENANT_REPOSITORY],
})
export class TenantsModule { }
