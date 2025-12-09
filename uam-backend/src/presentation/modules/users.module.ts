import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from '../controllers/users.controller';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { GetUserUseCase } from '../../application/use-cases/users/get-user.use-case';
import { GetUserRolesUseCase } from '../../application/use-cases/users/get-user-roles.use-case';
import { AssignRoleToUserUseCase } from '../../application/use-cases/users/assign-role-to-user.use-case';
import { RemoveRoleFromUserUseCase } from '../../application/use-cases/users/remove-role-from-user.use-case';
import { BulkAssignRolesUseCase } from '../../application/use-cases/users/bulk-assign-roles.use-case';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
    imports: [
        DatabaseModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        }),
    ],
    controllers: [UsersController],
    providers: [
        CreateUserUseCase,
        ListUsersUseCase,
        GetUserUseCase,
        GetUserRolesUseCase,
        AssignRoleToUserUseCase,
        RemoveRoleFromUserUseCase,
        BulkAssignRolesUseCase,
    ],
})
export class UsersModule { }
