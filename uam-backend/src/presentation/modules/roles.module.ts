import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RolesController } from '../controllers/roles.controller';
import { ListRolesUseCase } from '../../application/use-cases/roles/list-roles.use-case';
import { GetRoleUseCase } from '../../application/use-cases/roles/get-role.use-case';
import { CreateRoleUseCase } from '../../application/use-cases/roles/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/roles/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/roles/delete-role.use-case';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
    imports: [
        DatabaseModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        }),
    ],
    controllers: [RolesController],
    providers: [
        ListRolesUseCase,
        GetRoleUseCase,
        CreateRoleUseCase,
        UpdateRoleUseCase,
        DeleteRoleUseCase,
    ],
})
export class RolesModule { }
