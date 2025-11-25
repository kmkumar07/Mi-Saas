import { Injectable, Inject } from '@nestjs/common';
import { Account } from '../../../domain/entities/account.entity';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '../../../domain/repositories/account.repository';
import { IPaymentGateway, PAYMENT_GATEWAY } from '../../../domain/services/payment-gateway.interface';
import { CreateAccountDto, AccountResponseDto } from '../../dtos/account.dto';

@Injectable()
export class CreateAccountUseCase {
    constructor(
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: IPaymentGateway,
    ) { }

    async execute(dto: CreateAccountDto): Promise<AccountResponseDto> {
        // Create account entity (validates input)
        const account = new Account({
            tenantId: dto.tenantId,
            parentAccountId: dto.parentAccountId,
            companyName: dto.companyName,
            legalName: dto.legalName,
            taxId: dto.taxId,
            billingEmail: dto.billingEmail,
            billingAddressLine1: dto.billingAddressLine1,
            billingAddressLine2: dto.billingAddressLine2,
            billingCity: dto.billingCity,
            billingState: dto.billingState,
            billingPostalCode: dto.billingPostalCode,
            billingCountry: dto.billingCountry,
            paymentMethod: dto.paymentMethod,
            creditLimit: dto.creditLimit,
        });

        // Create customer in payment gateway
        const gatewayCustomerId = await this.paymentGateway.createCustomer(account);

        // Update account with gateway customer ID
        account.updatePaymentMethod(dto.paymentMethod || 'card', gatewayCustomerId);

        // Save account
        const savedAccount = await this.accountRepository.create(account);

        return this.toDto(savedAccount);
    }

    private toDto(account: Account): AccountResponseDto {
        return {
            id: account.id,
            tenantId: account.tenantId,
            parentAccountId: account.parentAccountId,
            companyName: account.companyName,
            legalName: account.legalName,
            taxId: account.taxId,
            billingEmail: account.billingEmail,
            billingAddressLine1: account.billingAddressLine1,
            billingAddressLine2: account.billingAddressLine2,
            billingCity: account.billingCity,
            billingState: account.billingState,
            billingPostalCode: account.billingPostalCode,
            billingCountry: account.billingCountry,
            paymentMethod: account.paymentMethod,
            paymentGatewayCustomerId: account.paymentGatewayCustomerId,
            accountStatus: account.accountStatus,
            creditLimit: account.creditLimit,
            currentBalance: account.currentBalance,
            metadata: account.metadata,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        };
    }
}
