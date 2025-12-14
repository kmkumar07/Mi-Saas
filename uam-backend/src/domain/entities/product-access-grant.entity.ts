export interface ProductAccessGrantProps {
    id: string;
    organizationMemberId: string;
    productId: string;
    tenantId: string;
    grantedBy?: string | null;
    grantedAt: Date;
    createdAt: Date;
}

/**
 * Product Access Grant Entity
 * Represents product-level access control
 * 
 * CRITICAL RULES:
 * - Product owners MUST also be organization_members (enforced by FK)
 * - Product access is an ADDITIVE layer, not a replacement for membership
 * - Product access determines which products an identity can access within a tenant
 * - Product access is independent of RBAC roles and tenant admin status
 * - Product access MUST be checked before or alongside RBAC
 * - Product access does NOT bypass RBAC - RBAC still applies for feature permissions
 * 
 * This entity enforces scope control: determines WHO can access WHICH products,
 * while RBAC determines WHAT actions are allowed within those products.
 */
export class ProductAccessGrant {
    private constructor(private readonly props: ProductAccessGrantProps) { }

    /**
     * Factory method for creating new product access grants
     */
    static create(props: Omit<ProductAccessGrantProps, 'id' | 'grantedAt' | 'createdAt'>): ProductAccessGrant {
        const now = new Date();
        return new ProductAccessGrant({
            ...props,
            id: crypto.randomUUID(),
            grantedAt: now,
            createdAt: now,
        });
    }

    /**
     * Factory method for reconstituting from database
     */
    static fromPersistence(props: ProductAccessGrantProps): ProductAccessGrant {
        return new ProductAccessGrant(props);
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get organizationMemberId(): string {
        return this.props.organizationMemberId;
    }

    get productId(): string {
        return this.props.productId;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get grantedBy(): string | null | undefined {
        return this.props.grantedBy;
    }

    get grantedAt(): Date {
        return this.props.grantedAt;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    /**
     * Check if grant allows access to a specific product
     * This is a scope check - determines if member can access the product
     * NOTE: This does NOT grant feature permissions - RBAC still applies
     */
    allowsAccessToProduct(productId: string, tenantId: string): boolean {
        return this.props.productId === productId && this.props.tenantId === tenantId;
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): ProductAccessGrantProps {
        return { ...this.props };
    }
}

