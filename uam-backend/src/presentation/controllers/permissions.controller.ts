import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssignPermissionDto } from '../../application/dtos/permissions/assign-permission.dto';
import { UpdatePermissionDto } from '../../application/dtos/permissions/update-permission.dto';
import { BulkAssignPermissionsDto } from '../../application/dtos/permissions/bulk-assign-permissions.dto';
import { PermissionResponseDto } from '../../application/dtos/permissions/permission-response.dto';
import { GetRolePermissionsUseCase } from '../../application/use-cases/permissions/get-role-permissions.use-case';
import { AssignPermissionUseCase } from '../../application/use-cases/permissions/assign-permission.use-case';
import { UpdatePermissionUseCase } from '../../application/use-cases/permissions/update-permission.use-case';
import { RevokePermissionUseCase } from '../../application/use-cases/permissions/revoke-permission.use-case';
import { BulkAssignPermissionsUseCase } from '../../application/use-cases/permissions/bulk-assign-permissions.use-case';

/**
 * Permissions Controller
 * Handles permission management endpoints
 */
@ApiTags('Permissions')
@Controller('api')
export class PermissionsController {
    constructor(
        private readonly getRolePermissionsUseCase: GetRolePermissionsUseCase,
        private readonly assignPermissionUseCase: AssignPermissionUseCase,
        private readonly updatePermissionUseCase: UpdatePermissionUseCase,
        private readonly revokePermissionUseCase: RevokePermissionUseCase,
        private readonly bulkAssignPermissionsUseCase: BulkAssignPermissionsUseCase,
    ) { }

    @Get('roles/:roleId/permissions')
    @ApiOperation({ summary: 'Get all permissions for a role' })
    @ApiResponse({ status: 200, description: 'Permissions retrieved successfully', type: [PermissionResponseDto] })
    async getRolePermissions(@Param('roleId') roleId: string): Promise<PermissionResponseDto[]> {
        return this.getRolePermissionsUseCase.execute(roleId);
    }

    @Post('roles/:roleId/permissions')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Assign permission to a role' })
    @ApiResponse({ status: 201, description: 'Permission assigned successfully', type: PermissionResponseDto })
    async assignPermission(
        @Param('roleId') roleId: string,
        @Body() dto: AssignPermissionDto,
    ): Promise<PermissionResponseDto> {
        return this.assignPermissionUseCase.execute(roleId, dto);
    }

    @Put('permissions/:permissionId')
    @ApiOperation({ summary: 'Update permission' })
    @ApiResponse({ status: 200, description: 'Permission updated successfully', type: PermissionResponseDto })
    async updatePermission(
        @Param('permissionId') permissionId: string,
        @Body() dto: UpdatePermissionDto,
    ): Promise<PermissionResponseDto> {
        return this.updatePermissionUseCase.execute(permissionId, dto);
    }

    @Delete('permissions/:permissionId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Revoke permission' })
    @ApiResponse({ status: 204, description: 'Permission revoked successfully' })
    async revokePermission(@Param('permissionId') permissionId: string): Promise<void> {
        await this.revokePermissionUseCase.execute(permissionId);
    }

    @Post('roles/:roleId/permissions/bulk')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Bulk assign permissions to a role' })
    @ApiResponse({ status: 201, description: 'Permissions assigned successfully', type: [PermissionResponseDto] })
    async bulkAssignPermissions(
        @Param('roleId') roleId: string,
        @Body() dto: BulkAssignPermissionsDto,
    ): Promise<PermissionResponseDto[]> {
        return this.bulkAssignPermissionsUseCase.execute(roleId, dto.permissions);
    }
}
