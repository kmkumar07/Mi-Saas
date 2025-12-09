import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { Password } from '../../../domain/value-objects/password.value-object';
import { Email } from '../../../domain/value-objects/email.value-object';
import { AuthProvider, AccountType } from '../../../domain/enums';
import { UserResponseDto } from '../../dtos/users/user-response.dto';
import { UserMapper } from '../../mappers/user.mapper';

/**
 * Create User Use Case
 * Handles user creation with validation
 */
@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(
        tenantId: string,
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
        authProvider: string = 'local',
        accountType: string = 'individual',
    ): Promise<UserResponseDto> {
        // Validate email
        const emailObj = Email.create(email);

        // Check if user already exists
        const exists = await this.userRepository.existsByEmail(emailObj.getValue(), tenantId);
        if (exists) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const passwordObj = await Password.createFromPlainText(password);

        // Create user entity
        const user = User.create({
            tenantId,
            email: emailObj.getValue(),
            passwordHash: passwordObj.getHashedValue(),
            authProvider: authProvider as AuthProvider,
            firstName,
            lastName,
            isActive: true,
            isEmailVerified: false,
            accountType: accountType as AccountType,
            isCompanyOwner: false,
            isSyncedFromAd: false,
            emailDomain: emailObj.getDomain(),
        });

        // Save to database
        const savedUser = await this.userRepository.create(user);

        return UserMapper.toResponseDto(savedUser);
    }
}
