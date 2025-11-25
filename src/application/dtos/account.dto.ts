import { IsUUID, IsEmail, IsOptional, IsString, Length, IsInt, Min } from 'class-validator';

export class CreateAccountDto {
    @IsUUID()
    tenantId: string;

    @IsOptional()
    @IsUUID()
    parentAccountId?: string;

    @IsString()
    @Length(1, 255)
    companyName: string;

    @IsOptional()
    @IsString()
    legalName?: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsEmail()
    billingEmail: string;

    @IsOptional()
    @IsString()
    billingAddressLine1?: string;

    @IsOptional()
    @IsString()
    billingAddressLine2?: string;

    @IsOptional()
    @IsString()
    billingCity?: string;

    @IsOptional()
    @IsString()
    billingState?: string;

    @IsOptional()
    @IsString()
    billingPostalCode?: string;

    @IsOptional()
    @IsString()
    @Length(2, 2)
    billingCountry?: string;

    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    creditLimit?: number;
}

export class AccountResponseDto {
    id: string;
    tenantId: string;
    parentAccountId?: string;
    companyName: string;
    legalName?: string;
    taxId?: string;
    billingEmail: string;
    billingAddressLine1?: string;
    billingAddressLine2?: string;
    billingCity?: string;
    billingState?: string;
    billingPostalCode?: string;
    billingCountry?: string;
    paymentMethod?: string;
    paymentGatewayCustomerId?: string;
    accountStatus: string;
    creditLimit?: number;
    currentBalance: number;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
