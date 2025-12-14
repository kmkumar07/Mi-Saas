import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { IEmployeeInvitationRepository } from '../../../domain/repositories/employee-invitation.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { IIdentityRepository } from '../../../domain/repositories/identity.repository.interface';
import { EmployeeInvitation } from '../../../domain/entities/employee-invitation.entity';
import { User } from '../../../domain/entities/user.entity';
import { MemberRole } from '../../../domain/entities/user-role.entity';
import { AcceptInvitationDto } from '../../dtos/invitations/accept-invitation.dto';
import { UserResponseDto } from '../../dtos/users/user-response.dto';
import { UserMapper } from '../../mappers/user.mapper';
import { AccountType, AuthProvider } from '../../../domain/enums';
import { CreateIdentityWithMembershipUseCase } from '../auth/create-identity-with-membership.use-case';
import { Email } from '../../../domain/value-objects/email.value-object';
import { Password } from '../../../domain/value-objects/password.value-object';

/**
 * Accept Invitation Use Case
 * Accepts an invitation and creates user account with full identity chain
 * 
 * UPDATED: Now uses CreateIdentityWithMembershipUseCase to create Identity → AuthenticationAccount → OrganizationMember
 */
@Injectable()
export class AcceptInvitationUseCase {
    constructor(
        @Inject('IEmployeeInvitationRepository')
        private readonly invitationRepository: IEmployeeInvitationRepository,
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('IMemberRoleRepository')
        private readonly memberRoleRepository: IMemberRoleRepository,
        @Inject('IIdentityRepository')
        private readonly identityRepository: IIdentityRepository,
        private readonly createIdentityWithMembershipUseCase: CreateIdentityWithMembershipUseCase,
    ) { }

    async execute(token: string, dto: AcceptInvitationDto): Promise<UserResponseDto> {
        // 1. Find invitation by token
        const invitation = await this.invitationRepository.findByToken(token);
        if (!invitation) {
            throw new NotFoundException('Invalid invitation token');
        }

        // 2. Validate invitation status
        if (!invitation.isPending()) {
            throw new BadRequestException(`Invitation is ${invitation.status}`);
        }

        if (invitation.isExpired()) {
            // Mark as expired if not already
            invitation.markAsExpired();
            await this.invitationRepository.update(invitation);
            throw new BadRequestException('Invitation has expired');
        }

        // 3. Check if identity already exists (check by email)
        const existingIdentity = await this.identityRepository.findByEmail(invitation.email);
        if (existingIdentity) {
            // Check if user already exists for this tenant
            const existingUser = await this.userRepository.findByEmail(invitation.email);
            if (existingUser && existingUser.tenantId === invitation.tenantId) {
                throw new ConflictException(`User with email ${invitation.email} already exists`);
            }
        }

        // 4. Create identity chain: Identity → AuthenticationAccount → OrganizationMember
        const identityResult = await this.createIdentityWithMembershipUseCase.execute({
            email: invitation.email,
            password: dto.password,
            firstName: dto.firstName,
            lastName: dto.lastName,
            tenantId: invitation.tenantId,
            provider: 'local',
            isEmailVerified: true, // Verified via invitation
        });

        // 5. Create user record for backward compatibility
        const emailObj = Email.create(invitation.email);
        const passwordObj = await Password.createFromPlainText(dto.password);
        const user = User.create({
            tenantId: invitation.tenantId,
            email: emailObj.getValue(),
            passwordHash: passwordObj.getHashedValue(),
            authProvider: AuthProvider.LOCAL,
            firstName: dto.firstName,
            lastName: dto.lastName,
            isActive: true,
            isEmailVerified: true, // Verified via invitation
            accountType: AccountType.INDIVIDUAL, // Default for employees
            isCompanyOwner: false,
            isSyncedFromAd: false,
            emailDomain: emailObj.getDomain(),
        });
        const savedUser = await this.userRepository.create(user);

        // 6. Assign roles using organizationMemberId
        if (invitation.roleIds && invitation.roleIds.length > 0) {
            const memberRoles = invitation.roleIds.map(roleId =>
                MemberRole.create({
                    organizationMemberId: identityResult.organizationMemberId,
                    roleId,
                    assignedBy: invitation.invitedBy,
                })
            );
            await this.memberRoleRepository.bulkCreate(memberRoles);
        }

        // 7. Mark invitation as accepted
        invitation.accept();
        await this.invitationRepository.update(invitation);

        return UserMapper.toResponseDto(savedUser);
    }
}
