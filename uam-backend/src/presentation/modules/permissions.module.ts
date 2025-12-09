import { Module } from '@nestjs/common';
import { PermissionsController } from '../controllers/permissions.controller';
import { InternalPermissionsController } from '../controllers/internal-permissions.controller';
import { GetRolePermissionsUseCase } from '../../application/use-cases/permissions/get-role-permissions.use-case';
import { AssignPermissionUseCase } from '../../application/use-cases/permissions/assign-permission.use-case';
import { UpdatePermissionUseCase } from '../../application/use-cases/permissions/update-permission.use-case';
import { RevokePermissionUseCase } from '../../application/use-cases/permissions/revoke-permission.use-case';
import { BulkAssignPermissionsUseCase } from '../../application/use-cases/permissions/bulk-assign-permissions.use-case';
import { GetUserProductPermissionsUseCase } from '../../application/use-cases/permissions/get-user-product-permissions.use-case';
import { AuthModule } from './auth.module';

@Module({
    imports: [AuthModule],
    controllers: [PermissionsController, InternalPermissionsController],
    providers: [
        GetRolePermissionsUseCase,
        AssignPermissionUseCase,
        UpdatePermissionUseCase,
        RevokePermissionUseCase,
        BulkAssignPermissionsUseCase,
        GetUserProductPermissionsUseCase,
    ],
    exports: [
        GetRolePermissionsUseCase,
        AssignPermissionUseCase,
        UpdatePermissionUseCase,
        RevokePermissionUseCase,
        BulkAssignPermissionsUseCase,
        GetUserProductPermissionsUseCase,
    ],
})
export class PermissionsModule { }
