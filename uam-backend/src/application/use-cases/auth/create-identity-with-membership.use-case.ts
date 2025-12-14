import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IIdentityRepository } from '../../../domain/repositories/identity.repository.interface';
import { IAuthenticationAccountRepository } from '../../../domain/repositories/authentication-account.repository.interface';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';
import { Identity } from '../../../domain/entities/identity.entity';
import { AuthenticationAccount } from '../../../domain/entities/authentication-account.entity';
import { OrganizationMember } from '../../../domain/entities/organization-member.entity';
import { Password } from '../../../domain/value-objects/password.value-object';

export interface CreateIdentityWithMembershipInput {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    tenantId: string;
    provider?: 'local' | 'azure_ad' | 'google' | 'cognito';
    isEmailVerified?: boolean;
}

export interface CreateIdentityWithMembershipOutput {
    identityId: string;
    authenticationAccountId: string;
    organizationMemberId: string;
}

/**
 * Create Identity With Membership Use Case
 * Orchestrates creation of the complete identity chain:
 * Identity → AuthenticationAccount → OrganizationMember
 * 
 * This is idempotent - if identity already exists for the email,
 * it will reuse the existing identity and create new membership if needed.
 */
@Injectable()
export class CreateIdentityWithMembershipUseCase {
    constructor(
        @Inject('IIdentityRepository')
        private readonly identityRepository: IIdentityRepository,
        @Inject('IAuthenticationAccountRepository')
        private readonly authAccountRepository: IAuthenticationAccountRepository,
        @Inject('IOrganizationMemberRepository')
        private readonly organizationMemberRepository: IOrganizationMemberRepository,
    ) {}

    async execute(input: CreateIdentityWithMembershipInput): Promise<CreateIdentityWithMembershipOutput> {
        const {
            email,
            password,
            firstName,
            lastName,
            tenantId,
            provider = 'local',
            isEmailVerified = false,
        } = input;

        // 1. Check if identity already exists by email (idempotency)
        let identity = await this.identityRepository.findByEmail(email);

        if (!identity) {
            // Create new identity
            identity = Identity.create({
                email,
                firstName: firstName || null,
                lastName: lastName || null,
            });
            identity = await this.identityRepository.create(identity);
        } else {
            // Update profile if names provided and different
            if (firstName && identity.firstName !== firstName) {
                identity.updateProfile(firstName, identity.lastName || undefined);
            }
            if (lastName && identity.lastName !== lastName) {
                identity.updateProfile(identity.firstName || undefined, lastName);
            }
            if (identity.firstName !== firstName || identity.lastName !== lastName) {
                identity = await this.identityRepository.update(identity);
            }
        }

        // 2. Check if authentication account exists for this identity and provider
        let authAccount = await this.authAccountRepository.findByIdentityIdAndProvider(
            identity.id,
            provider,
        );

        if (!authAccount) {
            // Hash password for local provider
            let passwordHash: string | null = null;
            if (provider === 'local' && password) {
                const passwordObj = await Password.createFromPlainText(password);
                passwordHash = passwordObj.getHashedValue();
            }

            // Create authentication account
            authAccount = AuthenticationAccount.create({
                identityId: identity.id,
                provider,
                email,
                passwordHash,
                isActive: true,
                isEmailVerified,
            });
            authAccount = await this.authAccountRepository.create(authAccount);
        } else {
            // Update password if provided and different (for local provider)
            if (provider === 'local' && password) {
                const passwordObj = await Password.createFromPlainText(password);
                const newHash = passwordObj.getHashedValue();
                if (authAccount.passwordHash !== newHash) {
                    // Note: AuthenticationAccount doesn't have a method to update passwordHash
                    // We need to create a new account or update the entity
                    // For now, we'll skip updating if account exists
                    // In production, you might want to add a method to update password
                }
            }
        }

        // 3. Check if organization member already exists for this identity and tenant
        let organizationMember = await this.organizationMemberRepository.findByIdentityIdAndTenantId(
            identity.id,
            tenantId,
        );

        if (!organizationMember) {
            // Create organization member
            organizationMember = OrganizationMember.create({
                identityId: identity.id,
                tenantId,
                isActive: true,
            });
            organizationMember = await this.organizationMemberRepository.create(organizationMember);
        } else {
            // Activate if inactive
            if (!organizationMember.isActive) {
                organizationMember.activate();
                organizationMember = await this.organizationMemberRepository.update(organizationMember);
            }
        }

        return {
            identityId: identity.id,
            authenticationAccountId: authAccount.id,
            organizationMemberId: organizationMember.id,
        };
    }
}

