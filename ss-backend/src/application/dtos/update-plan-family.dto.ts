import { PartialType } from '@nestjs/swagger';
import { CreatePlanFamilyDto } from './create-plan-family.dto';

/**
 * DTO for updating a plan family
 * Extends CreatePlanFamilyDto but makes all fields optional
 */
export class UpdatePlanFamilyDto extends PartialType(CreatePlanFamilyDto) { }

