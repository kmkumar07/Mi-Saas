import { ApiProperty } from '@nestjs/swagger';

/**
 * User Role Response DTO
 * Contains user-role assignment information
 */
export class UserRoleResponseDto {
    @ApiProperty({ description: 'User-role assignment ID' })
    id: string;

    @ApiProperty({ description: 'User ID' })
    userId: string;

    @ApiProperty({ description: 'Role ID' })
    roleId: string;

    @ApiProperty({ description: 'Product ID for which the role is assigned', required: false })
    productId?: string | null;

    @ApiProperty({ description: 'ID of user who assigned the role', required: false })
    assignedBy?: string | null;

    @ApiProperty({ description: 'Assignment timestamp' })
    assignedAt: Date;
}
