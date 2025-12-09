import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { RoleResponseDto } from '../../dtos/roles/role-response.dto';
import { RoleMapper } from '../../mappers/role.mapper';

/**
 * Get Role Use Case
 * Retrieves role by ID
 */
@Injectable()
export class GetRoleUseCase {
    constructor(
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(roleId: string): Promise<RoleResponseDto> {
        const role = await this.roleRepository.findById(roleId);

        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        return RoleMapper.toResponseDto(role);
    }
}
