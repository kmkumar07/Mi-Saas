import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';

/**
 * Remove Role From User Use Case
 * Removes a role assignment from an organization member
 * 
 * UPDATED: Now uses organizationMemberId instead of userId
 * CRITICAL: RBAC subject is always organization_members.id, never identity.id
 */
@Injectable()
export class RemoveRoleFromUserUseCase {
    constructor(
        @Inject('IMemberRoleRepository')
        private readonly memberRoleRepository: IMemberRoleRepository,
    ) { }

    async execute(organizationMemberId: string, roleId: string): Promise<void> {
        // Check if assignment exists
        const existingAssignment = await this.memberRoleRepository.findByOrganizationMemberIdAndRoleId(organizationMemberId, roleId);
        if (!existingAssignment) {
            throw new NotFoundException('Role not assigned to organization member');
        }

        await this.memberRoleRepository.deleteByOrganizationMemberIdAndRoleId(organizationMemberId, roleId);
    }
}
