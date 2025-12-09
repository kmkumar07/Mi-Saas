import { Module } from '@nestjs/common';
import { PermissionsController } from '../controllers/permissions.controller';
import { GetRolePermissionsUseCase } from '../../application/use-cases/permissions/get-role-permissions.use-case';
import { AssignPermissionUseCase } from '../../application/use-cases/permissions/assign-permission.use-case';
import { UpdatePermissionUseCase } from '../../application/use-cases/permissions/update-permission.use-case';
import { RevokePermissionUseCase } from '../../application/use-cases/permissions/revoke-permission.use-case';
import { BulkAssignPermissionsUseCase } from '../../application/use-cases/permissions/bulk-assign-permissions.use-case';

@Module({
    controllers: [PermissionsController],
    providers: [
        GetRolePermissionsUseCase,
        AssignPermissionUseCase,
        UpdatePermissionUseCase,
        RevokePermissionUseCase,
        BulkAssignPermissionsUseCase,
    ],
    exports: [
        GetRolePermissionsUseCase,
        AssignPermissionUseCase,
        UpdatePermissionUseCase,
        RevokePermissionUseCase,
        BulkAssignPermissionsUseCase,
    ],
})
export class PermissionsModule { }
