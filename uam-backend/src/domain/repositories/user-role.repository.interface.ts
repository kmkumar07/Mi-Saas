import { MemberRole } from '../entities/user-role.entity';

/**
 * Member Role Repository Interface
 * RENAMED from IUserRoleRepository to reflect new permission model
 * 
 * CRITICAL: RBAC subject is always organization_members.id, never identity.id
 * This ensures RBAC is tenant-scoped and respects the membership requirement.
 */
export interface IMemberRoleRepository {
    findById(id: string): Promise<MemberRole | null>;
    findByOrganizationMemberId(organizationMemberId: string): Promise<MemberRole[]>;
    findByOrganizationMemberIdAndRoleId(organizationMemberId: string, roleId: string): Promise<MemberRole | null>;
    create(memberRole: MemberRole): Promise<MemberRole>;
    bulkCreate(memberRoles: MemberRole[]): Promise<MemberRole[]>;
    delete(id: string): Promise<void>;
    deleteByOrganizationMemberIdAndRoleId(organizationMemberId: string, roleId: string): Promise<void>;
}
