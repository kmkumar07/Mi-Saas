import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { UserRole } from '../../../domain/entities/user-role.entity';
import { UserRoleResponseDto } from '../../dtos/users/user-role-response.dto';
import { UserRoleMapper } from '../../mappers/user-role.mapper';

/**
 * Bulk Assign Roles Use Case
 * Assigns multiple roles to a user
 */
@Injectable()
export class BulkAssignRolesUseCase {
    constructor(
        @Inject('IUserRoleRepository')
        private readonly userRoleRepository: IUserRoleRepository,
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(userId: string, roleIds: string[], assignedBy?: string): Promise<UserRoleResponseDto[]> {
        // 1. Validate user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
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
        const existingAssignments = await this.userRoleRepository.findByUserId(userId);
        const existingRoleIds = new Set(existingAssignments.map(ur => ur.roleId));

        const newRoleIds = roleIds.filter(id => !existingRoleIds.has(id));

        if (newRoleIds.length === 0) {
            return UserRoleMapper.toResponseDtoArray(existingAssignments);
        }

        // 4. Create new assignments
        const newUserRoles = newRoleIds.map(roleId =>
            UserRole.create({
                userId,
                roleId,
                assignedBy,
            })
        );

        const savedUserRoles = await this.userRoleRepository.bulkCreate(newUserRoles);

        // Return all assignments (existing + new)
        const allRoles = [...existingAssignments, ...savedUserRoles];
        return UserRoleMapper.toResponseDtoArray(allRoles);
    }
}
