import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IUserRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { UserRole } from '../../../domain/entities/user-role.entity';
import { UserRoleResponseDto } from '../../dtos/users/user-role-response.dto';
import { UserRoleMapper } from '../../mappers/user-role.mapper';

/**
 * Assign Role To User Use Case
 * Assigns a role to a user
 */
@Injectable()
export class AssignRoleToUserUseCase {
    constructor(
        @Inject('IUserRoleRepository')
        private readonly userRoleRepository: IUserRoleRepository,
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(userId: string, roleId: string, productId?: string, assignedBy?: string): Promise<UserRoleResponseDto> {
        // 1. Validate user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // 2. Validate role exists
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        // 3. Check if assignment already exists (currently per user+role, product optional)
        const existingAssignment = await this.userRoleRepository.findByUserIdAndRoleId(userId, roleId);
        if (existingAssignment) {
            throw new ConflictException('Role already assigned to user');
        }

        // 4. Create assignment
        const userRole = UserRole.create({
            userId,
            roleId,
            productId,
            assignedBy,
        });

        const savedUserRole = await this.userRoleRepository.create(userRole);
        return UserRoleMapper.toResponseDto(savedUserRole);
    }
}
