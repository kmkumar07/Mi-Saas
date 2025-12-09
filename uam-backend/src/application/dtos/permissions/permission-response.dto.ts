import { ApiProperty } from '@nestjs/swagger';

/**
 * Permission Response DTO
 * Contains permission information
 */
export class PermissionResponseDto {
    @ApiProperty({ description: 'Permission ID' })
    id: string;

    @ApiProperty({ description: 'Role ID' })
    roleId: string;

    @ApiProperty({ description: 'Feature ID' })
    featureId: string;

    @ApiProperty({ description: 'Can read' })
    canRead: boolean;

    @ApiProperty({ description: 'Can write' })
    canWrite: boolean;

    @ApiProperty({ description: 'Can execute' })
    canExecute: boolean;

    @ApiProperty({ description: 'Created timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated timestamp' })
    updatedAt: Date;
}
