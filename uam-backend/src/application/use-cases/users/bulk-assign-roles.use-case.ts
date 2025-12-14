import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { MemberRole } from '../../../domain/entities/user-role.entity';
import { UserRoleResponseDto } from '../../dtos/users/user-role-response.dto';
import { UserRoleMapper } from '../../mappers/user-role.mapper';

/**
 * Bulk Assign Roles Use Case
 * Assigns multiple roles to an organization member
 * 
 * UPDATED: Now uses organizationMemberId instead of userId
 * CRITICAL: RBAC subject is always organization_members.id, never identity.id
 */
@Injectable()
export class BulkAssignRolesUseCase {
    constructor(
        @Inject('IMemberRoleRepository')
        private readonly memberRoleRepository: IMemberRoleRepository,
        @Inject('IOrganizationMemberRepository')
        private readonly organizationMemberRepository: IOrganizationMemberRepository,
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(organizationMemberId: string, roleIds: string[], productId?: string, assignedBy?: string): Promise<UserRoleResponseDto[]> {
        // 1. Validate organization member exists
        const member = await this.organizationMemberRepository.findById(organizationMemberId);
        if (!member) {
            throw new NotFoundException(`Organization member with ID ${organizationMemberId} not found`);
        }

        // 2. Validate all roles exist
        // Optimization: In a real app, use a bulk find method
        for (const roleId of roleIds) {
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
                throw new NotFoundException(`Role with ID ${roleId} not found`);
            }
        }

        // 3. Filter out existing assignments to avoid duplicates
        const existingAssignments = await this.memberRoleRepository.findByOrganizationMemberId(organizationMemberId);
        const existingRoleIds = new Set(existingAssignments.map(mr => mr.roleId));

        const newRoleIds = roleIds.filter(id => !existingRoleIds.has(id));

        if (newRoleIds.length === 0) {
            return UserRoleMapper.toResponseDtoArray(existingAssignments);
        }

        // 4. Create new assignments
        const newMemberRoles = newRoleIds.map(roleId =>
            MemberRole.create({
                organizationMemberId,
                roleId,
                productId,
                assignedBy,
            })
        );

        const savedMemberRoles = await this.memberRoleRepository.bulkCreate(newMemberRoles);

        // Return all assignments (existing + new)
        const allRoles = [...existingAssignments, ...savedMemberRoles];
        return UserRoleMapper.toResponseDtoArray(allRoles);
    }
}
