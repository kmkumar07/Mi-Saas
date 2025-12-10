import { IsUUID, IsEmail, IsOptional, IsString, Length, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
    @ApiProperty({ format: 'uuid', description: 'Tenant ID that owns this account' })
    @IsUUID()
    tenantId: string;

    @ApiPropertyOptional({ format: 'uuid', description: 'Optional parent account ID' })
    @IsOptional()
    @IsUUID()
    parentAccountId?: string;

    @ApiProperty({ maxLength: 255, description: 'Company display name for the account' })
    @IsString()
    @Length(1, 255)
    companyName: string;

    @ApiPropertyOptional({ description: 'Legal name of the company' })
    @IsOptional()
    @IsString()
    legalName?: string;

    @ApiPropertyOptional({ description: 'Tax identifier (e.g., VAT number)' })
    @IsOptional()
    @IsString()
    taxId?: string;

    @ApiProperty({ format: 'email', description: 'Primary billing email address' })
    @IsEmail()
    billingEmail: string;

    @ApiPropertyOptional({ description: 'Billing address line 1' })
    @IsOptional()
    @IsString()
    billingAddressLine1?: string;

    @ApiPropertyOptional({ description: 'Billing address line 2' })
    @IsOptional()
    @IsString()
    billingAddressLine2?: string;

    @ApiPropertyOptional({ description: 'Billing city' })
    @IsOptional()
    @IsString()
    billingCity?: string;

    @ApiPropertyOptional({ description: 'Billing state or region' })
    @IsOptional()
    @IsString()
    billingState?: string;

    @ApiPropertyOptional({ description: 'Billing postal or ZIP code' })
    @IsOptional()
    @IsString()
    billingPostalCode?: string;

    @ApiPropertyOptional({ minLength: 2, maxLength: 2, description: 'Billing country (ISO 3166-1 alpha-2)' })
    @IsOptional()
    @IsString()
    @Length(2, 2)
    billingCountry?: string;

    @ApiPropertyOptional({ description: 'Preferred payment method (e.g., card, bank_transfer)' })
    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @ApiPropertyOptional({ minimum: 0, description: 'Optional credit limit in cents' })
    @IsOptional()
    @IsInt()
    @Min(0)
    creditLimit?: number;
}

export class AccountResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ format: 'uuid' })
    tenantId: string;

    @ApiPropertyOptional({ format: 'uuid' })
    parentAccountId?: string;

    @ApiProperty()
    companyName: string;

    @ApiPropertyOptional()
    legalName?: string;

    @ApiPropertyOptional()
    taxId?: string;

    @ApiProperty({ format: 'email' })
    billingEmail: string;

    @ApiPropertyOptional()
    billingAddressLine1?: string;

    @ApiPropertyOptional()
    billingAddressLine2?: string;

    @ApiPropertyOptional()
    billingCity?: string;

    @ApiPropertyOptional()
    billingState?: string;

    @ApiPropertyOptional()
    billingPostalCode?: string;

    @ApiPropertyOptional({ description: 'Billing country (ISO 3166-1 alpha-2)' })
    billingCountry?: string;

    @ApiPropertyOptional()
    paymentMethod?: string;

    @ApiPropertyOptional()
    paymentGatewayCustomerId?: string;

    @ApiProperty({ description: 'Current status of the account' })
    accountStatus: string;

    @ApiPropertyOptional()
    creditLimit?: number;

    @ApiProperty()
    currentBalance: number;

    @ApiPropertyOptional({ type: Object })
    metadata?: Record<string, any>;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
