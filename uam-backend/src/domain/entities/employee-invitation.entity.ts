import { InvitationStatus } from '../enums';

export interface EmployeeInvitationProps {
    id: string;
    tenantId: string;
    email: string;
    invitedBy?: string | null;
    invitationToken: string;
    roleIds: string[];
    status: InvitationStatus;
    expiresAt: Date;
    acceptedAt?: Date | null;
    createdAt: Date;
}

/**
 * EmployeeInvitation Entity
 * Manages the invitation workflow for new employees
 */
export class EmployeeInvitation {
    private constructor(private readonly props: EmployeeInvitationProps) { }

    static create(
        props: Omit<EmployeeInvitationProps, 'id' | 'invitationToken' | 'status' | 'createdAt'>
    ): EmployeeInvitation {
        return new EmployeeInvitation({
            ...props,
            id: crypto.randomUUID(),
            invitationToken: crypto.randomUUID(),
            status: InvitationStatus.PENDING,
            createdAt: new Date(),
        });
    }

    static fromPersistence(props: EmployeeInvitationProps): EmployeeInvitation {
        return new EmployeeInvitation(props);
    }

    get id(): string {
        return this.props.id;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get email(): string {
        return this.props.email;
    }

    get invitedBy(): string | null | undefined {
        return this.props.invitedBy;
    }

    get invitationToken(): string {
        return this.props.invitationToken;
    }

    get roleIds(): string[] {
        return this.props.roleIds;
    }

    get status(): InvitationStatus {
        return this.props.status;
    }

    get expiresAt(): Date {
        return this.props.expiresAt;
    }

    get acceptedAt(): Date | null | undefined {
        return this.props.acceptedAt;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    /**
     * Check if invitation is expired
     */
    isExpired(): boolean {
        return new Date() > this.props.expiresAt;
    }

    /**
     * Check if invitation is pending
     */
    isPending(): boolean {
        return this.props.status === InvitationStatus.PENDING;
    }

    /**
     * Accept invitation
     * Business rule: Can only accept pending invitations that haven't expired
     */
    accept(): void {
        if (!this.isPending()) {
            throw new Error('Invitation is not pending');
        }
        if (this.isExpired()) {
            throw new Error('Invitation has expired');
        }
        this.props.status = InvitationStatus.ACCEPTED;
        this.props.acceptedAt = new Date();
    }

    /**
     * Revoke invitation
     * Business rule: Can only revoke pending invitations
     */
    revoke(): void {
        if (!this.isPending()) {
            throw new Error('Can only revoke pending invitations');
        }
        this.props.status = InvitationStatus.REVOKED;
    }

    /**
     * Mark as expired
     */
    markAsExpired(): void {
        if (this.isPending() && this.isExpired()) {
            this.props.status = InvitationStatus.EXPIRED;
        }
    }

    toPersistence(): EmployeeInvitationProps {
        return { ...this.props };
    }
}
