import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, lt } from 'drizzle-orm';
import { IEmployeeInvitationRepository } from '../../../domain/repositories/employee-invitation.repository.interface';
import { EmployeeInvitation } from '../../../domain/entities/employee-invitation.entity';
import { InvitationStatus } from '../../../domain/enums';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

@Injectable()
export class EmployeeInvitationRepository implements IEmployeeInvitationRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<EmployeeInvitation | null> {
        const result = await this.db
            .select()
            .from(schema.employeeInvitations)
            .where(eq(schema.employeeInvitations.id, id))
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByToken(token: string): Promise<EmployeeInvitation | null> {
        const result = await this.db
            .select()
            .from(schema.employeeInvitations)
            .where(eq(schema.employeeInvitations.invitationToken, token))
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByTenantId(tenantId: string, status?: InvitationStatus): Promise<EmployeeInvitation[]> {
        const conditions = [eq(schema.employeeInvitations.tenantId, tenantId)];

        if (status) {
            conditions.push(eq(schema.employeeInvitations.status, status));
        }

        const results = await this.db
            .select()
            .from(schema.employeeInvitations)
            .where(and(...conditions));

        return results.map(row => this.toDomain(row));
    }

    async create(invitation: EmployeeInvitation): Promise<EmployeeInvitation> {
        const persistence = invitation.toPersistence();
        const result = await this.db
            .insert(schema.employeeInvitations)
            .values(persistence as any)
            .returning();
        return this.toDomain(result[0]);
    }

    async update(invitation: EmployeeInvitation): Promise<EmployeeInvitation> {
        const persistence = invitation.toPersistence();
        const result = await this.db
            .update(schema.employeeInvitations)
            .set(persistence as any)
            .where(eq(schema.employeeInvitations.id, persistence.id))
            .returning();
        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.employeeInvitations)
            .where(eq(schema.employeeInvitations.id, id));
    }

    async findExpiredInvitations(): Promise<EmployeeInvitation[]> {
        const now = new Date();
        const results = await this.db
            .select()
            .from(schema.employeeInvitations)
            .where(
                and(
                    eq(schema.employeeInvitations.status, 'pending'),
                    lt(schema.employeeInvitations.expiresAt, now)
                )
            );
        return results.map(row => this.toDomain(row));
    }

    private toDomain(row: typeof schema.employeeInvitations.$inferSelect): EmployeeInvitation {
        return EmployeeInvitation.fromPersistence({
            id: row.id,
            tenantId: row.tenantId,
            email: row.email,
            invitedBy: row.invitedBy,
            invitationToken: row.invitationToken,
            roleIds: row.roleIds,
            status: row.status as InvitationStatus,
            expiresAt: row.expiresAt,
            acceptedAt: row.acceptedAt,
            createdAt: row.createdAt,
        });
    }
}
