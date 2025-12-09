import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IEmployeeInvitationRepository } from '../../../domain/repositories/employee-invitation.repository.interface';

/**
 * Revoke Invitation Use Case
 * Revokes a pending invitation
 */
@Injectable()
export class RevokeInvitationUseCase {
    constructor(
        @Inject('IEmployeeInvitationRepository')
        private readonly invitationRepository: IEmployeeInvitationRepository,
    ) { }

    async execute(invitationId: string): Promise<void> {
        // 1. Find invitation
        const invitation = await this.invitationRepository.findById(invitationId);
        if (!invitation) {
            throw new NotFoundException(`Invitation with ID ${invitationId} not found`);
        }

        // 2. Validate status
        if (!invitation.isPending()) {
            throw new BadRequestException(`Cannot revoke invitation with status ${invitation.status}`);
        }

        // 3. Revoke
        invitation.revoke();
        await this.invitationRepository.update(invitation);
    }
}
