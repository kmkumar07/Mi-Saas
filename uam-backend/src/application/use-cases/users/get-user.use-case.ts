import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserResponseDto } from '../../dtos/users/user-response.dto';
import { UserMapper } from '../../mappers/user.mapper';

/**
 * Get User Use Case
 * Retrieves user by ID
 */
@Injectable()
export class GetUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(userId: string): Promise<UserResponseDto> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return UserMapper.toResponseDto(user);
    }
}
