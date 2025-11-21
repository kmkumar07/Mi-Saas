import {
    IsNotEmpty,
    IsEnum,
    IsDateString,
    IsInt,
    IsOptional,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChargeFrequency } from '@domain/enums';

/**
 * DTO for recurring charge period
 */
export class RecurringChargePeriodDto {
    @ApiProperty({
        description: 'How often the charge recurs',
        enum: ChargeFrequency,
        example: ChargeFrequency.MONTHLY,
    })
    @IsNotEmpty()
    @IsEnum(ChargeFrequency)
    chargeFrequency: ChargeFrequency;

    @ApiProperty({
        description: 'Start date and time for recurring charges',
        example: '2025-01-01T00:00:00Z',
    })
    @IsNotEmpty()
    @IsDateString()
    startDateTime: string;

    @ApiPropertyOptional({
        description: 'Number of periods (omit for unlimited)',
        example: 12,
        minimum: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    numberOfPeriods?: number;
}
