import { AuditLog } from '../entities/audit-log.entity';
import { AuditAction } from '../enums';

/**
 * AuditLog Repository Interface
 * Defines contract for audit log persistence operations
 * Follows Interface Segregation Principle and Dependency Inversion Principle
 */
export interface IAuditLogRepository {
    findById(id: string): Promise<AuditLog | null>;
    findByUserId(userId: string, limit?: number): Promise<AuditLog[]>;
    findByTenantId(tenantId: string, limit?: number): Promise<AuditLog[]>;
    findByAction(action: AuditAction, tenantId: string, limit?: number): Promise<AuditLog[]>;
    findByResourceId(resourceId: string, resourceType: string): Promise<AuditLog[]>;
    create(auditLog: AuditLog): Promise<AuditLog>;
    deleteOlderThan(date: Date): Promise<void>;
}
