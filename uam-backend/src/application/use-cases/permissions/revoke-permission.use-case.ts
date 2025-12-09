import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRolePermissionRepository } from '../../../domain/repositories/role-permission.repository.interface';

/**
 * Revoke Permission Use Case
 * Revokes a permission from a role
 */
@Injectable()
export class RevokePermissionUseCase {
    constructor(
        @Inject('IRolePermissionRepository')
        private readonly permissionRepository: IRolePermissionRepository,
    ) { }

    async execute(permissionId: string): Promise<void> {
        // Check if permission exists
        const permission = await this.permissionRepository.findById(permissionId);
        if (!permission) {
            throw new NotFoundException(`Permission with ID ${permissionId} not found`);
        }

        await this.permissionRepository.delete(permissionId);
    }
}
