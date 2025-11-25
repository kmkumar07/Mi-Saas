import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateAccountUseCase } from '../../application/use-cases/accounts/create-account.use-case';
import { CreateAccountDto, AccountResponseDto } from '../../application/dtos/account.dto';

@ApiTags('accounts')
@Controller('api/accounts')
export class AccountsController {
    constructor(
        private readonly createAccountUseCase: CreateAccountUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new customer account' })
    @ApiResponse({
        status: 201,
        description: 'Account created successfully',
        type: AccountResponseDto,
    })
    async createAccount(@Body() dto: CreateAccountDto): Promise<AccountResponseDto> {
        return this.createAccountUseCase.execute(dto);
    }

    // Additional endpoints can be added here:
    // @Get(':id')
    // @Get('tenant/:tenantId')
    // @Patch(':id')
}
