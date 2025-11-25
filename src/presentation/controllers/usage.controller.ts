import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { RecordUsageUseCase } from '../../application/use-cases/usage/record-usage.use-case';
import { GetEntitlementsUseCase } from '../../application/use-cases/usage/get-entitlements.use-case';
import { RecordUsageDto, EntitlementsResponseDto } from '../../application/dtos/usage.dto';

@Controller('usage')
export class UsageController {
    constructor(
        private readonly recordUsageUseCase: RecordUsageUseCase,
        private readonly getEntitlementsUseCase: GetEntitlementsUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.NO_CONTENT)
    async recordUsage(@Body() dto: RecordUsageDto): Promise<void> {
        await this.recordUsageUseCase.execute(dto);
    }

    @Get('entitlements/:tenantId')
    async getEntitlements(
        @Param('tenantId') tenantId: string,
    ): Promise<EntitlementsResponseDto> {
        return this.getEntitlementsUseCase.execute(tenantId);
    }
}
