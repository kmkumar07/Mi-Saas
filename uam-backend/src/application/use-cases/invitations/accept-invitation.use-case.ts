import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { IEmployeeInvitationRepository } from '../../../domain/repositories/employee-invitation.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { EmployeeInvitation } from '../../../domain/entities/employee-invitation.entity';
import { User } from '../../../domain/entities/user.entity';
import { MemberRole } from '../../../domain/entities/user-role.entity';
import { AcceptInvitationDto } from '../../dtos/invitations/accept-invitation.dto';
import { UserResponseDto } from '../../dtos/users/user-response.dto';
import { UserMapper } from '../../mappers/user.mapper';
import { AccountType, AuthProvider } from '../../../domain/enums';
import * as bcrypt from 'bcrypt';

/**
 * Accept Invitation Use Case
 * Accepts an invitation and creates user account
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

        // 3. Check if user already exists (double check)
        const existingUser = await this.userRepository.findByEmail(invitation.email);
        if (existingUser) {
            throw new ConflictException(`User with email ${invitation.email} already exists`);
        }

        // 4. Create user
        // Hash the password before storing
        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = User.create({
            tenantId: invitation.tenantId,
            email: invitation.email,
            passwordHash,
            authProvider: AuthProvider.LOCAL,
            firstName: dto.firstName,
            lastName: dto.lastName,
            isActive: true,
            isEmailVerified: true, // Verified via invitation
            accountType: AccountType.INDIVIDUAL, // Default for employees
            isCompanyOwner: false,
            isSyncedFromAd: false,
        });

        const savedUser = await this.userRepository.create(user);

        // 5. Assign roles
        // TODO: This needs to be updated to work with organization_members instead of users
        // For now, keeping the old flow but using new repository names
        // This will need comprehensive refactoring to create identity → organization_member → roles
        if (invitation.roleIds && invitation.roleIds.length > 0) {
            // NOTE: This is a temporary workaround - savedUser.id is still user.id, not organizationMemberId
            // This use case needs to be refactored to create identity and organization member first
            const memberRoles = invitation.roleIds.map(roleId =>
                MemberRole.create({
                    organizationMemberId: savedUser.id, // TODO: Replace with actual organizationMemberId
                    roleId,
                    assignedBy: invitation.invitedBy,
                })
            );
            await this.memberRoleRepository.bulkCreate(memberRoles);
        }

        // 6. Mark invitation as accepted
        invitation.accept();
        await this.invitationRepository.update(invitation);

        return UserMapper.toResponseDto(savedUser);
    }
}
