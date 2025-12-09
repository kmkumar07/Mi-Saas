import { Controller, Get, Req, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { externalHttpClient } from '../../infrastructure/http/axios.instance';
import { GetUserProductPermissionsUseCase } from '../../application/use-cases/permissions/get-user-product-permissions.use-case';
import { UserProductPermissionsResponseDto } from '../../application/dtos/permissions';

interface InternalFeatureDto {
    featureId: string;
    featureName: string;
    featureCode: string;
    featureDescription?: string;
    featureType: string;
}

interface InternalProductDto {
    productId: string;
    productName: string;
    features: InternalFeatureDto[];
}

interface TenantFeaturesResponse {
    tenantId: string;
    products: InternalProductDto[];
    totalFeatures: number;
    activeSubscriptions: number;
}

@ApiTags('Internal Permissions')
@Controller('api/internal/permissions')
export class InternalPermissionsController {
    constructor(
        private readonly jwtService: JwtService,
        private readonly getUserProductPermissionsUseCase: GetUserProductPermissionsUseCase,
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

    /**
     * Helper to extract userId (subject) from the JWT access token.
     */
    private extractUserId(req: Request): string {
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

        if (!payload?.sub) {
            throw new UnauthorizedException('User ID not found in token');
        }

        return payload.sub;
    }

    /**
     * Returns the permission matrix for the current user grouped by product and feature.
     * Used by third-party backends to understand which products/features the user can access.
     */
    @Get('user-product-matrix')
    @ApiOperation({ summary: 'Get user permissions grouped by product and feature (internal API)' })
    @ApiResponse({
        status: 200,
        description: 'User permissions retrieved successfully',
        type: UserProductPermissionsResponseDto,
    })
    async getUserProductMatrix(@Req() req: Request): Promise<UserProductPermissionsResponseDto> {
        const tenantId = this.extractTenantId(req);
        const userId = this.extractUserId(req);

        // Product scoping from header (REQUIRED for third-party backends)
        const productIdHeader = req.headers['x-product-id'];
        const productId =
            typeof productIdHeader === 'string'
                ? productIdHeader
                : Array.isArray(productIdHeader)
                    ? productIdHeader[0]
                    : undefined;

        if (!productId) {
            throw new BadRequestException('x-product-id header is required');
        }

        // 1. Fetch tenant products + features from SaaS backend
        const { data: tenantFeatures } = await externalHttpClient.get<TenantFeaturesResponse>(
            `/api/internal/features/tenant/${tenantId}`,
        );

        // 2. Filter to a single product
        const product = tenantFeatures.products.find(p => p.productId === productId);
        if (!product) {
            throw new NotFoundException(`Product ${productId} not found for tenant`);
        }

        // 3. Fetch aggregated feature permissions for this user
        const userFeaturePerms = await this.getUserProductPermissionsUseCase.execute(tenantId, userId);
        const permByFeatureId = new Map(userFeaturePerms.map(p => [p.featureId, p]));

        // 4. Join features with permissions for this product only
        const products = [
            {
                productId: product.productId,
                productName: product.productName,
                features: product.features.map(feature => {
                    const perm = permByFeatureId.get(feature.featureId);
                    return {
                        featureId: feature.featureId,
                        featureName: feature.featureName,
                        featureCode: feature.featureCode,
                        featureDescription: feature.featureDescription,
                        featureType: feature.featureType,
                        canRead: perm?.canRead ?? false,
                        canWrite: perm?.canWrite ?? false,
                        canExecute: perm?.canExecute ?? false,
                    };
                }),
            },
        ];

        return {
            tenantId,
            userId,
            products,
        };
    }
}


