import { Injectable, Inject } from '@nestjs/common';
import { IEmployeeInvitationRepository } from '../../../domain/repositories/employee-invitation.repository.interface';
import { InvitationResponseDto } from '../../dtos/invitations/invitation-response.dto';
import { InvitationMapper } from '../../mappers/invitation.mapper';

/**
 * List Invitations Use Case
 * Retrieves all invitations for a tenant
 */
@Injectable()
export class ListInvitationsUseCase {
    constructor(
        @Inject('IEmployeeInvitationRepository')
        private readonly invitationRepository: IEmployeeInvitationRepository,
    ) { }

    async execute(tenantId: string): Promise<InvitationResponseDto[]> {
        const invitations = await this.invitationRepository.findByTenantId(tenantId);
        return InvitationMapper.toResponseDtoArray(invitations);
    }
}
