import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IProductAccessGrantRepository } from '../../../domain/repositories/product-access-grant.repository.interface';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';
import { ProductAccessGrant } from '../../../domain/entities/product-access-grant.entity';

export interface SyncProductAccessInput {
    tenantId: string;
    organizationMemberId: string;
    productIds: string[];
}

export interface SyncProductAccessOutput {
    grantsCreated: number;
    grantsSkipped: number;
}

/**
 * Sync Product Access Use Case
 * Grants product access for organization member.
 * Handles bulk operations and skips if access already exists (idempotent).
 */
@Injectable()
export class SyncProductAccessUseCase {
    constructor(
        @Inject('IProductAccessGrantRepository')
        private readonly productAccessGrantRepository: IProductAccessGrantRepository,
        @Inject('IOrganizationMemberRepository')
        private readonly organizationMemberRepository: IOrganizationMemberRepository,
    ) { }

    async execute(input: SyncProductAccessInput): Promise<SyncProductAccessOutput> {
        const { tenantId, organizationMemberId, productIds } = input;

        // 1. Validate organization member exists and is active
        const member = await this.organizationMemberRepository.findActiveById(organizationMemberId);
        if (!member) {
            throw new NotFoundException(`Active organization member ${organizationMemberId} not found`);
        }

        if (member.tenantId !== tenantId) {
            throw new NotFoundException(`Organization member does not belong to tenant ${tenantId}`);
        }

        let grantsCreated = 0;
        let grantsSkipped = 0;

        // 2. Create product access grants for each product
        for (const productId of productIds) {
            // Check if access already exists (idempotency)
            const exists = await this.productAccessGrantRepository.existsByOrganizationMemberIdAndProductIdAndTenantId(
                organizationMemberId,
                productId,
                tenantId
            );

            if (exists) {
                grantsSkipped++;
                continue;
            }

            // Create new grant
            const grant = ProductAccessGrant.create({
                tenantId,
                organizationMemberId,
                productId,
                grantedBy: organizationMemberId, // Self-granted during activation
            });

            await this.productAccessGrantRepository.create(grant);
            grantsCreated++;
        }

        return {
            grantsCreated,
            grantsSkipped,
        };
    }
}

