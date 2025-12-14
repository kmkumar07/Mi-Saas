import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { IEmployeeInvitationRepository } from '../../../domain/repositories/employee-invitation.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { IIdentityRepository } from '../../../domain/repositories/identity.repository.interface';
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
 * Admin Activate Invitation Use Case
 * Allows an admin to activate an employee invitation by ID and set the user's password.
 * 
 * UPDATED: Now uses CreateIdentityWithMembershipUseCase to create Identity → AuthenticationAccount → OrganizationMember
 */
@Injectable()
export class AdminActivateInvitationUseCase {
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

    async execute(invitationId: string, tenantId: string, dto: AcceptInvitationDto): Promise<UserResponseDto> {
        // 1. Find invitation by ID
        const invitation = await this.invitationRepository.findById(invitationId);
        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        // 2. Ensure invitation belongs to the current tenant
        if (invitation.tenantId !== tenantId) {
            throw new UnauthorizedException('Invitation does not belong to this tenant');
        }

        // 3. Validate invitation status
        if (!invitation.isPending()) {
            throw new BadRequestException(`Invitation is ${invitation.status}`);
        }

        if (invitation.isExpired()) {
            invitation.markAsExpired();
            await this.invitationRepository.update(invitation);
            throw new BadRequestException('Invitation has expired');
        }

        // 4. Check if identity already exists (check by email)
        const existingIdentity = await this.identityRepository.findByEmail(invitation.email);
        if (existingIdentity) {
            // Check if user already exists for this tenant
            const existingUser = await this.userRepository.findByEmail(invitation.email);
            if (existingUser && existingUser.tenantId === invitation.tenantId) {
                throw new ConflictException(`User with email ${invitation.email} already exists`);
            }
        }

        // 5. Create identity chain: Identity → AuthenticationAccount → OrganizationMember
        const identityResult = await this.createIdentityWithMembershipUseCase.execute({
            email: invitation.email,
            password: dto.password,
            firstName: dto.firstName,
            lastName: dto.lastName,
            tenantId: invitation.tenantId,
            provider: 'local',
            isEmailVerified: true,
        });

        // 6. Create user record for backward compatibility
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
            isEmailVerified: true,
            accountType: AccountType.INDIVIDUAL,
            isCompanyOwner: false,
            isSyncedFromAd: false,
            emailDomain: emailObj.getDomain(),
        });
        const savedUser = await this.userRepository.create(user);

        // 7. Determine which roles to assign.
        // Admin activation can optionally provide explicit roleIds in the DTO.
        const roleIdsToAssign = dto.roleIds && dto.roleIds.length > 0
            ? dto.roleIds
            : invitation.roleIds;

        // 8. Assign roles using organizationMemberId
        if (roleIdsToAssign && roleIdsToAssign.length > 0) {
            const memberRoles = roleIdsToAssign.map(roleId =>
                MemberRole.create({
                    organizationMemberId: identityResult.organizationMemberId,
                    roleId,
                    productId: dto.productId,
                    assignedBy: invitation.invitedBy,
                }),
            );
            await this.memberRoleRepository.bulkCreate(memberRoles);
        }

        // 9. Mark invitation as accepted
        invitation.accept();
        await this.invitationRepository.update(invitation);

        return UserMapper.toResponseDto(savedUser);
    }
}


