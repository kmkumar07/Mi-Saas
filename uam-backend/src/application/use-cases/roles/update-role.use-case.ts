import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { SystemRole } from '../../../domain/entities/system-role.entity';
import { UpdateRoleDto } from '../../dtos/roles/update-role.dto';
import { RoleResponseDto } from '../../dtos/roles/role-response.dto';
import { RoleMapper } from '../../mappers/role.mapper';

/**
 * Update Role Use Case
 * Updates role information
 */
@Injectable()
export class UpdateRoleUseCase {
    constructor(
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(roleId: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
        // 1. Find role
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        // 2. Check if system role (optional: prevent editing system roles)
        if (role.isSystemRole) {
            throw new ForbiddenException('Cannot modify system roles');
        }

        // 3. Update role entity
        // We need to create a new instance with updated props since entity is immutable
        // But for simplicity in this MVP, we'll assume the entity has setters or we recreate it
        // Since the entity implementation uses private props and getters, we should use a method on the entity or recreate it

        // Recreating with updated props (using existing values as fallback)
        const updatedRole = SystemRole.fromPersistence({
            id: role.id,
            tenantId: role.tenantId,
            roleCode: role.roleCode,
            roleName: dto.roleName ?? role.roleName,
            description: dto.description !== undefined ? dto.description : role.description,
            isSystemRole: role.isSystemRole,
            hierarchyLevel: dto.hierarchyLevel ?? role.hierarchyLevel,
            createdAt: role.createdAt,
            updatedAt: new Date(),
        });

        // 4. Persist update
        const savedRole = await this.roleRepository.update(updatedRole);
        return RoleMapper.toResponseDto(savedRole);
    }
}
