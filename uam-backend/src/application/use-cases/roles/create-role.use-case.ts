import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { SystemRole } from '../../../domain/entities/system-role.entity';
import { CreateRoleDto } from '../../dtos/roles/create-role.dto';
import { RoleResponseDto } from '../../dtos/roles/role-response.dto';
import { RoleMapper } from '../../mappers/role.mapper';

/**
 * Create Role Use Case
 * Creates a new tenant-specific role
 */
@Injectable()
export class CreateRoleUseCase {
    constructor(
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(tenantId: string, dto: CreateRoleDto): Promise<RoleResponseDto> {
        // 1. Check if role code already exists for this tenant
        const existingRole = await this.roleRepository.findByCode(dto.roleCode, tenantId);
        if (existingRole) {
            throw new ConflictException(`Role with code ${dto.roleCode} already exists`);
        }

        // 2. Create role entity
        const role = SystemRole.create({
            tenantId,
            roleCode: dto.roleCode,
            roleName: dto.roleName,
            description: dto.description,
            isSystemRole: false, // Custom roles are never system roles
            hierarchyLevel: dto.hierarchyLevel,
        });

        // 3. Persist role
        const savedRole = await this.roleRepository.create(role);
        return RoleMapper.toResponseDto(savedRole);
    }
}
