import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRoleDto } from '../../application/dtos/roles/create-role.dto';
import { UpdateRoleDto } from '../../application/dtos/roles/update-role.dto';
import { RoleResponseDto } from '../../application/dtos/roles/role-response.dto';
import { ListRolesUseCase } from '../../application/use-cases/roles/list-roles.use-case';
import { GetRoleUseCase } from '../../application/use-cases/roles/get-role.use-case';
import { CreateRoleUseCase } from '../../application/use-cases/roles/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/roles/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/roles/delete-role.use-case';

/**
 * Roles Controller
 * Handles role management endpoints
 */
@ApiTags('Roles')
@Controller('api/roles')
export class RolesController {
    constructor(
        private readonly listRolesUseCase: ListRolesUseCase,
        private readonly getRoleUseCase: GetRoleUseCase,
        private readonly createRoleUseCase: CreateRoleUseCase,
        private readonly updateRoleUseCase: UpdateRoleUseCase,
        private readonly deleteRoleUseCase: DeleteRoleUseCase,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List all roles' })
    @ApiResponse({ status: 200, description: 'Roles retrieved successfully', type: [RoleResponseDto] })
    async listRoles(): Promise<RoleResponseDto[]> {
        return this.listRolesUseCase.execute();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get role by ID' })
    @ApiResponse({ status: 200, description: 'Role retrieved successfully', type: RoleResponseDto })
    async getRole(@Param('id') id: string): Promise<RoleResponseDto> {
        return this.getRoleUseCase.execute(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new role' })
    @ApiResponse({ status: 201, description: 'Role created successfully', type: RoleResponseDto })
    async createRole(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
        return this.createRoleUseCase.execute(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update role' })
    @ApiResponse({ status: 200, description: 'Role updated successfully', type: RoleResponseDto })
    async updateRole(
        @Param('id') id: string,
        @Body() dto: UpdateRoleDto,
    ): Promise<RoleResponseDto> {
        return this.updateRoleUseCase.execute(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete role' })
    @ApiResponse({ status: 204, description: 'Role deleted successfully' })
    async deleteRole(@Param('id') id: string): Promise<void> {
        await this.deleteRoleUseCase.execute(id);
    }
}
