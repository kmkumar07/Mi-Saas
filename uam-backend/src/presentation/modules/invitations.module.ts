import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InvitationsController } from '../controllers/invitations.controller';
import { ListInvitationsUseCase } from '../../application/use-cases/invitations/list-invitations.use-case';
import { SendInvitationUseCase } from '../../application/use-cases/invitations/send-invitation.use-case';
import { AcceptInvitationUseCase } from '../../application/use-cases/invitations/accept-invitation.use-case';
import { RevokeInvitationUseCase } from '../../application/use-cases/invitations/revoke-invitation.use-case';
import { AdminActivateInvitationUseCase } from '../../application/use-cases/invitations/admin-activate-invitation.use-case';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            signOptions: { expiresIn: '15m' },
        }),
    ],
    controllers: [InvitationsController],
    providers: [
        ListInvitationsUseCase,
        SendInvitationUseCase,
        AcceptInvitationUseCase,
        RevokeInvitationUseCase,
        AdminActivateInvitationUseCase,
    ],
    exports: [
        ListInvitationsUseCase,
        SendInvitationUseCase,
        AcceptInvitationUseCase,
        RevokeInvitationUseCase,
        AdminActivateInvitationUseCase,
    ],
})
export class InvitationsModule { }
