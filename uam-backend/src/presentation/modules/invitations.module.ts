import { Module } from '@nestjs/common';
import { InvitationsController } from '../controllers/invitations.controller';
import { ListInvitationsUseCase } from '../../application/use-cases/invitations/list-invitations.use-case';
import { SendInvitationUseCase } from '../../application/use-cases/invitations/send-invitation.use-case';
import { AcceptInvitationUseCase } from '../../application/use-cases/invitations/accept-invitation.use-case';
import { RevokeInvitationUseCase } from '../../application/use-cases/invitations/revoke-invitation.use-case';

@Module({
    controllers: [InvitationsController],
    providers: [
        ListInvitationsUseCase,
        SendInvitationUseCase,
        AcceptInvitationUseCase,
        RevokeInvitationUseCase,
    ],
    exports: [
        ListInvitationsUseCase,
        SendInvitationUseCase,
        AcceptInvitationUseCase,
        RevokeInvitationUseCase,
    ],
})
export class InvitationsModule { }
