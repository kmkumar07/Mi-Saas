import { Module } from '@nestjs/common';
import { AccountsController } from '../controllers/accounts.controller';
import { CreateAccountUseCase } from '../../application/use-cases/accounts/create-account.use-case';
import { AccountRepository } from '../../infrastructure/database/repositories/account.repository';
import { MockPaymentGatewayService } from '../../infrastructure/services/mock-payment-gateway.service';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository';
import { PAYMENT_GATEWAY } from '../../domain/services/payment-gateway.interface';

@Module({
    controllers: [AccountsController],
    providers: [
        CreateAccountUseCase,
        {
            provide: ACCOUNT_REPOSITORY,
            useClass: AccountRepository,
        },
        {
            provide: PAYMENT_GATEWAY,
            useClass: MockPaymentGatewayService,
        },
    ],
})
export class AccountsModule { }
