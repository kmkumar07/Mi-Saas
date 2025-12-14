import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { Password } from '../../../domain/value-objects/password.value-object';
import { Email } from '../../../domain/value-objects/email.value-object';
import { AuthProvider, AccountType } from '../../../domain/enums';
import { UserResponseDto } from '../../dtos/users/user-response.dto';
import { UserMapper } from '../../mappers/user.mapper';
import { CreateIdentityWithMembershipUseCase } from '../auth/create-identity-with-membership.use-case';

/**
 * Create User Use Case
 * Handles user creation with validation
 * 
 * UPDATED: Now uses CreateIdentityWithMembershipUseCase to create the proper identity chain.
 * Still creates a user record for backward compatibility with existing code.
 */
@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('IOrganizationMemberRepository')
        private readonly organizationMemberRepository: IOrganizationMemberRepository,
        private readonly createIdentityWithMembershipUseCase: CreateIdentityWithMembershipUseCase,
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

        // Check if user already exists (backward compatibility check)
        const exists = await this.userRepository.existsByEmail(emailObj.getValue(), tenantId);
        if (exists) {
            throw new ConflictException('User with this email already exists');
        }

        // Create identity chain: Identity → AuthenticationAccount → OrganizationMember
        const identityResult = await this.createIdentityWithMembershipUseCase.execute({
            email: emailObj.getValue(),
            password,
            firstName,
            lastName,
            tenantId,
            provider: authProvider as 'local' | 'azure_ad' | 'google' | 'cognito',
            isEmailVerified: false,
        });

        // Get organization member to verify it was created
        const orgMember = await this.organizationMemberRepository.findById(identityResult.organizationMemberId);
        if (!orgMember) {
            throw new Error('Failed to create organization member');
        }

        // For backward compatibility, still create a user record
        // This can be deprecated in the future
        const passwordObj = await Password.createFromPlainText(password);
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

        const savedUser = await this.userRepository.create(user);

        return UserMapper.toResponseDto(savedUser);
    }
}
