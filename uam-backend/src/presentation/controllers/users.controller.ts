import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../../application/dtos/users/create-user.dto';
import { AssignRoleDto } from '../../application/dtos/users/assign-role.dto';
import { BulkAssignRolesDto } from '../../application/dtos/users/bulk-assign-roles.dto';
import { UserResponseDto } from '../../application/dtos/users/user-response.dto';
import { UserRoleResponseDto } from '../../application/dtos/users/user-role-response.dto';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { GetUserUseCase } from '../../application/use-cases/users/get-user.use-case';
import { GetUserRolesUseCase } from '../../application/use-cases/users/get-user-roles.use-case';
import { AssignRoleToUserUseCase } from '../../application/use-cases/users/assign-role-to-user.use-case';
import { RemoveRoleFromUserUseCase } from '../../application/use-cases/users/remove-role-from-user.use-case';
import { BulkAssignRolesUseCase } from '../../application/use-cases/users/bulk-assign-roles.use-case';

/**
 * Users Controller
 * Handles user management endpoints
 */
@ApiTags('Users')
@Controller('api/users')
export class UsersController {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly listUsersUseCase: ListUsersUseCase,
        private readonly getUserUseCase: GetUserUseCase,
        private readonly getUserRolesUseCase: GetUserRolesUseCase,
        private readonly assignRoleToUserUseCase: AssignRoleToUserUseCase,
        private readonly removeRoleFromUserUseCase: RemoveRoleFromUserUseCase,
        private readonly bulkAssignRolesUseCase: BulkAssignRolesUseCase,
        private readonly jwtService: JwtService,
    ) { }

    private extractTenantId(req: Request): string {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader || Array.isArray(authHeader)) {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new UnauthorizedException('Invalid Authorization header format');
        }

        const token = parts[1];
        const payload: any = this.jwtService.decode(token);

        if (!payload?.tenantId) {
            throw new UnauthorizedException('Tenant ID not found in token');
        }

        return payload.tenantId;
    }

    @Get()
    @ApiOperation({ summary: 'List all users for a tenant' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: [UserResponseDto] })
    async listUsers(@Req() req: Request): Promise<UserResponseDto[]> {
        const tenantId = this.extractTenantId(req);
        return this.listUsersUseCase.execute(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserResponseDto })
    async getUser(@Param('id') id: string): Promise<UserResponseDto> {
        return this.getUserUseCase.execute(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async createUser(@Req() req: Request, @Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const tenantId = this.extractTenantId(req);
        return this.createUserUseCase.execute(
            tenantId,
            createUserDto.email,
            createUserDto.password,
            createUserDto.firstName,
            createUserDto.lastName,
            createUserDto.authProvider,
            createUserDto.accountType,
        );
    }

    @Get(':id/roles')
    @ApiOperation({ summary: 'Get roles assigned to user' })
    @ApiResponse({ status: 200, description: 'User roles retrieved successfully', type: [UserRoleResponseDto] })
    async getUserRoles(@Param('id') id: string): Promise<UserRoleResponseDto[]> {
        return this.getUserRolesUseCase.execute(id);
    }

    @Post(':id/roles')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Assign role to user' })
    @ApiResponse({ status: 201, description: 'Role assigned successfully', type: UserRoleResponseDto })
    async assignRole(
        @Param('id') id: string,
        @Body() dto: AssignRoleDto,
    ): Promise<UserRoleResponseDto> {
        // Hardcoded assignedBy for now
        const assignedBy = '00000000-0000-0000-0000-000000000000';
        return this.assignRoleToUserUseCase.execute(id, dto.roleId, assignedBy);
    }

    @Delete(':id/roles/:roleId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove role from user' })
    @ApiResponse({ status: 204, description: 'Role removed successfully' })
    async removeRole(
        @Param('id') id: string,
        @Param('roleId') roleId: string,
    ): Promise<void> {
        await this.removeRoleFromUserUseCase.execute(id, roleId);
    }

    @Post(':id/roles/bulk')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Bulk assign roles to user' })
    @ApiResponse({ status: 201, description: 'Roles assigned successfully', type: [UserRoleResponseDto] })
    async bulkAssignRoles(
        @Param('id') id: string,
        @Body() dto: BulkAssignRolesDto,
    ): Promise<UserRoleResponseDto[]> {
        // Hardcoded assignedBy for now
        const assignedBy = '00000000-0000-0000-0000-000000000000';
        return this.bulkAssignRolesUseCase.execute(id, dto.roleIds, assignedBy);
    }
}
