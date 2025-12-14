import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { IEmployeeInvitationRepository } from '../../../domain/repositories/employee-invitation.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { MemberRole } from '../../../domain/entities/user-role.entity';
import { AcceptInvitationDto } from '../../dtos/invitations/accept-invitation.dto';
import { UserResponseDto } from '../../dtos/users/user-response.dto';
import { UserMapper } from '../../mappers/user.mapper';
import { AccountType, AuthProvider } from '../../../domain/enums';
import * as bcrypt from 'bcrypt';

/**
 * Admin Activate Invitation Use Case
 * Allows an admin to activate an employee invitation by ID and set the user's password.
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

        // 4. Check if user already exists (double check)
        const existingUser = await this.userRepository.findByEmail(invitation.email);
        if (existingUser) {
            throw new ConflictException(`User with email ${invitation.email} already exists`);
        }

        // 5. Create user with hashed password
        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = User.create({
            tenantId: invitation.tenantId,
            email: invitation.email,
            passwordHash,
            authProvider: AuthProvider.LOCAL,
            firstName: dto.firstName,
            lastName: dto.lastName,
            isActive: true,
            isEmailVerified: true,
            accountType: AccountType.INDIVIDUAL,
            isCompanyOwner: false,
            isSyncedFromAd: false,
        });

        const savedUser = await this.userRepository.create(user);

        // 6. Determine which roles to assign.
        // Admin activation can optionally provide explicit roleIds in the DTO.
        const roleIdsToAssign = dto.roleIds && dto.roleIds.length > 0
            ? dto.roleIds
            : invitation.roleIds;

        // 7. Assign roles if any were included on the invitation / DTO
        // TODO: This needs to be updated to work with organization_members instead of users
        // For now, keeping the old flow but using new repository names
        // This will need comprehensive refactoring to create identity → organization_member → roles
        if (roleIdsToAssign && roleIdsToAssign.length > 0) {
            // NOTE: This is a temporary workaround - savedUser.id is still user.id, not organizationMemberId
            // This use case needs to be refactored to create identity and organization member first
            const memberRoles = roleIdsToAssign.map(roleId =>
                MemberRole.create({
                    organizationMemberId: savedUser.id, // TODO: Replace with actual organizationMemberId
                    roleId,
                    productId: dto.productId,
                    assignedBy: invitation.invitedBy,
                }),
            );
            await this.memberRoleRepository.bulkCreate(memberRoles);
        }

        // 8. Mark invitation as accepted
        invitation.accept();
        await this.invitationRepository.update(invitation);

        return UserMapper.toResponseDto(savedUser);
    }
}


