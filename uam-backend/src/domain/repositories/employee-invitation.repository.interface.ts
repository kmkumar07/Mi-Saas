import { EmployeeInvitation } from '../entities/employee-invitation.entity';
import { InvitationStatus } from '../enums';

export interface IEmployeeInvitationRepository {
    findById(id: string): Promise<EmployeeInvitation | null>;
    findByToken(token: string): Promise<EmployeeInvitation | null>;
    findByTenantId(tenantId: string, status?: InvitationStatus): Promise<EmployeeInvitation[]>;
    create(invitation: EmployeeInvitation): Promise<EmployeeInvitation>;
    update(invitation: EmployeeInvitation): Promise<EmployeeInvitation>;
    delete(id: string): Promise<void>;
    findExpiredInvitations(): Promise<EmployeeInvitation[]>;
}
