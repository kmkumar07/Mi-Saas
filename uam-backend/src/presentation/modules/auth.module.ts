import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../controllers/auth.controller';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case';
import { RegisterTenantUseCase } from '../../application/use-cases/auth/register-tenant.use-case';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { TenantProvisioningClient } from '../../infrastructure/http/clients/tenant-provisioning.client';
import { TENANT_PROVISIONING_CLIENT } from '../../infrastructure/http/interfaces/tenant-provisioning.interface';

@Module({
    imports: [
        DatabaseModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            signOptions: { expiresIn: '15m' },
        }),
    ],
    controllers: [AuthController],
    providers: [
        LoginUseCase,
        RefreshTokenUseCase,
        LogoutUseCase,
        RegisterTenantUseCase,
        CreateUserUseCase,
        {
            provide: TENANT_PROVISIONING_CLIENT,
            useClass: TenantProvisioningClient,
        },
    ],
})
export class AuthModule { }
