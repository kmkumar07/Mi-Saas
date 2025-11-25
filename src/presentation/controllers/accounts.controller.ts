import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CreateAccountUseCase } from '../../application/use-cases/accounts/create-account.use-case';
import { CreateAccountDto, AccountResponseDto } from '../../application/dtos/account.dto';

@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly createAccountUseCase: CreateAccountUseCase,
    ) { }

    @Post()
    async createAccount(@Body() dto: CreateAccountDto): Promise<AccountResponseDto> {
        return this.createAccountUseCase.execute(dto);
    }

    // Additional endpoints can be added here:
    // @Get(':id')
    // @Get('tenant/:tenantId')
    // @Patch(':id')
}
