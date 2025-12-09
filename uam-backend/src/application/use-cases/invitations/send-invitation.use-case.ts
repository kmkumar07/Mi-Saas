import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { IEmployeeInvitationRepository } from '../../../domain/repositories/employee-invitation.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { EmployeeInvitation } from '../../../domain/entities/employee-invitation.entity';
import { SendInvitationDto } from '../../dtos/invitations/send-invitation.dto';
import { InvitationResponseDto } from '../../dtos/invitations/invitation-response.dto';
import { InvitationMapper } from '../../mappers/invitation.mapper';
import { InvitationStatus } from '../../../domain/enums';

/**
 * Send Invitation Use Case
 * Sends an employee invitation
 */
@Injectable()
export class SendInvitationUseCase {
    constructor(
        @Inject('IEmployeeInvitationRepository')
        private readonly invitationRepository: IEmployeeInvitationRepository,
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(tenantId: string, invitedBy: string, dto: SendInvitationDto): Promise<InvitationResponseDto> {
        // 1. Check if user already exists
        const existingUser = await this.userRepository.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException(`User with email ${dto.email} already exists`);
        }

        // ...

        // 2. Check if pending invitation already exists
        const existingInvitation = await this.invitationRepository.findByTenantId(tenantId, InvitationStatus.PENDING);
        const duplicate = existingInvitation.find(i => i.email === dto.email);
        if (duplicate) {
            throw new ConflictException(`Pending invitation already sent to ${dto.email}`);
        }

        // ...

        // 4. Create invitation
        const invitation = EmployeeInvitation.create({
            tenantId,
            email: dto.email,
            invitedBy,
            roleIds: dto.roleIds,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
        });

        // 5. Persist invitation
        const savedInvitation = await this.invitationRepository.create(invitation);

        // 6. TODO: Send email with invitation link
        // For now, we just return the invitation with the token

        return InvitationMapper.toResponseDto(savedInvitation);
    }
}
