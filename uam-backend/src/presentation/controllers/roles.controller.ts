import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CreateRoleDto } from '../../application/dtos/roles/create-role.dto';
import { UpdateRoleDto } from '../../application/dtos/roles/update-role.dto';
import { RoleResponseDto } from '../../application/dtos/roles/role-response.dto';
import { ListRolesUseCase } from '../../application/use-cases/roles/list-roles.use-case';
import { GetRoleUseCase } from '../../application/use-cases/roles/get-role.use-case';
import { CreateRoleUseCase } from '../../application/use-cases/roles/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/roles/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/roles/delete-role.use-case';
import { externalHttpClient } from '../../infrastructure/http/axios.instance';

interface TenantFeaturesResponse {
    tenantId: string;
    products: {
        productId: string;
        productName: string;
        features: {
            featureId: string;
            featureName: string;
            featureCode: string;
            featureDescription: string;
            featureType: string;
        }[];
    }[];
    totalFeatures: number;
    activeSubscriptions: number;
}

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
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Helper to extract tenantId from the JWT access token.
     */
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
    @ApiOperation({ summary: 'List all roles' })
    @ApiResponse({ status: 200, description: 'Roles retrieved successfully', type: [RoleResponseDto] })
    async listRoles(): Promise<RoleResponseDto[]> {
        return this.listRolesUseCase.execute();
    }

    /**
     * Proxy endpoint to load tenant-specific features from the SaaS backend.
     * The tenantId is derived from the access token.
     */
    @Get('tenant-features')
    @ApiOperation({ summary: 'Get products and features for the current tenant' })
    async getTenantFeatures(@Req() req: Request): Promise<TenantFeaturesResponse> {
        const tenantId = this.extractTenantId(req);
        const response = await externalHttpClient.get<TenantFeaturesResponse>(
            `/api/internal/features/tenant/${tenantId}`,
        );
        return response.data;
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
    async createRole(@Req() req: Request, @Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
        const tenantId = this.extractTenantId(req);
        return this.createRoleUseCase.execute(tenantId, dto);
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
