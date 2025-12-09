import { ApiProperty } from '@nestjs/swagger';

/**
 * Role Response DTO
 * Contains role information
 */
export class RoleResponseDto {
    @ApiProperty({ description: 'Role ID' })
    id: string;

    @ApiProperty({ description: 'Tenant ID (null for global roles)', required: false })
    tenantId?: string | null;

    @ApiProperty({ description: 'Role code' })
    roleCode: string;

    @ApiProperty({ description: 'Role name' })
    roleName: string;

    @ApiProperty({ description: 'Role description', required: false })
    description?: string | null;

    @ApiProperty({ description: 'Is system role' })
    isSystemRole: boolean;

    @ApiProperty({ description: 'Hierarchy level' })
    hierarchyLevel: number;

    @ApiProperty({ description: 'Created timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated timestamp' })
    updatedAt: Date;
}
