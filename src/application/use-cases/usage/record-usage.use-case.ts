import { Injectable, Inject } from '@nestjs/common';
import { UsageEvent } from '../../../domain/entities/usage-event.entity';
import { IUsageEventRepository, USAGE_EVENT_REPOSITORY } from '../../../domain/repositories/usage-event.repository';
import { RecordUsageDto } from '../../dtos/usage.dto';

@Injectable()
export class RecordUsageUseCase {
    constructor(
        @Inject(USAGE_EVENT_REPOSITORY)
        private readonly usageEventRepository: IUsageEventRepository,
    ) { }

    async execute(dto: RecordUsageDto): Promise<void> {
        // Create usage event entity (validates input)
        const usageEvent = new UsageEvent({
            tenantId: dto.tenantId,
            customerId: dto.customerId,
            featureCode: dto.featureCode,
            quantity: dto.quantity,
            idempotencyKey: dto.idempotencyKey,
        });

        // Repository will handle idempotency check
        await this.usageEventRepository.create(usageEvent);
    }
}
