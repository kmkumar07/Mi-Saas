import { IsNotEmpty, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AssignPermissionDto } from './assign-permission.dto';

/**
 * Bulk Assign Permissions DTO
 * Validates bulk permission assignment data
 */
export class BulkAssignPermissionsDto {
    @ApiProperty({
        description: 'Array of permissions to assign',
        type: [AssignPermissionDto],
    })
    @IsArray({ message: 'Permissions must be an array' })
    @ArrayMinSize(1, { message: 'At least one permission is required' })
    @ValidateNested({ each: true })
    @Type(() => AssignPermissionDto)
    @IsNotEmpty({ message: 'Permissions are required' })
    permissions: AssignPermissionDto[];
}
