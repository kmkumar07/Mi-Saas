import { Injectable } from '@nestjs/common';
import { IAuditLogRepository } from '../../../domain/repositories/audit-log.repository.interface';
import { AuditLog } from '../../../domain/entities/audit-log.entity';
import { AuditAction } from '../../../domain/enums';

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
    async findById(id: string): Promise<AuditLog | null> {
        throw new Error('Method not implemented.');
    }
    async findByUserId(userId: string, limit?: number): Promise<AuditLog[]> {
        throw new Error('Method not implemented.');
    }
    async findByTenantId(tenantId: string, limit?: number): Promise<AuditLog[]> {
        throw new Error('Method not implemented.');
    }
    async findByAction(action: AuditAction, tenantId: string, limit?: number): Promise<AuditLog[]> {
        throw new Error('Method not implemented.');
    }
    async findByResourceId(resourceId: string, resourceType: string): Promise<AuditLog[]> {
        throw new Error('Method not implemented.');
    }
    async create(auditLog: AuditLog): Promise<AuditLog> {
        throw new Error('Method not implemented.');
    }
    async deleteOlderThan(date: Date): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
