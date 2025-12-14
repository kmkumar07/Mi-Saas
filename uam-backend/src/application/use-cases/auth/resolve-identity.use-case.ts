import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IAuthenticationAccountRepository } from '../../../domain/repositories/authentication-account.repository.interface';
import { IIdentityRepository } from '../../../domain/repositories/identity.repository.interface';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';
import { Password } from '../../../domain/value-objects/password.value-object';

/**
 * Resolve Identity Use Case
 * Resolves authentication account → identity → organization_members
 * 
 * This is the authentication resolution flow:
 * auth_account (login) → identity (global person) → organization_members (tenant membership)
 * 
 * CRITICAL: The JWT sub claim will be organization_members.id (tenant-scoped)
 */
export interface ResolvedIdentity {
    identityId: string;
    organizationMemberId: string; // This becomes the JWT sub claim
    tenantId: string;
    email: string;
}

@Injectable()
export class ResolveIdentityUseCase {
    constructor(
        @Inject('IAuthenticationAccountRepository')
        private readonly authAccountRepository: IAuthenticationAccountRepository,
        @Inject('IIdentityRepository')
        private readonly identityRepository: IIdentityRepository,
        @Inject('IOrganizationMemberRepository')
        private readonly organizationMemberRepository: IOrganizationMemberRepository,
    ) { }

    /**
     * Resolve identity from email and password (local provider)
     * @param email - Email address
     * @param password - Password
     * @param tenantId - Tenant ID (required to resolve organization membership)
     * @returns Resolved identity with organization member ID
     * @throws UnauthorizedException if authentication fails
     */
    async execute(email: string, password: string, tenantId: string): Promise<ResolvedIdentity> {
        // 1. Find authentication account by email
        const authAccount = await this.authAccountRepository.findByEmail(email);

        if (!authAccount) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 2. Verify it's a local provider with password
        if (authAccount.provider !== 'local' || !authAccount.passwordHash) {
            throw new UnauthorizedException('Invalid authentication method');
        }

        // 3. Verify password
        const passwordObj = Password.fromHash(authAccount.passwordHash);
        const isValid = await passwordObj.compare(password);

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 4. Check if auth account is active
        if (!authAccount.isActive) {
            throw new UnauthorizedException('Account is inactive');
        }

        // 5. Get identity
        const identity = await this.identityRepository.findById(authAccount.identityId);

        if (!identity) {
            throw new UnauthorizedException('Identity not found');
        }

        // 6. Get organization membership for this tenant
        const member = await this.organizationMemberRepository.findActiveByIdentityIdAndTenantId(
            identity.id,
            tenantId
        );

        if (!member) {
            throw new UnauthorizedException('Not a member of this organization');
        }

        // 7. Record login on auth account
        authAccount.recordLogin();
        await this.authAccountRepository.update(authAccount);

        return {
            identityId: identity.id,
            organizationMemberId: member.id, // This becomes the JWT sub claim
            tenantId: member.tenantId,
            email: identity.email,
        };
    }
}

