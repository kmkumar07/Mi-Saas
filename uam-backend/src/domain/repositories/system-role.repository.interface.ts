import { SystemRole } from '../entities/system-role.entity';

export interface ISystemRoleRepository {
    findById(id: string): Promise<SystemRole | null>;
    findByCode(code: string, tenantId?: string | null): Promise<SystemRole | null>;
    findAll(tenantId?: string | null): Promise<SystemRole[]>;
    findGlobalRoles(): Promise<SystemRole[]>;
    create(role: SystemRole): Promise<SystemRole>;
    update(role: SystemRole): Promise<SystemRole>;
    delete(id: string): Promise<void>;
}
