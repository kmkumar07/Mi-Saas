import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../users/user-response.dto';

export class RegisterTenantResponseDto {
    @ApiProperty({ description: 'Newly created tenant ID from public.tenants' })
    tenantId: string;

    @ApiProperty({ description: 'Tenant name' })
    tenantName: string;

    @ApiProperty({ description: 'Account type of the tenant', enum: ['individual', 'company'] })
    accountType: 'individual' | 'company';

    @ApiProperty({ description: 'Admin user created in uam.users', type: UserResponseDto })
    adminUser: UserResponseDto;
}


