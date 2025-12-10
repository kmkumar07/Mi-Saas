import { PartialType } from '@nestjs/swagger';
import { CreatePlanDto } from './create-plan.dto';

/**
 * DTO for updating a plan
 * Extends CreatePlanDto but makes all fields optional
 */
export class UpdatePlanDto extends PartialType(CreatePlanDto) { }
