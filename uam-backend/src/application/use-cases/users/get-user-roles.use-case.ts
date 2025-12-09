import { Injectable, Inject } from '@nestjs/common';
import { IUserRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { UserRoleResponseDto } from '../../dtos/users/user-role-response.dto';
import { UserRoleMapper } from '../../mappers/user-role.mapper';

/**
 * Get User Roles Use Case
 * Retrieves all roles assigned to a user
 */
@Injectable()
export class GetUserRolesUseCase {
    constructor(
        @Inject('IUserRoleRepository')
        private readonly userRoleRepository: IUserRoleRepository,
    ) { }

    async execute(userId: string): Promise<UserRoleResponseDto[]> {
        const userRoles = await this.userRoleRepository.findByUserId(userId);
        return UserRoleMapper.toResponseDtoArray(userRoles);
    }
}
