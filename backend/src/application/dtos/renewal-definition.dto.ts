import {
    IsNotEmpty,
    IsBoolean,
    IsString,
    IsInt,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TimePeriodDto } from './time-period.dto';

/**
 * DTO for renewal definition
 */
export class RenewalDefinitionDto {
    @ApiProperty({
        description: 'Whether the subscription expires',
        example: false,
    })
    @IsNotEmpty()
    @IsBoolean()
    isExpirable: boolean;

    @ApiProperty({
        description: 'Whether the subscription renews automatically',
        example: true,
    })
    @IsNotEmpty()
    @IsBoolean()
    isAutomaticRenewable: boolean;

    @ApiProperty({
        description: 'Renewal cycle units (e.g., month, year)',
        example: 'month',
    })
    @IsNotEmpty()
    @IsString()
    renewCycleUnits: string;

    @ApiProperty({
        description: 'Grace period before expiration',
        type: TimePeriodDto,
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => TimePeriodDto)
    gracePeriod: TimePeriodDto;

    @ApiProperty({
        description: 'Maximum number of renewal cycles (0 for unlimited)',
        example: 12,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsInt()
    @Min(0)
    maxRenewCycles: number;
}
