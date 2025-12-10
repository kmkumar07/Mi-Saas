import {
    IsNotEmpty,
    IsInt,
    IsString,
    IsBoolean,
    IsOptional,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringChargePeriodDto } from './recurring-charge-period.dto';

/**
 * DTO for price with recurring charge period
 */
export class PriceDto {
    @ApiProperty({
        description: 'Price value in cents',
        example: 9900,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsInt()
    @Min(0)
    value: number;

    @ApiProperty({
        description: 'Currency code (ISO 4217)',
        example: 'USD',
        minLength: 3,
        maxLength: 3,
    })
    @IsNotEmpty()
    @IsString()
    currency: string;

    @ApiProperty({
        description: 'Whether the price is active',
        example: true,
        default: true,
    })
    @IsNotEmpty()
    @IsBoolean()
    isActive: boolean;

    @ApiPropertyOptional({
        description: 'Price description',
        example: 'Monthly subscription',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Recurring charge period configuration',
        type: RecurringChargePeriodDto,
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => RecurringChargePeriodDto)
    recurringChargePeriod: RecurringChargePeriodDto;
}
