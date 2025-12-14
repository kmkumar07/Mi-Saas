import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IOrganizationAdminRepository } from '../../../domain/repositories/organization-admin.repository.interface';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';

export interface GetOrganizationAdminInput {
    tenantId: string;
}

export interface GetOrganizationAdminOutput {
    organizationMemberId: string;
    organizationAdminId: string;
}

/**
 * Get Organization Admin Use Case
 * Gets the organization admin for a tenant.
 * Returns the organization member ID of the admin.
 */
@Injectable()
export class GetOrganizationAdminUseCase {
    constructor(
        @Inject('IOrganizationAdminRepository')
        private readonly organizationAdminRepository: IOrganizationAdminRepository,
        @Inject('IOrganizationMemberRepository')
        private readonly organizationMemberRepository: IOrganizationMemberRepository,
    ) { }

    async execute(input: GetOrganizationAdminInput): Promise<GetOrganizationAdminOutput> {
        const { tenantId } = input;

        // 1. Find organization admins for tenant
        const admins = await this.organizationAdminRepository.findByTenantId(tenantId);

        if (!admins || admins.length === 0) {
            throw new NotFoundException(`No organization admin found for tenant ${tenantId}`);
        }

        // 2. Get the first admin (there should typically be one admin per tenant)
        const admin = admins[0];

        // 3. Verify the organization member exists and is active
        const member = await this.organizationMemberRepository.findActiveById(admin.organizationMemberId);
        if (!member) {
            throw new NotFoundException(`Organization member ${admin.organizationMemberId} not found or inactive`);
        }

        return {
            organizationMemberId: admin.organizationMemberId,
            organizationAdminId: admin.id,
        };
    }
}

