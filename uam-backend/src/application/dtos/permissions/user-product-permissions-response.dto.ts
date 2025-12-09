import { ApiProperty } from '@nestjs/swagger';

export class UserFeaturePermissionDto {
    @ApiProperty({ description: 'Feature ID' })
    featureId: string;

    @ApiProperty({ description: 'Feature name' })
    featureName: string;

    @ApiProperty({ description: 'Feature code' })
    featureCode: string;

    @ApiProperty({ description: 'Feature description', required: false })
    featureDescription?: string;

    @ApiProperty({ description: 'Feature type (boolean, quota, metered)' })
    featureType: string;

    @ApiProperty({ description: 'Whether the user can read this feature' })
    canRead: boolean;

    @ApiProperty({ description: 'Whether the user can write this feature' })
    canWrite: boolean;

    @ApiProperty({ description: 'Whether the user can execute this feature' })
    canExecute: boolean;
}

export class UserProductPermissionDto {
    @ApiProperty({ description: 'Product ID' })
    productId: string;

    @ApiProperty({ description: 'Product name' })
    productName: string;

    @ApiProperty({ description: 'Features and permissions for this product', type: [UserFeaturePermissionDto] })
    features: UserFeaturePermissionDto[];
}

export class UserProductPermissionsResponseDto {
    @ApiProperty({ description: 'Tenant ID' })
    tenantId: string;

    @ApiProperty({ description: 'User ID' })
    userId: string;

    @ApiProperty({ description: 'Products with feature permissions', type: [UserProductPermissionDto] })
    products: UserProductPermissionDto[];
}


