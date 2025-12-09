import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserResponseDto } from '../../dtos/users/user-response.dto';
import { UserMapper } from '../../mappers/user.mapper';

/**
 * List Users Use Case
 * Retrieves all users for a tenant
 */
@Injectable()
export class ListUsersUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(tenantId: string): Promise<UserResponseDto[]> {
        const users = await this.userRepository.findByTenantId(tenantId);
        return UserMapper.toResponseDtoArray(users);
    }
}
