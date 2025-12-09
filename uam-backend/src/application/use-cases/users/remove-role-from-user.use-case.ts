import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRoleRepository } from '../../../domain/repositories/user-role.repository.interface';

/**
 * Remove Role From User Use Case
 * Removes a role assignment from a user
 */
@Injectable()
export class RemoveRoleFromUserUseCase {
    constructor(
        @Inject('IUserRoleRepository')
        private readonly userRoleRepository: IUserRoleRepository,
    ) { }

    async execute(userId: string, roleId: string): Promise<void> {
        // Check if assignment exists
        const existingAssignment = await this.userRoleRepository.findByUserIdAndRoleId(userId, roleId);
        if (!existingAssignment) {
            throw new NotFoundException('Role not assigned to user');
        }

        await this.userRoleRepository.deleteByUserIdAndRoleId(userId, roleId);
    }
}
