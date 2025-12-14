import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { MemberRole } from '../../../domain/entities/user-role.entity';
import { UserRoleResponseDto } from '../../dtos/users/user-role-response.dto';
import { UserRoleMapper } from '../../mappers/user-role.mapper';

/**
 * Assign Role To User Use Case
 * Assigns a role to an organization member
 * 
 * UPDATED: Now uses organizationMemberId instead of userId
 * CRITICAL: RBAC subject is always organization_members.id, never identity.id
 */
@Injectable()
export class AssignRoleToUserUseCase {
    constructor(
        @Inject('IMemberRoleRepository')
        private readonly memberRoleRepository: IMemberRoleRepository,
        @Inject('IOrganizationMemberRepository')
        private readonly organizationMemberRepository: IOrganizationMemberRepository,
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(organizationMemberId: string, roleId: string, productId?: string, assignedBy?: string): Promise<UserRoleResponseDto> {
        // 1. Validate organization member exists
        const member = await this.organizationMemberRepository.findById(organizationMemberId);
        if (!member) {
            throw new NotFoundException(`Organization member with ID ${organizationMemberId} not found`);
        }

        // 2. Validate role exists
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        // 3. Check if assignment already exists (currently per member+role, product optional)
        const existingAssignment = await this.memberRoleRepository.findByOrganizationMemberIdAndRoleId(organizationMemberId, roleId);
        if (existingAssignment) {
            throw new ConflictException('Role already assigned to organization member');
        }

        // 4. Create assignment
        const memberRole = MemberRole.create({
            organizationMemberId,
            roleId,
            productId,
            assignedBy,
        });

        const savedMemberRole = await this.memberRoleRepository.create(memberRole);
        return UserRoleMapper.toResponseDto(savedMemberRole);
    }
}
