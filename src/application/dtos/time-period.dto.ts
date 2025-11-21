import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for time period
 */
export class TimePeriodDto {
    @ApiProperty({
        description: 'Time period name (e.g., day, week, month, year)',
        example: 'month',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Time period value',
        example: 1,
        minimum: 1,
    })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    value: number;
}
