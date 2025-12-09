import { Injectable, Inject } from '@nestjs/common';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { RoleResponseDto } from '../../dtos/roles/role-response.dto';
import { RoleMapper } from '../../mappers/role.mapper';

/**
 * List Roles Use Case
 * Retrieves all roles (system + tenant-specific)
 */
@Injectable()
export class ListRolesUseCase {
    constructor(
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(tenantId?: string): Promise<RoleResponseDto[]> {
        const roles = await this.roleRepository.findAll(tenantId);
        return RoleMapper.toResponseDtoArray(roles);
    }
}
