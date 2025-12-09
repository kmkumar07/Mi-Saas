import { ApiProperty } from '@nestjs/swagger';

/**
 * User Response DTO
 * Excludes sensitive fields like password hash
 */
export class UserResponseDto {
    @ApiProperty({ description: 'User ID' })
    id: string;

    @ApiProperty({ description: 'Tenant ID' })
    tenantId: string;

    @ApiProperty({ description: 'Email address' })
    email: string;

    @ApiProperty({ description: 'First name', required: false })
    firstName?: string | null;

    @ApiProperty({ description: 'Last name', required: false })
    lastName?: string | null;

    @ApiProperty({ description: 'Full name' })
    fullName: string;

    @ApiProperty({ description: 'Is account active' })
    isActive: boolean;

    @ApiProperty({ description: 'Is email verified' })
    isEmailVerified: boolean;

    @ApiProperty({ description: 'Authentication provider' })
    authProvider: string;

    @ApiProperty({ description: 'Account type' })
    accountType: string;

    @ApiProperty({ description: 'Is company owner' })
    isCompanyOwner: boolean;

    @ApiProperty({ description: 'Email domain', required: false })
    emailDomain?: string | null;

    @ApiProperty({ description: 'Last login timestamp', required: false })
    lastLoginAt?: Date | null;

    @ApiProperty({ description: 'Created timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated timestamp' })
    updatedAt: Date;
}
