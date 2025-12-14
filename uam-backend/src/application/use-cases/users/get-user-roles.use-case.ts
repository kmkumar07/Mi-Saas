import { Injectable, Inject } from '@nestjs/common';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { UserRoleResponseDto } from '../../dtos/users/user-role-response.dto';
import { UserRoleMapper } from '../../mappers/user-role.mapper';

/**
 * Get User Roles Use Case
 * Retrieves all roles assigned to an organization member
 * 
 * UPDATED: Now uses organizationMemberId instead of userId
 * CRITICAL: RBAC subject is always organization_members.id, never identity.id
 */
@Injectable()
export class GetUserRolesUseCase {
    constructor(
        @Inject('IMemberRoleRepository')
        private readonly memberRoleRepository: IMemberRoleRepository,
    ) { }

    async execute(organizationMemberId: string): Promise<UserRoleResponseDto[]> {
        const memberRoles = await this.memberRoleRepository.findByOrganizationMemberId(organizationMemberId);
        return UserRoleMapper.toResponseDtoArray(memberRoles);
    }
}
