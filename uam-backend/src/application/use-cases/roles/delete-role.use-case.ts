import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';

/**
 * Delete Role Use Case
 * Deletes a role
 */
@Injectable()
export class DeleteRoleUseCase {
    constructor(
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(roleId: string): Promise<void> {
        // 1. Find role
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        // 2. Check if system role
        if (!role.canBeDeleted()) {
            throw new ForbiddenException('Cannot delete system roles');
        }

        // 3. Delete role
        await this.roleRepository.delete(roleId);
    }
}
